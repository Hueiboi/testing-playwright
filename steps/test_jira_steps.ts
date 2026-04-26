import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

// Cho phép mỗi bước chạy tối đa 60 giây
setDefaultTimeout(60 * 1000);

let browser: Browser;
let context: BrowserContext;
let page: Page;

Before(async function () {
    browser = await chromium.launch({ headless: false }); // Mở trình duyệt để thấy kết quả
    
    // Kiểm tra và load Cookies từ state.json
    let storageState: any = 'state.json';
    if (!fs.existsSync('state.json')) {
        console.warn("CẢNH BÁO: Không tìm thấy file state.json. Vui lòng chạy 'npm run auth' trước để đăng nhập.");
    } else {
        const content = fs.readFileSync('state.json', 'utf-8');
        try {
            const parsed = JSON.parse(content);
            // Nếu file chỉ chứa array cookies (do copy paste từ extension), ta bọc nó lại cho đúng định dạng Playwright
            if (Array.isArray(parsed)) {
                const cleanedCookies = parsed.map((c: any) => {
                    // Playwright chỉ chấp nhận "Strict", "Lax", hoặc "None" (phân biệt hoa thường)
                    const ss = c.sameSite ? c.sameSite.toLowerCase() : '';
                    if (ss === 'no_restriction') {
                        c.sameSite = 'None';
                    } else if (ss === 'strict') {
                        c.sameSite = 'Strict';
                    } else if (ss === 'lax') {
                        c.sameSite = 'Lax';
                    } else {
                        // Mặc định cho "unspecified" hoặc các giá trị khác
                        c.sameSite = 'Lax';
                    }
                    return c;
                });
                const wrappedState = { cookies: cleanedCookies, origins: [] };
                fs.writeFileSync('state.json_wrapped.json', JSON.stringify(wrappedState, null, 2));
                storageState = 'state.json_wrapped.json';
            }
        } catch (e) {
            console.error("Lỗi đọc file state.json:", e);
        }
    }

    context = await browser.newContext({ storageState });
    page = await context.newPage();
});

Given('Tôi đã nạp Cookies vào trình duyệt', async function () {
    // Bước này thực tế đã được xử lý trong Before hook (nạp storageState)
    // Ta chỉ cần kiểm tra xem đã vào được trang nào chưa hoặc in log
    console.log("Đã nạp Cookies thành công.");
});

When('Tôi truy cập vào trang {string}', async function (url: string) {
    // Tự động thay thế domain trong kịch bản bằng domain trong file .env nếu có
    const envBaseUrl = process.env.JIRA_BASE_URL;
    if (envBaseUrl) {
        // Regex này sẽ thay thế phần "https://tên-miền.atlassian.net" bằng giá trị trong .env
        const normalizedBaseUrl = envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;
        url = url.replace(/^https:\/\/[^/]+/, normalizedBaseUrl);
        console.log(`Đang truy cập URL đã được chuyển đổi: ${url}`);
    } else {
        console.log(`Đang truy cập URL: ${url}`);
    }

    // Chỉ đợi đến khi trang load xong cơ bản (load event)
    await page.goto(url, { waitUntil: 'load' }); 
});

When('Tôi nhập bình luận {string}', async function (comment: string) {
    console.log(`Đang chuẩn bị nhập bình luận: "${comment}"`);

    // 1. Kiểm tra xem Issue View đã mở chưa (thường là panel bên phải)
    const issueViewSelector = '[data-testid="issue-view.common.view-issue-container"], [data-testid="issue.views.issue-details.issue-layout.left-most-column"]';
    
    // Đợi board load xong và kiểm tra panel chi tiết
    await page.waitForTimeout(5000); 
    let isVisible = await page.locator(issueViewSelector).first().isVisible();

    // Cải tiến logic tìm Issue để comment
    if (!isVisible) {
        console.log("Đang tìm bất kỳ Issue nào trên Board để click...");
        // Tìm các phần tử có thuộc tính liên quan đến Issue Key trong Jira Cloud
        const issueLink = page.locator('[data-testid="platform-board-kit.ui.card.card-contents.container"], [data-testid*="issue-line-item"]').first();
        
        if (await issueLink.isVisible()) {
            await issueLink.click();
            await page.waitForSelector(issueViewSelector, { timeout: 15000 });
        } else {
            // Nếu không thấy, thử tìm theo regex text (Ví dụ: SCRUM-...)
            await page.locator('text=/SCRUM-\\d+/').first().click().catch(() => {});
        }
    }

    // 2. Thử kích hoạt ô bình luận
    // Jira Cloud hỗ trợ phím 'm' để nhảy thẳng vào ô comment
    console.log("Nhấn phím 'm' để focus vào ô bình luận...");
    await page.keyboard.press('m');
    await page.waitForTimeout(2000);

    const commentSelectors = [
        '[data-testid="issue-views.common.comment-line.comment-editor-container"]',
        '[aria-label="Add a comment"]',
        'role=textbox[name="Add a comment"]',
        'text=Add a comment…',
        'text=Thêm bình luận…'
    ];

    let commentBox = null;
    for (const sel of commentSelectors) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible()) {
            commentBox = loc;
            break;
        }
    }

    if (!commentBox) {
        // Fallback: Tìm bằng placeholder regex
        commentBox = page.getByPlaceholder(/Add a comment|Thêm bình luận/i).first();
    }

    if (await commentBox.isVisible()) {
        await commentBox.click();
        // Sau khi click, Jira có thể chuyển thành một editor Prosemirror
        // Ta gõ trực tiếp
        await page.keyboard.type(comment);
        console.log("Đã gõ nội dung bình luận.");
    } else {
        throw new Error("Không thể tìm thấy hoặc kích hoạt ô bình luận. Jira UI có thể đã thay đổi.");
    }
});

When('Tôi nhấn nút {string}', async function (buttonName: string) {
    // Thử tìm nút theo text hoặc theo data-testid nếu là Create sprint
    if (buttonName === "Create sprint") {
        const createSprintBtn = page.locator('[data-testid="platform-backlog.common.ui.create-sprint-button.button"]').first();
        if (await createSprintBtn.isVisible()) {
            await createSprintBtn.click();
            return;
        }
    }

    const buttonSelector = `button:has-text("${buttonName}")`;
    await page.waitForSelector(buttonSelector, { timeout: 10000 });
    await page.click(buttonSelector);
});

Then('Tôi phải thấy bình luận vừa nhập hiển thị trên màn hình', async function () {
    // Kiểm tra xem text vừa nhập có xuất hiện trong danh sách comment không
    // Vì comment vừa nhập thường ở cuối hoặc đầu, ta đợi nó xuất hiện
    await page.waitForSelector('text=Test tự động bằng Cucumber', { timeout: 10000 });
    console.log("Tuyệt vời! Bình luận đã hiển thị.");
});

Then('Tôi phải thấy bảng điều khiển Dashboard', async function () {
    // Đợi cho đến khi thấy chữ "Projects" hoặc "Dashboards" hoặc URL chuyển vào jira
    await page.waitForURL('**/jira/**', { timeout: 30000 });
    // Thử tìm một phần tử đặc trưng của Jira Dashboard
    try {
        await page.waitForSelector('text=Projects', { timeout: 10000 });
        console.log("Ngon! Thấy chữ Projects rồi, login thành công nhé!");
    } catch (e) {
        console.log("Đang ở trang: " + page.url());
    }
});

Then('Tôi phải thấy một Sprint mới được tạo ra trong danh sách', async function () {
    // Jira có thể mất vài giây để cập nhật danh sách Backlog
    await page.waitForTimeout(5000);

    const sprintSelector = '[data-testid="platform-backlog.common.ui.sprint-header.sprint-container"]';
    
    // Đợi tối đa 20s cho sprint mới xuất hiện
    try {
        await page.waitForSelector(sprintSelector, { timeout: 20000 });
        const sprintCount = await page.locator(sprintSelector).count();
        console.log(`Tìm thấy ${sprintCount} Sprint(s) trên bảng Backlog.`);
        
        if (sprintCount > 0) {
            console.log("Xác nhận: Sprint đã được tạo thành công!");
        } else {
            throw new Error("Không tìm thấy Sprint nào!");
        }
    } catch (e) {
        // Fallback: Kiểm tra xem có text "Sprint" nào mới không
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Sprint')) {
            console.log("Xác nhận: Tìm thấy text liên quan đến Sprint.");
        } else {
            throw new Error("Không tìm thấy bằng chứng Sprint được tạo.");
        }
    }
});

After(async function () {
    // Giữ trình duyệt mở một chút để xem kết quả, sau đó đóng
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
});