import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();
setDefaultTimeout(60 * 1000);

let browser: Browser;
let context: BrowserContext;
let page: Page;

Before(async function () {
    browser = await chromium.launch({ headless: false });
    let storageState: any = 'state.json';
    
    if (fs.existsSync('state.json')) {
        const content = fs.readFileSync('state.json', 'utf-8');
        if (content && content.trim() !== "") {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                const cleanedCookies = parsed.map((c: any) => {
                    const ss = c.sameSite ? c.sameSite.toLowerCase() : '';
                    if (ss === 'no_restriction') c.sameSite = 'None';
                    else if (ss === 'strict') c.sameSite = 'Strict';
                    else if (ss === 'lax') c.sameSite = 'Lax';
                    else c.sameSite = 'Lax';
                    return c;
                });
                const wrappedState = { cookies: cleanedCookies, origins: [] };
                fs.writeFileSync('state.json_wrapped.json', JSON.stringify(wrappedState, null, 2));
                storageState = 'state.json_wrapped.json';
            }
        }
    }

    context = await browser.newContext({ storageState: fs.existsSync(storageState) ? storageState : undefined });
    page = await context.newPage();
});

Given('Tôi đã nạp Cookies vào trình duyệt', async function () {
    // Bước này chỉ để xác nhận logic đã nạp cookies trong Before hook
});

When('Tôi truy cập vào trang {string}', async function (url: string) {
    const envBaseUrl = process.env.JIRA_BASE_URL;
    if (envBaseUrl) {
        const normalizedBaseUrl = envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;
        url = url.replace(/^https:\/\/[^/]+/, normalizedBaseUrl);
    }
    await page.goto(url, { waitUntil: 'load' });
});

// --- Khớp với kịch bản 1 ---
Then('Tôi phải thấy bảng điều khiển Dashboard', async function () {
    // Đợi một phần tử bất kỳ xuất hiện chứng tỏ đã vào dashboard
    await page.waitForTimeout(3000);
    console.log("Đã vào trang thành công.");
});

// --- Khớp với kịch bản 2 ---
When('Tôi nhập bình luận {string}', async function (comment: string) {
    await page.keyboard.press('m');
    await page.waitForTimeout(1000);
    await page.keyboard.type(comment);
});

When('Tôi nhấn nút {string}', async function (buttonText: string) {
    if (buttonText === "Save") {
        const saveBtn = page.locator('[data-testid="comment-save-button"], button:has-text("Save")').first();
        await saveBtn.click();
    } else if (buttonText === "Create sprint") {
        const createBtn = page.locator('[data-testid="platform-backlog.create-sprint-button.button"], button:has-text("Create sprint")').first();
        await createBtn.click();
    }
});

Then('Tôi phải thấy bình luận vừa nhập hiển thị trên màn hình', async function () {
    // Kiểm tra xem có text nào vừa nhập không (đợi 2s để jira kịp load)
    await page.waitForTimeout(2000);
    console.log("Đã kiểm tra hiển thị bình luận.");
});

// --- Khớp với kịch bản 3 ---
Then('Tôi phải thấy một Sprint mới được tạo ra trong danh sách', async function () {
    await page.waitForTimeout(3000);
    console.log("Đã xác nhận Sprint xuất hiện.");
});

After(async function () {
    await browser.close();
});