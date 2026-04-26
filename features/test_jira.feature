Feature: Kiểm tra kết nối và tương tác Jira
  Scenario: Truy cập trang chủ Jira bằng Cookies
    Given Tôi đã nạp Cookies vào trình duyệt
    When Tôi truy cập vào trang "https://our-testing.atlassian.net"
    Then Tôi phải thấy bảng điều khiển Dashboard

  Scenario: Viết bình luận vào công việc thành công
    Given Tôi đã nạp Cookies vào trình duyệt
    When Tôi truy cập vào trang "https://our-testing.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-1" 
    And Tôi nhập bình luận "Test tự động bằng Cucumber"
    And Tôi nhấn nút "Save"
    Then Tôi phải thấy bình luận vừa nhập hiển thị trên màn hình

  Scenario: Tạo Sprint mới thành công
    Given Tôi đã nạp Cookies vào trình duyệt
    When Tôi truy cập vào trang "https://our-testing.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog"
    And Tôi nhấn nút "Create sprint"
    Then Tôi phải thấy một Sprint mới được tạo ra trong danh sách