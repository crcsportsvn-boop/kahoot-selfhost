# 📖 HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN NỀN TẢNG QUIZLIVE (KAHOOT SELF-HOST)

> **QuizLive** là nền tảng trò chơi trắc nghiệm tương tác trực tuyến thời gian thực (tương tự Kahoot), hoạt động hoàn toàn trên nền tảng Serverless hiện đại (Next.js 14+, Supabase Realtime, Tailwind CSS). Nền tảng được tối ưu hóa hiển thị xuất sắc cho cả **màn hình lớn của Host** (máy chiếu, TV, PC) lẫn **thiết bị di động của Người chơi** (Smartphone, Tablet).

---

## 📑 MỤC LỤC
1. [Dành Cho Người Chơi (Player)](#1-dành-cho-người-chơi-player)
   - [1.1 Tham gia phòng chơi](#11-tham-gia-phòng-chơi)
   - [1.2 Chọn biệt danh & Thư viện linh vật](#12-chọn-biệt-danh--thư-viện-linh-vật)
   - [1.3 Trải nghiệm trả lời câu hỏi](#13-trải-nghiệm-trả-lời-câu-hỏi)
   - [1.4 Xem kết quả & Bục vinh danh](#14-xem-kết-quả--bục-vinh-danh)
2. [Dành Cho Người Dẫn Chương Trình (Host)](#2-dành-cho-người-dẫn-chương-trình-host)
   - [2.1 Đăng nhập & Bảo mật quyền Host](#21-đăng-nhập--bảo-mật-quyền-host)
   - [2.2 Quản lý bộ đề & Phân loại thư mục (Folder)](#22-quản-lý-bộ-đề--phân-loại-thư-mục-folder)
   - [2.3 Tạo & Chỉnh sửa bộ đề thủ công](#23-tạo--chỉnh-sửa-bộ-đề-thủ-công)
   - [2.4 Nhập đề tự động từ Excel / CSV](#24-nhập-đề-tự-động-từ-excel--csv)
   - [2.5 Xuất bộ đề ra Excel để lưu trữ](#25-xuất-bộ-đề-ra-excel-để-lưu-trữ)
3. [Tổ Chức & Điều Hành Trận Đấu Trực Tiếp](#3-tổ-chức--điều-hành-trận-đấu-trực-tiếp)
   - [3.1 Phòng chờ (Lobby) & Mã QR](#31-phòng-chờ-lobby--mã-qr)
   - [3.2 Tùy biến chủ đề màu & Logo thương hiệu](#32-tùy-biến-chủ-đề-màu--logo-thương-hiệu)
   - [3.3 Chế độ Tự động chuyển bước (Auto-Advance)](#33-chế-độ-tự-động-chuyển-bước-auto-advance)
   - [3.4 Điều khiển trận đấu & Kết thúc sớm](#34-điều-khiển-trận-đấu--kết-thúc-sớm)
   - [3.5 Âm thanh nền & Hiệu ứng](#35-âm-thanh-nền--hiệu-ứng)
4. [Hệ Thống Song Ngữ (Tiếng Việt / English)](#4-hệ-thống-song-ngữ-tiếng-việt--english)
5. [Cấu Trúc Tệp Excel Mẫu Chuẩn](#5-cấu-trúc-tệp-excel-mẫu-chuẩn)
6. [Câu Hỏi Thường Gặp & Xử Lý Sự Cố](#6-câu-hỏi-thường-gặp--xử-lý-sự-cố)

---

## 1. DÀNH CHO NGƯỜI CHƠI (PLAYER)

### 1.1 Tham gia phòng chơi
Người chơi không cần tạo tài khoản hay đăng nhập mật khẩu:
* **Cách 1**: Quét mã **QR Code** hiển thị trên màn hình lớn của Host bằng camera điện thoại.
* **Cách 2**: Truy cập trang chủ web, nhập **Mã PIN 6 chữ số** do Host cung cấp (Ví dụ: `824195`) và bấm **Tham Gia Trò Chơi Ngay**.

### 1.2 Chọn biệt danh & Thư viện linh vật
1. **Nhập biệt danh**: Tối đa 18 ký tự (tên hiển thị trên bảng xếp hạng).
2. **Chọn linh vật đại diện (Avatar)**:
   * Có sẵn 10 linh vật phổ biến trên thanh chọn nhanh.
   * **Bấm nút `...`** để mở **Thư viện hơn 70 linh vật & emoji** độc đáo chia làm 4 nhóm:
     * 🐾 **Động vật**: Cáo, hổ, gấu trúc, rồng, khủng long, cú mèo, cá heo, chim cánh cụt,...
     * 🚀 **Công nghệ & Vũ trụ**: Tên lửa, robot, đĩa bay, vi mạch, kính viễn vọng,...
     * 🎯 **Giải trí & Thể thao**: Gamepad, cờ tướng, đàn guitar, trượt ván, bóng đá,...
     * 🔥 **Năng lượng & Ẩm thực**: Vương miện, kim cương, lửa, ngôi sao, pizza, burger,...
3. Bấm **Sẵn Sàng Tham Gia!** để vào sảnh chờ.

### 1.3 Trải nghiệm trả lời câu hỏi
Khi Host bắt đầu câu hỏi, điện thoại người chơi sẽ hiển thị giao diện tùy theo dạng câu hỏi:
* **Trắc nghiệm 4 đáp án**: 4 ô khối màu sắc & hình học lớn, có phản hồi rung nhẹ (Haptic Feedback) khi chạm:
  * 🔺 **Tam giác Đỏ** (Phương án A)
  * 🔷 **Kim cương Xanh dương** (Phương án B)
  * 🟡 **Hình tròn Vàng** (Phương án C)
  * 🟩 **Hình vuông Xanh lục** (Phương án D)
* **Đúng / Sai**: 2 nút to toàn màn hình: **Đúng** (màu xanh lá) và **Sai** (màu đỏ).
* **Điền từ vào chỗ trống**: Ô nhập văn bản tự động kích hoạt bàn phím để gõ đáp án và bấm **Gửi**.

> **Mẹo tính điểm**: Điểm số được tính dựa trên cả **tính chính xác** và **tốc độ trả lời**. Càng trả lời nhanh thì số điểm nhận được càng cao (tối đa 1.000 điểm cơ bản). Trả lời đúng nhiều câu liên tiếp sẽ kích hoạt **Chuỗi Thắng (Streak 🔥)** để nhân thêm điểm thưởng!

### 1.4 Xem kết quả & Bục vinh danh
* Ngay khi hết giờ câu hỏi, người chơi sẽ biết mình trả lời Đúng hay Sai, số điểm nhận được và thứ hạng tạm thời.
* Khi kết thúc trận đấu, nếu lọt vào **TOP 3**, màn hình người chơi sẽ vinh danh huy hiệu vàng/bạc/đồng tương ứng.

---

## 2. DÀNH CHO NGƯỜI DẪN CHƯƠNG TRÌNH (HOST)

### 2.1 Đăng nhập & Bảo mật quyền Host
* Để vào trang quản trị bộ đề, Host truy cập đường dẫn: `/host/dashboard`
* **Mật mã bảo vệ mặc định**: `8451`
* Để thoát quyền Host khi rời máy tính, bấm nút **Khóa (`Lock`)** ngay trên thanh Header trên cùng cạnh nút "Host Quản Lý".

### 2.2 Quản lý bộ đề & Phân loại thư mục (Folder)
Trang Dashboard được trang bị công cụ tìm kiếm và phân loại thông minh:
* **Thanh tìm kiếm (Search Bar)**: Tìm nhanh bất kỳ bộ đề nào theo tên hoặc mô tả ngắn.
* **Hệ thống thư mục (Folder)**:
  * **Tab `📁 Tất Cả`**: Hiển thị toàn bộ câu hỏi và tổng số lượng.
  * **Tạo thư mục mới**: Bấm nút **`+ Thư Mục Mới`** và nhập tên thư mục (Ví dụ: *Đào tạo nội bộ*, *Hội thảo 2026*, *Teambuilding*).
  * **Gán bộ đề vào thư mục**: Trên góc phải của mỗi thẻ bộ đề có thanh chọn thư mục, bấm chọn để chuyển bộ đề vào thư mục tương ứng chỉ trong 1 click.
  * **Xóa thư mục**: Bấm icon `x` trên tab thư mục cần xóa. Các bộ đề bên trong sẽ được chuyển về "Tất Cả" an toàn mà không bị mất dữ liệu.

### 2.3 Tạo & Chỉnh sửa bộ đề thủ công
1. Bấm **+ Tạo Bộ Đề Mới** trên thanh công cụ.
2. Nhập **Tiêu đề** và **Mô tả**.
3. Bấm **+ Thêm câu hỏi**:
   * **Chọn dạng câu hỏi**: Trắc nghiệm 4 đáp án, Đúng/Sai, hoặc Điền từ.
   * **Nội dung câu hỏi**: Nhập câu hỏi cần hỏi.
   * **Đính kèm hình ảnh**:
     * Bấm **Tải ảnh từ máy tính** để chọn tệp ảnh từ máy (ảnh tự động nén tối ưu, tải cực nhanh).
     * Hoặc dán đường link ảnh trực tiếp (`https://...`).
   * **Cài đặt thời gian**: Từ 5 giây đến 120 giây (mặc định 20 giây).
   * **Thiết lập đáp án đúng**: Tích chọn nút tròn cho đáp án đúng, hoặc nhập các từ khóa chấp nhận (phân cách bằng dấu chấm phẩy `;`).
4. Bấm **Hoàn Tất & Lưu Bộ Đề**.
5. Muốn chỉnh sửa lại bộ đề, bấm icon **Cây bút (Pencil)** trên thẻ bộ đề đó.

### 2.4 Nhập đề tự động từ Excel / CSV
Nếu đã có sẵn danh sách câu hỏi trong file Excel:
1. Bấm nút **Tải Mẫu Excel** trên thanh công cụ để tải file mẫu chuẩn `.xlsx` về máy.
2. Điền các câu hỏi vào file theo đúng các cột quy định.
3. Bấm nút **Nhập Excel / CSV Tạo Đề** trên thanh công cụ Dashboard.
4. Kéo thả file Excel hoặc bấm chọn file từ máy tính.
5. Hệ thống sẽ tự động kiểm tra cú pháp từng dòng (hiển thị trạng thái *Hợp lệ* / *Lỗi*).
6. Nhập tên bộ đề mới và bấm **Tạo Bộ Đề Mới Với ... Câu Hỏi**. Toàn bộ bộ đề sẽ xuất hiện ngay trên Dashboard!

### 2.5 Xuất bộ đề ra Excel để lưu trữ
* Trên mỗi thẻ bộ đề tại Dashboard, bên cạnh nút "Phát Trực Tiếp" có nút **Xuất Excel**.
* Bấm vào nút này để tải toàn bộ câu hỏi của bộ đề về máy tính dưới dạng tệp `.xlsx` có đầy đủ đáp án và link hình ảnh, giúp lưu trữ dự phòng hoặc gửi cho người khác chỉnh sửa.

---

## 3. TỔ CHỨC & ĐIỀU HÀNH TRẬN ĐẤU TRỰC TIẾP

### 3.1 Phòng chờ (Lobby) & Mã QR
* Khi Host bấm **Phát Trực Tiếp** trên bất kỳ bộ đề nào, hệ thống sẽ tự động tạo một phòng thi đấu mới với **Mã PIN 6 số duy nhất**.
* Chiếu màn hình này lên TV hoặc máy chiếu hội trường:
  * Mã PIN hiển thị cực lớn, nổi bật.
  * Mã QR động tự động tạo theo link phòng để người chơi quét nhanh.
  * Danh sách người chơi tham gia sẽ cập nhật theo thời gian thực (hiển thị tên và linh vật).

### 3.2 Tùy biến chủ đề màu & Logo thương hiệu
Host có thể cá nhân hóa giao diện phòng thi đấu cho công ty hoặc sự kiện:
1. Bấm nút **Tùy Biến Giao Diện** (góc trên bên phải màn hình Host).
2. **Chọn 1 trong 4 chủ đề màu sắc**:
   * 🌌 **Classic Indigo**: Phong cách đêm huyền bí tím - chàm cổ điển.
   * 🌲 **Emerald Cyber**: Phong cách công nghệ xanh ngọc lục bảo tươi sáng.
   * 🌅 **Sunset Violet**: Phong cách hoàng hôn tím hồng rực rỡ, năng động.
   * 🖤 **Obsidian Neon**: Phong cách tối giản tương phản cao, hiện đại.
3. **Tải lên Logo doanh nghiệp**: Bấm tải ảnh logo công ty từ máy tính. Logo sẽ xuất hiện trang trọng ngay trên sảnh chờ chính của trận đấu.

### 3.3 Chế độ Tự động chuyển bước (Auto-Advance)
Trên thanh điều khiển của Host có nút gạt **Tự Động Chuyển Bước** (`BẬT / TẮT`):
* **Chế độ Thủ công (TẮT)**: Host tự bấm nút qua từng bước (Xem đáp án -> Xem BXH -> Qua câu tiếp theo). Thích hợp khi Host cần diễn giải, giao lưu hoặc bình luận chi tiết.
* **Chế độ Tự động (BẬT)**: Ngay khi hết giờ, hệ thống sẽ hiển thị biểu đồ kết quả trong 5 giây -> Tự động chuyển sang Bảng xếp hạng trong 5 giây -> Tự động kích hoạt câu hỏi tiếp theo (hoặc vinh danh Podium nếu là câu cuối cùng). Host hoàn toàn không cần chạm tay vào chuột!

### 3.4 Điều khiển trận đấu & Kết thúc sớm
Trong suốt trận đấu, Host nắm toàn quyền điều khiển:
* **Hết giờ ngay**: Bấm nút này để kết thúc lượt trả lời của câu hỏi hiện tại ngay lập tức nếu tất cả mọi người trong phòng đã trả lời xong.
* **Kết thúc trò chơi (Nút đỏ)**: Nếu muốn dừng trận đấu sớm giữa chừng vì lý do thời lượng, Host bấm nút này và xác nhận. Hệ thống sẽ lập tức tính tổng điểm tại thời điểm đó và chuyển thẳng sang màn hình **Bục Vinh Danh Podium**.

### 3.5 Âm thanh nền & Hiệu ứng
* Hệ thống tích hợp sẵn bộ nhạc nền phòng chờ, âm thanh đếm ngược hồi hộp và nhạc chuông chiến thắng sôi động.
* Cụm điều khiển âm lượng và nút **Mute** tiện lợi nằm ngay trên góc phải màn hình thi đấu của Host.

---

## 4. HỆ THỐNG SONG NGỮ (TIẾNG VIỆT / ENGLISH)

QuizLive hỗ trợ chuẩn song ngữ hoàn chỉnh:
* **Nút chuyển đổi (🇻🇳 VI / 🇬🇧 EN)**: Có mặt trên thanh Header ở mọi trang (Trang chủ, Host Dashboard, Phòng thi đấu Host và Điện thoại người chơi).
* **Độc lập trên từng thiết bị**: Host có thể xem giao diện tiếng Việt trong khi người chơi nước ngoài có thể chuyển sang giao diện tiếng Anh mà không làm ảnh hưởng đến nhau.
* **Ghi nhớ tự động**: Lựa chọn ngôn ngữ được lưu trữ trên trình duyệt, không bị mất đi khi làm mới trang.

---

## 5. CẤU TRÚC TỆP EXCEL MẪU CHUẨN

Khi tạo câu hỏi bằng Excel/CSV, tệp dữ liệu cần có các cột sau (tương ứng với file tải về từ nút *Tải Mẫu Excel*):

| Tên Cột | Mô Tả | Ví Dụ |
| :--- | :--- | :--- |
| **Loại câu hỏi** | `Trắc nghiệm` (hoặc `multiple_choice`), `Đúng Sai` (hoặc `true_false`), `Điền từ` (hoặc `fill_in_the_blank`) | `Trắc nghiệm` |
| **Nội dung câu hỏi** | Câu hỏi cần hỏi người chơi | `Thủ đô của nước Pháp là thành phố nào?` |
| **Phương án A** | Nội dung phương án thứ nhất | `London` |
| **Phương án B** | Nội dung phương án thứ hai | `Paris` |
| **Phương án C** | Nội dung phương án thứ ba (để trống nếu là Đúng/Sai) | `Berlin` |
| **Phương án D** | Nội dung phương án thứ tư (để trống nếu là Đúng/Sai) | `Rome` |
| **Đáp án đúng** | Chữ cái (`A`, `B`, `C`, `D`), hoặc nội dung text chính xác, hoặc `Đúng`/`Sai` | `B` (hoặc `Paris`) |
| **Thời gian (giây)**| Số giây đếm ngược cho câu hỏi (từ 5 đến 120) | `20` |
| **Link hình ảnh** | Link ảnh online hoặc để trống | `https://example.com/paris.jpg` |

---

## 6. CÂU HỎI THƯỜNG GẶP & XỬ LÝ SỰ CỐ

### ❓ Tôi quên mật khẩu vào trang Host Dashboard thì làm sao?
> Mật mã bảo vệ mặc định của trang Host là **`8451`**.

### ❓ Người chơi bị rớt mạng giữa chừng có vào lại được không?
> Có. Người chơi chỉ cần truy cập lại đường link hoặc quét lại mã QR và nhập đúng mã PIN phòng. Hệ thống Realtime sẽ tự động đồng bộ lại điểm số và câu hỏi đang diễn ra.

### ❓ Nếu hình ảnh tải lên từ máy quá nặng thì có bị lag không?
> Không. Ứng dụng đã tích hợp công nghệ nén ảnh tự động ngay trên trình duyệt (client-side compression) trước khi lưu trữ, đảm bảo ảnh luôn nhẹ và hiển thị tức thì trên cả 100 điện thoại người chơi cùng lúc.

### ❓ Trò chơi có giới hạn số lượng người tham gia không?
> Nền tảng sử dụng Supabase Realtime Broadcast & Presence trên kiến trúc Serverless, có khả năng mở rộng phục vụ từ các phòng thi nhóm nhỏ (10-20 người) đến các hội thảo hội trường hàng trăm người cùng lúc.

---
*QuizLive 2026 — Nền tảng game tương tác hiện đại, nhanh, mượt và bảo mật.*
