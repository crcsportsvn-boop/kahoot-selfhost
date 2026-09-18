# ⚡ Kahoot-SelfHost: Real-time Quiz Platform

Nền tảng tương tác game trắc nghiệm trực tuyến thời gian thực (tương tự Kahoot) chạy hoàn toàn trên kiến trúc **Serverless**, xây dựng với **Next.js 14+ (App Router, TypeScript, Tailwind CSS)**, **Supabase (PostgreSQL, Realtime Broadcast & Presence)** và triển khai lên **Vercel**.

Mã nguồn được phát triển chuẩn hóa, tối ưu hóa cho màn hình lớn của Host (máy chiếu/TV) và giao diện di động cảm ứng cực nhạy cho người chơi (Player mobile controller).

---

## 🚀 Tính Năng Nổi Bật

1. **Kiến Trúc Serverless & Realtime Đồng Bộ Siêu Tốc:**
   - **Presence Tracking:** Host theo dõi số lượng và linh vật avatar/nickname của từng người chơi ngay khi họ vào phòng.
   - **Broadcast Channels (`game_sessions:[pin]`):** Đồng bộ các sự kiện `GAME_START`, `NEW_QUESTION`, `TIMES_UP`, `SHOW_LEADERBOARD`, `GAME_OVER`.
   - **Bảo Mật Tuyệt Đối:** Dữ liệu câu hỏi phát sóng đến người chơi không bao gồm `correct_answer`. Đáp án được chấm điểm bảo mật trên Server Action / RPC.

2. **Thuật Toán Tính Điểm Suy Giảm Theo Thời Gian (Kahoot Scoring Formula):**
   - Điểm tối đa: **1000 điểm / câu**.
   - Công thức suy giảm điểm theo độ trễ (latency decay):
     $$\text{points} = \text{is\_correct} \times \text{round}\left(1000 \times \left(1 - \frac{\text{elapsed\_ms}}{2 \times \text{time\_limit\_ms}}\right)\right)$$
   - Điểm tối thiểu cho câu trả lời đúng trong thời gian quy định là **500 điểm**.
   - Thưởng chuỗi liên tiếp (**Streak Bonus**) khi người chơi trả lời đúng liên tiếp $\ge 3$ câu.

3. **Tùy Biến 3 Loại Câu Hỏi Đa Dạng:**
   - **Trắc nghiệm 4 đáp án (`multiple_choice`):** 4 khối màu sắc đặc trưng (Đỏ ▲, Xanh dương ◆, Vàng ●, Xanh lá ■) với phản hồi rung (Haptic Feedback) trên thiết bị di động.
   - **Đúng / Sai (`true_false`):** 2 nút lớn Xanh lá (Đúng) và Đỏ (Sai).
   - **Đục lỗ / Điền từ (`fill_in_the_blank`):** Ô nhập văn bản lớn, tự động focus, tự động chuẩn hóa chữ hoa/thường (`trim().toLowerCase()`) và hỗ trợ nhiều đáp án đúng cách nhau bằng dấu chấm phẩy `;`.

4. **Hệ Thống Âm Thanh Tổng Hợp Độc Quyền (Web Audio API Synthesis):**
   - **100% Client Synthesis:** Không phụ thuộc vào tệp mp3 ngoài hay CDN, loại bỏ hoàn toàn lỗi 404, CORS hoặc bị chặn tài nguyên mạng.
   - **Nhạc nền Lobby:** Giai điệu synth arpeggio 136 BPM vui nhộn, sống động.
   - **Đếm ngược kịch tính (Tick-tock):** Âm thanh gõ gỗ nhịp nhàng và dồn dập cao độ trong 5 giây cuối.
   - **Hiệu ứng SFX đầy đủ:** Chuông hết giờ, tiếng chuông trả lời đúng (Ascending chime), tiếng còi báo sai (Buzzer), âm thanh bảng xếp hạng (Whoosh reveal) và khúc khải hoàn vinh danh (Olympic Brass Fanfare) cho bục Podium.
   - Thanh trượt âm lượng và nút Mute tiện lợi trên thanh điều hướng.

5. **Nhập Dữ Liệu Bộ Đề Bằng File Excel / CSV (`xlsx`):**
   - Hỗ trợ kéo thả file `.xlsx`, `.xls` hoặc `.csv`.
   - Tải file mẫu trực tiếp chỉ với 1 click (`Kahoot_Quiz_Template.xlsx`).
   - Kiểm tra tính hợp lệ từng dòng và hiển thị bảng xem trước (Preview Table) trước khi lưu vào Supabase.

6. **Màn Chiếu Podium 3D & Pháo Hoa:**
   - Hiệu ứng bục vinh danh 3 bậc (Hạng Nhất - Gold, Hạng Nhì - Silver, Hạng Ba - Bronze).
   - Pháo hoa rực rỡ với `canvas-confetti`.

---

## 🛠️ Cấu Trúc Thư Mục

```
├── public/
│   └── sample_quiz_template.csv     # File mẫu CSV nhập câu hỏi
├── src/
│   ├── app/
│   │   ├── host/
│   │   │   ├── dashboard/           # Trang quản lý quiz, tạo đề, import Excel
│   │   │   └── game/[pin]/          # Màn hình trình chiếu chính của Host (Lobby -> Podium)
│   │   ├── play/[pin]/              # Màn hình tay cầm điều khiển trên di động của Player
│   │   ├── globals.css              # Styling Tailwind CSS & Animations
│   │   ├── layout.tsx               # Root Layout Next.js 14+
│   │   └── page.tsx                 # Trang chủ & Nhập PIN tham gia
│   ├── components/
│   │   ├── common/                  # Navbar, AudioControl
│   │   ├── host/                    # LobbyView, HostQuestionView, HostResultView,
│   │   │                            # HostLeaderboardView, HostPodiumView, ImportQuestionsModal, QuizEditorModal
│   │   └── player/                  # PlayerLobby, QuestionInput, PlayerAnsweredView, PlayerResultView
│   ├── hooks/
│   │   └── useSoundEffects.ts       # Hook điều khiển âm thanh
│   ├── lib/
│   │   ├── actions/                 # Server Actions: game.ts, quiz.ts
│   │   ├── excel/                   # parseQuizFile.ts (xlsx validation & download)
│   │   ├── sound/                   # audioManager.ts (Web Audio API synthesizer)
│   │   └── supabase/                # client.ts, server.ts, admin.ts
│   └── types/
│       └── index.ts                 # TypeScript interfaces & Realtime payloads
└── supabase/
    ├── schema.sql                   # Toàn bộ DDL, RLS Policies, Realtime Publication & RPC Chấm điểm
    └── seed.sql                     # Dữ liệu mẫu (Bộ đề Tech, Web Dev & Khoa học vui)
```

---

## 📋 Hướng Dẫn Cài Đặt & Triển Khai

### BƯỚC 1: Thiết Lập Cơ Sở Dữ Liệu Trên Supabase

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) và chọn dự án của bạn.
2. Vào mục **SQL Editor** ở thanh menu bên trái.
3. Mở file [supabase/schema.sql](./supabase/schema.sql), sao chép toàn bộ nội dung, dán vào SQL Editor và nhấn **Run** (Ctrl + Enter).
   - *Script này sẽ tự động khởi tạo các bảng: `profiles`, `quizzes`, `questions`, `game_sessions`, `players`, `answers`.*
   - *Kích hoạt RLS Policies bảo mật và function RPC `submit_player_answer`.*
   - *Kích hoạt Realtime Publication cho `game_sessions`, `players`, `answers`.*
4. *(Tùy chọn)* Mở file [supabase/seed.sql](./supabase/seed.sql), dán vào SQL Editor và nhấn **Run** để nạp sẵn 2 bộ đề thi đấu phong phú về Công nghệ và Khoa học.

#### Kiểm tra cài đặt Realtime:
- Vào mục **Database** $\rightarrow$ **Replication**.
- Đảm bảo các bảng `game_sessions`, `players`, `answers` đã được bật công tắc **Source** (Replication enabled).

---

### BƯỚC 2: Cấu Hình Biến Môi Trường (Environment Variables)

Tạo file `.env.local` tại thư mục gốc với các thông tin đã được cung cấp:

```env
# Supabase Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Supabase Server-Only Secret (Bảo mật tuyệt đối, chỉ chạy trên server)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# URL của website
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### BƯỚC 3: Chạy Kiểm Thử Tại Môi Trường Local

```bash
# Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# Chạy server phát triển
npm run dev
```

Mở trình duyệt:
- Giao diện người chơi: `http://localhost:3000`
- Giao diện Host: `http://localhost:3000/host/dashboard`

---

### BƯỚC 4: Đẩy Code Lên GitHub

Kho lưu trữ GitHub đã được liên kết tại:
`https://github.com/crcsportsvn-boop/kahoot-selfhost`

Để cập nhật phiên bản mới nhất:
```bash
git add .
git commit -m "feat: complete real-time serverless Kahoot quiz platform"
git push -u origin main
```

---

### BƯỚC 5: Triển Khai Lên Vercel (CI/CD 1-Click)

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
2. Nhấn **Add New...** $\rightarrow$ **Project**.
3. Chọn kho mã nguồn `crcsportsvn-boop/kahoot-selfhost` từ tài khoản GitHub của bạn.
4. Tại mục **Environment Variables**, thêm 3 biến sau:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<anon-jwt-token>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<service-role-jwt-token>`
5. Nhấn **Deploy**.
6. Sau khoảng 1-2 phút, dự án sẽ hoàn tất và bạn nhận được đường dẫn trực tiếp (ví dụ: `https://kahoot-selfhost.vercel.app`).

---

## 🎮 Hướng Dẫn Trải Nghiệm Trò Chơi

1. **Host tạo phòng:**
   - Truy cập `/host/dashboard`.
   - Chọn bộ đề có sẵn hoặc nhấn **"Tạo Bộ Đề Mới"** hoặc **"Nhập Excel"**.
   - Bấm **"Phát Trực Tiếp"** $\rightarrow$ Hệ thống tự sinh mã PIN 6 chữ số và tạo phòng đấu `/host/game/[pin]`.
2. **Người chơi vào phòng:**
   - Sử dụng điện thoại quét mã QR trên màn hình chiếu, hoặc vào trang chủ `/` và nhập mã PIN.
   - Chọn avatar linh vật yêu thích và nhập biệt danh.
   - Bấm **"Sẵn Sàng Tham Gia!"**. Màn hình của Host lập tức hiển thị tên và avatar của bạn!
3. **Bắt đầu game:**
   - Host nhấn **"Bắt đầu trò chơi"**.
   - Màn hình người chơi lập tức chuyển sang chế độ trả lời câu hỏi tương ứng.
   - Khi trả lời xong, hệ thống khóa nút và chờ hết giờ.
   - Hết giờ: Host chiếu biểu đồ đáp án, bảng xếp hạng và bục podium vinh danh cuối trận đấu!
