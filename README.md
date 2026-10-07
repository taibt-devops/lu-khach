# Lữ Khách — bản thử 0.2: Vùng 1 Vũng Lầy Chán Nản + Vùng 2 Cửa Hẹp

Game vượt ải giúp thiếu nhi và thanh thiếu niên học thuộc câu gốc Kinh Thánh. Thế giới game lấy cảm hứng từ *Thiên Lộ Lịch Trình*: người lữ khách đi qua từng vùng và dùng **Lời Chúa làm gươm** để thắng những "lời dối" chặn đường. Hình ảnh do Game Asset Studio (app sinh asset chạy local, repo riêng) tạo bằng OpenAI GPT Image. Giọng đọc tiếng Việt dùng OpenAI TTS và đã được kiểm tra lại bằng nhận dạng giọng nói. Câu gốc là **Bản Truyền Thống 1926** (phạm vi công cộng), chép nguyên văn.

## Chơi

- Trên máy tính: mở `game\index.html` bằng Chrome hoặc Edge, không cần server.
- Trên Android: chạy `android\build-apk.ps1` để build ra `dist\LuKhach-0.2.apk` (file APK không nằm trong repo), rồi cài lên máy. App luôn ở màn ngang, không xin quyền gì và không cần mạng.

## Vùng 1 · Vũng Lầy Chán Nản: 3 câu gốc, 4 ải

| Ải | Lối chơi | Câu gốc |
|---|---|---|
| **Lối Hẹp** | Chạy vô tận, đổi làn để đâm vào đúng biển gỗ. Lượt 1 luyện **thứ tự** câu; lượt 2 luyện **từng chữ**, vì các biển chỉ khác nhau một chữ. | Ê-sai 40:31 |
| **Qua Đầm Lầy** | Nhảy lên đúng hòn đá có cụm từ tiếp theo trước khi bùn dâng. | Thi Thiên 40:2 |
| **Đường Đêm** | Đường tối om, chỉ thấy chữ cái đầu của từ tiếp theo. Chọn đúng từ để thắp đèn trước khi đèn cạn dầu. | Ma-thi-ơ 11:28 |
| **Boss Bùn Buồn** | Boss nói một lời dối, ví dụ *"Không ai kéo bạn ra khỏi đống bùn này đâu…"*. Người chơi chọn câu gốc đáp trả đúng lời đó để gây sát thương ×2, rồi xếp đúng câu để chém. Khi boss còn dưới nửa máu thì phải xếp từng chữ. | Cả 3 câu |

## Vùng 2 · Cửa Hẹp: 3 câu gốc, 3 ải

Vùng 2 mở sau khi thắng boss Bùn Buồn: bấm nút **Cửa Hẹp ›** ở góc trên bên phải bản đồ Vùng 1.

| Ải | Lối chơi | Câu gốc |
|---|---|---|
| **Núi Sấm Sét** | Cuộn chữ và đá lửa rơi từ núi. Chạm hoặc kéo để chạy trái/phải, hứng đúng cuộn có cụm tiếp theo. Đá lửa có bóng và dấu "!" báo trước chỗ rơi. | Châm Ngôn 3:5-6 |
| **Đường Mây** | Phiến đá mang chữ bay lên trong gió. Chạm (hoặc kéo) đúng phiến vào chỗ trống để lát đường qua vực. Đứng lâu một chỗ thì phiến đá dưới chân vỡ. Lượt 2 gió mạnh hơn và các phiến chỉ khác nhau một chữ. | Giăng 14:6 |
| **Tháp Quạ** | Bầy quạ bay ra cướp Lời Chúa. Chạm để bắn tên, nhắm đúng con quạ giữ chữ tiếp theo; bắn nhầm thì mất tim. Lượt 1 theo cụm, lượt 2 từng chữ. Mức Dễ có tên tự bám về con quạ gần chỗ chạm. | Thi Thiên 119:11 |

## Luật chung

- Mỗi ải có 3 tim, và **số sao bằng số tim còn lại** khi qua ải.
- Trước mỗi ải có thẻ học câu gốc kèm giọng đọc.
- Qua ải Đường Đêm thì nhận **Khiên Đức Tin**, khiên đỡ được một lần sai trong trận boss.
- **Kho gươm** trên bản đồ lưu những câu đã thuộc, kèm mức thành thạo.
- Có 2 mức chơi, **Dễ** và **Thường**. Mức Dễ có 2 lựa chọn thay vì 3, chạy chậm hơn và có nhiều thời gian hơn.
- Tiến độ lưu trong máy (localStorage, khoá `lukhach.v1`).
- Không có quảng cáo và không có mua bán.

## Sửa / thêm nội dung

- Câu gốc, cách chia cụm, các "bẫy" gần giống (`near`), các ải và lời dối của boss nằm ở `game\src\content.js`. Khi game khởi động, `LK.checkContent()` kiểm tra mọi cách chia đều ghép lại đúng nguyên văn câu.
- Thông số ải nằm ở đầu từng file `game\src\scenes\*.js`: tốc độ, thời gian bùn dâng / dầu đèn, máu boss.

### Hình ảnh và âm thanh nằm ở đâu

| Thư mục | Nội dung |
|---|---|
| `art\` | **Ảnh gốc để sửa**: nhân vật và đồ vật là PNG nền trong suốt, ảnh nền là WebP chất lượng cao, `frames.json` liệt kê khung hoạt hình (run, jump, fly). |
| `content\audio\` | Giọng đọc MP3: câu gốc, lời dẫn, lời boss. |
| `game\assets.js` | Bản game thực sự dùng: mọi ảnh (đã thu nhỏ, nén WebP) và MP3 nhúng dạng data URI. Được sinh ra từ hai thư mục trên, đừng sửa tay. |

**Sửa hình không cần studio hay key OpenAI**, chỉ cần Python có `pillow` và `numpy`:

```powershell
pip install pillow numpy
# thay hoặc vẽ lại một file trong art\ (giữ đúng tên, ví dụ art\hero.png), rồi:
python tools\assets.py export      # viết lại game\assets.js từ art\ + content\audio\
python tools\assets.py sheet       # build\sheet.png: xem nhanh mọi hình trong art\
```

Thêm hình mới thì đặt file vào `art\` rồi dùng tên file (không có đuôi) làm key trong code. Ảnh nền đặt tên bắt đầu bằng `bg-`.

### Sinh hình và giọng đọc mới (cần Game Asset Studio + key OpenAI)

```powershell
$py = 'D:\code\game-asset-studio\.venv\Scripts\python.exe'   # Game Asset Studio phải đang chạy (127.0.0.1:8765)
& $py tools\assets.py gen [--redo boss,bg-run]   # sinh ảnh còn thiếu (danh sách ở content\assets.json)
& $py tools\assets.py art [--only boss,bg-run]   # chép ảnh từ studio vào art\ (ghi đè các file đó)
& $py tools\audio.py                              # giọng đọc (content\audio.json) + tự kiểm tra bằng nhận dạng giọng nói
& $py tools\assets.py export                      # gộp mọi ảnh + tiếng vào game\assets.js
& $py tools\make_icons.py                         # icon Android
.\android\build-apk.ps1 [-Install]                # APK (tăng versionCode trước khi cài đè)
```

Thử nhanh trong trình duyệt: thêm `?speed=4` vào URL để game chạy nhanh gấp 4 lần.

APK ký bằng **cùng keystore với Word Island và Ollie's Farm** (`android\keystore\`, gitignored). Chỉ cần sao lưu keystore một lần cho cả ba app.

## Kỹ thuật

- Game dùng Phaser 3.90 (`game\vendor\phaser.min.js`).
- Mọi ảnh và tiếng được nhúng sẵn vào `assets.js`, nên game chạy được từ `file://` và trong WebView mà không gặp lỗi CORS.
- Kích thước khung 1280×720, tự co giãn theo màn hình. Khi máy dựng dọc, game hiện lời nhắc xoay ngang.
