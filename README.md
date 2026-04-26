# Hướng dẫn Chạy Kiểm thử Tự động Jira Cloud

Dự án này sử dụng Playwright và Cucumber để kiểm thử tự động các tính năng trên Jira Cloud (Tạo Sprint, Viết bình luận). 

Để giúp Thầy/Cô có thể chạy kiểm thử một cách dễ dàng nhất, nhóm đã tích hợp công cụ tự động đăng nhập. Thầy/Cô vui lòng thực hiện theo các bước sau:

### Bước 1: Cài đặt môi trường
Thầy/Cô mở terminal tại thư mục dự án và chạy lệnh sau để cài đặt các thư viện cần thiết:
```bash
npm install
```

### Bước 2: Cấu hình tài khoản
Thầy/Cô tìm file mang tên `.env.example` trong thư mục gốc, đổi tên nó thành `.env` và điền thông tin tài khoản Jira (Mail rác của nhóm đã cung cấp trong báo cáo) vào các dòng sau:
- `JIRA_EMAIL`: Email đăng nhập.
- `JIRA_PASSWORD`: Mật khẩu.
- `JIRA_BASE_URL`: Link domain Jira của dự án (Ví dụ: https://ten-mien.atlassian.net).

### Bước 3: Đăng nhập tự động (Chỉ chạy 1 lần duy nhất)
Thầy/Cô chạy lệnh sau:
```bash
npm run auth
```
- **Lưu ý:** Trình duyệt sẽ mở lên và tự động điền thông tin. Nếu Jira yêu cầu nhập mã xác nhận (MFA/OTP) gửi về mail hoặc hiện mã CAPTCHA, Thầy/Cô vui lòng thực hiện nhập tay trực tiếp trên trình duyệt đó. Sau khi vào được bên trong Jira, robot sẽ tự động lưu lại trạng thái và đóng trình duyệt.

### Bước 4: Thực thi kiểm thử
Sau khi đã đăng nhập thành công ở Bước 3, Thầy/Cô có thể chạy bài test bất cứ lúc nào bằng lệnh:
```bash
npm run test
```
Robot sẽ tự động vào thẳng các trang chức năng để thực hiện kịch bản mà không cần đăng nhập lại.

---
*Chúc Thầy/Cô có trải nghiệm tốt với bài tập của nhóm chúng em!*# testing-playwright
