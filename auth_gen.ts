import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load biến môi trường từ file .env
dotenv.config();

(async () => {
    const email = process.env.JIRA_EMAIL;
    const password = process.env.JIRA_PASSWORD;

    if (!email || !password) {
        console.error("LỖI: Vui lòng điền JIRA_EMAIL và JIRA_PASSWORD vào file .env");
        process.exit(1);
    }

    console.log(`Đang khởi tạo trình duyệt để đăng nhập cho: ${email}...`);
    const browser = await chromium.launch({ headless: false }); 
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Đang truy cập trang đăng nhập Atlassian ID...");
        // Đổi sang 'load' vì Jira gửi analytics liên tục khiến 'networkidle' bị timeout
        await page.goto('https://id.atlassian.com/login', { waitUntil: 'load', timeout: 60000000 });

        // 1. Nhập Email
        console.log("Đang tìm ô nhập email...");
        await page.waitForTimeout(2000); // Đợi 2 giây thôi bạn nhé, 200 giây lâu quá

        const emailSelectors = ['#username', 'input[name="username"]', 'input[type="email"]'];
        let emailFilled = false;

        for (const selector of emailSelectors) {
            try {
                const locator = page.locator(selector).first();
                if (await locator.isVisible()) {
                    await locator.fill(email);
                    emailFilled = true;
                    break;
                }
            } catch (e) {}
        }

        if (!emailFilled) {
            console.log("Không tìm thấy ô email bằng script, bạn hãy click vào ô nhập email trên trình duyệt nhé...");
            await page.waitForSelector('#username', { timeout: 15000 });
            await page.fill('#username', email);
        }

        await page.click('#login-submit');

        // 2. Đợi và Nhập Password
        console.log("Đang đợi ô mật khẩu...");
        await page.waitForSelector('#password', { timeout: 20000 });
        await page.waitForTimeout(1000);
        await page.fill('#password', password);
        await page.click('#login-submit');

        // 3. Đợi đăng nhập thành công (vào tới trang dashboard hoặc software hoặc home)
        console.log("--------------------------------------------------");
        console.log("CHÚ Ý: Nếu Jira yêu cầu mã xác thực (MFA/OTP), bạn hãy nhập tay vào trình duyệt.");
        console.log("Robot sẽ đợi cho đến khi bạn vào được bên trong Jira hoặc trang Home...");
        console.log("--------------------------------------------------");
        
        // Chấp nhận cả url jira hoặc home sau khi login
        await page.waitForURL(/(jira|home)\.atlassian\.com/, { timeout: 300000 }); 

        // Đợi thêm 2s để chắc chắn các cookies được nạp đủ
        await page.waitForTimeout(2000);

        // 4. Lưu trạng thái đăng nhập
        await context.storageState({ path: 'state.json' });
        console.log("--------------------------------------------------");
        console.log("THÀNH CÔNG: Đã lưu trạng thái đăng nhập vào state.json");
        console.log("Giờ bạn có thể chạy 'npm test' mà không cần đăng nhập lại.");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("CÓ LỖI XẢY RA TRONG QUÁ TRÌNH ĐĂNG NHẬP:");
        console.error(error);
        console.log("\nGợi ý: Nếu có CAPTCHA xuất hiện, bạn hãy giải tay trên trình duyệt rồi đợi robot tiếp tục.");
    } finally {
        // Đóng trình duyệt sau khi xong
        await new Promise(resolve => setTimeout(resolve, 3000));
        await browser.close();
    }
})();