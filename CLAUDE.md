# CLAUDE.md — Lữ Khách

> Đọc file này trước khi sửa repo. Thiết kế game (vì sao có các ải, luật chơi, lộ trình) nằm ở [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).
> Hướng dẫn cho người chơi và người sửa hình nằm ở [README.md](README.md).

## Dự án là gì

Game vượt ải **offline** giúp thiếu nhi (6–11 tuổi) và thanh thiếu niên học thuộc **câu gốc Kinh Thánh**. Thế giới game lấy cảm hứng từ *Thiên Lộ Lịch Trình*.

- Viết bằng Phaser 3.90, HTML/JS thuần, không có bước build. Mở thẳng `game/index.html` từ `file://` là chạy.
- Có bản Android: app Java bọc WebView, xoay ngang.
- Repo: https://github.com/taibt-devops/lu-khach (public, nhánh `main`). Chủ dự án: taibt.
- Trạng thái 0.2:
  - Vùng 1 Vũng Lầy Chán Nản: 3 ải + boss.
  - Vùng 2 Cửa Hẹp: 3 ải.
  - Vùng 3 và boss Vùng 2: chưa làm.

## Lệnh hay dùng

```powershell
# Chơi: mở game\index.html bằng Chrome. Thêm ?speed=4 để mọi timer/tween chạy nhanh 4 lần (chỉ dùng khi test).

# Test chơi tự động (Playwright điều khiển Chrome cài sẵn trên máy, không tải browser):
cd tests; npm install; npm test        # = region1 + region2 + input; mỗi script in "NO ERRORS" khi đạt
# ảnh chụp màn hình ở build\test-shots\

# Hình/âm thanh -> game\assets.js (chỉ cần Pillow + numpy, KHÔNG cần studio):
python tools\assets.py export
python tools\assets.py sheet           # build\sheet.png: xem nhanh mọi hình

# APK (Windows, cần Android Studio): tăng versionCode trong android\app\build.gradle trước
.\android\build-apk.ps1 [-Install]     # -> dist\LuKhach-<versionName>.apk
```

## Bản đồ code

| Đường dẫn | Vai trò |
|---|---|
| `game/index.html` | Nạp theo thứ tự: font → `vendor/phaser.min.js` → `assets.js` → `src/content.js` → `src/core.js` → `src/scenes/*.js` → `src/main.js`. Thêm scene mới thì phải thêm `<script>` vào đây **và** vào danh sách `scene` trong `main.js`. |
| `game/src/content.js` | **Toàn bộ nội dung**: `regions` (bản đồ, câu chuyện, toạ độ node), `verses` (câu gốc và cách chia), `levels` (thứ tự ải), `lies` (lời dối của boss Vùng 1). |
| `game/src/core.js` | Namespace `LK`: lưu tiến độ, mở khoá ải, helper UI (`text`, `button`, `panel`, `hearts`, `verseBar`, `banner`, `burst`), âm thanh tổng hợp (`LK.sfx`), giọng đọc (`LK.say`), hook Android. |
| `game/src/scenes/` | `boot` (data URI → texture, animation), `map`, `learn` (thẻ học câu gốc), `result`, và các ải: `runner`, `river`, `lantern`, `boss`, `catch`, `path`, `archery`. |
| `game/assets.js` | **File sinh ra, đừng sửa tay.** `window.LK_ASSETS = {images, frames, audio}`, toàn bộ dạng data URI, mỗi mục một dòng. |
| `art/` | Ảnh nguồn đã commit: sprite là PNG nền trong suốt, ảnh nền là `bg-*.webp` (q95), `frames.json` liệt kê khung hoạt hình. Tên file (không đuôi) chính là texture key trong game. |
| `content/audio/*.mp3` | Giọng đọc. Kịch bản lời nằm ở `content/audio.json`. |
| `content/assets.json` | Prompt sinh hình: style, nhân vật, đồ vật, ảnh nền, ảnh sửa từ ảnh gốc, hoạt hình. |
| `tools/asset_map.json` | Key → id asset trong Game Asset Studio. Chỉ dùng khi kéo hình từ studio. |
| `tests/` | `play-region1.js`, `play-region2.js`, `input.js`, và `common.js` (đường dẫn, cấu hình launch). |
| `android/` | Wrapper WebView, `assets.srcDirs = ['../../game']`, package `com.lukhach.app`. |

## Quy ước khi viết một ải (scene)

Mỗi ải là một `Phaser.Scene` có key trùng `levels[i].type`, theo đúng khuôn sau:

1. `init(data)` nhận `data.level`, là chỉ số trong `LK.C.levels`. Đọc câu gốc bằng `LK.verse(lv.verse)`.
2. Đầu `create()` đặt `this.time.timeScale = LK.SPEED` và `this.tweens.timeScale = LK.SPEED`. Mọi đồng hồ tự tính trong `update()` phải nhân với `LK.SPEED`; nếu quên thì `?speed=4` hỏng và test chạy sai.
3. Dùng helper chung:
   - `LK.hearts(this, 3)`: 3 tim; **số sao = số tim còn lại**.
   - `LK.verseBar(this, parts, ref)`: thanh câu gốc ở trên cùng.
   - `LK.backButton(this)`, và `LK.banner(...)` để giải thích luật trước khi chơi.
4. Khi thắng: `this.scene.start('Result', { level, stars: this.hearts.n, won: true })`. Khi thua: `stars: 0, won: false`. Màn Result lo việc lưu sao, cộng mastery và mở khoá.
5. **Hook debug cho test (bắt buộc):**

   ```js
   LK.debug = { scene: '<Type>', state: () => ({ idx, hearts, over, ... }), act: ok => { /* chọn đúng (ok) hoặc cố ý chọn sai */ } };
   ```

   - Test gọi `act(true)` khi `state()` báo sẵn sàng, rồi chờ `pass|idx|hearts|wave` thay đổi.
   - Ải nào tự sinh lượt mới khi người chơi bỏ lỡ thì phải tăng một bộ đếm trong `state()`, như `wave` ở `catch.js`; nếu không, test sẽ đứng chờ và mất tim oan.
   - Ải nào có nguy hiểm ngẫu nhiên (đá lửa) thì có thêm `calm()` để test tắt chúng đi.
6. Ở Mức Dễ (`LK.save.easy`) thì giảm số lựa chọn từ 3 xuống 2, cho chạy chậm hơn hoặc thêm thời gian. Thông số mỗi ải đặt ở đầu `create()`.
7. Dành cho trẻ em: không có máu me hay cái chết; quạ bị bắn thì giật mình bay đi, boss thua thì tan thành vũng bùn hiền. Chạm sai thì luôn cho biết đáp án đúng hoặc để người chơi thử lại.

**Thêm một ải:**
1. Thêm verse vào `content.js`.
2. Thêm level (`region`, `type`, `bg`, `title`, `verse`, `hint`) và scene mới.
3. Thêm `<script>` vào `index.html` và scene vào `main.js`.
4. Thêm toạ độ node vào `regions[r].spots`. Số node phải bằng số level của vùng.
5. Thêm một khối vào `tests/play-region*.js`.

**Thêm một vùng:**
1. Thêm phần tử vào `regions` (`map` là ảnh bản đồ, `intro` là clip giọng đọc, `start`, `spots`).
2. Gán `region: <index>` cho các level của vùng.
3. Bản đồ tự hiện nút sang vùng sau và về vùng trước. Vùng sau mở khi level cuối của vùng trước có sao.
4. Khi qua level cuối của vùng N, màn Result phát clip `region<N>-done`; riêng Vùng 1 kết thúc bằng boss nên dùng clip `region-done`. Nhớ thêm clip cho vùng mới vào `content/audio.json`.

⚠️ `boss.js` đang **gắn cứng vào Vùng 1**: dùng `LK.C.levels[3].verses`, `LK.C.lies`, các texture `boss`/`boss-hit`/`boss-defeated` và câu banner lúc thắng. Muốn có boss cho Vùng 2 thì phải tham số hoá theo level (đưa danh sách lời dối và texture vào `content.js`), không copy file.

## Nội dung câu gốc: luật không được phá

- Dùng **Bản Truyền Thống 1926 (BTT 1926)**, đã thuộc phạm vi công cộng, và **chép nguyên văn**. Không dùng bản dịch mới hơn (2011, 2002…) vì còn bản quyền.
- Nguồn trên máy taibt: `D:\code\biblequize\apps\api\src\main\resources\seed\bible\btt1926\<NN>-<Book>.json`, mỗi câu dạng `{chapter, verse, text}`.
  - ⚠️ Seed này có **khoảng 965 câu dính lỗi mã hoá VNI**, ví dụ `Aùp-ram` đáng lẽ là `Áp-ram`, `Aùnh sáng` đáng lẽ là `Ánh sáng`.
  - Tìm bằng regex `\b[AĂÂEÊIOÔƠUƯY][ùúøõûïöô]`. Câu nào khớp thì phải sửa lại cho đúng trước khi dùng.
- Được phép bỏ phần dẫn chuyện ở đầu câu, như cách thẻ câu gốc thiếu nhi vẫn làm (ví dụ Giăng 14:6 bỏ "Vậy Đức Chúa Jêsus đáp rằng:"). Ghi lại việc bỏ này trong comment đầu `content.js`.
- Mỗi verse có thể có nhiều cách chia, mỗi cách là một mảng (`chunks`, `pieces`, `steps`, `words`, `drops`, `tiles`):
  - Phần tử là chuỗi, hoặc `{t, near:[…]}`.
  - Khi khởi động, `LK.checkContent()` kiểm tra **mọi mảng** ghép lại phải đúng nguyên văn `text` (bỏ qua khác biệt khoảng trắng). Sai thì báo lỗi trên console, và test sẽ bắt được.
- `near` là các "bẫy" viết tay: những chữ trẻ hay nhầm (đồng nghĩa, cùng chữ cái đầu, đảo chữ). Không lấy ngẫu nhiên từ các cụm khác cho `near`. `theme` hoàn thành câu "Gươm này dùng khi …".
- Ai thêm câu gốc mới thì nên nhờ người phụ trách thiếu nhi hoặc mục sư đọc lại phần `near` và `theme`.

## Hình ảnh: Game Asset Studio

- Studio là app riêng: https://github.com/taibt-devops/game-asset-studio (private). Trên máy taibt nằm ở `D:\code\game-asset-studio`, chạy ở `http://127.0.0.1:8765` bằng lệnh `run.ps1 -NoBrowser`.
  - Python của studio: `D:\code\game-asset-studio\.venv\Scripts\python.exe`. Dùng nó để chạy các lệnh `tools/assets.py` có gọi studio.
- Style trong studio tên **"Lữ Khách"** (id 6): `cute storybook children's game art…`, recipe `sprite_size 512, padding 12`. Ảnh tham chiếu style là nhân vật chính, asset **#116** (key `hero`). Mọi hình mới sinh theo style này để giữ cùng nét vẽ.
- Các lệnh:
  - `gen [--redo a,b]`: sinh hình theo `content/assets.json`, tự ghi `tools/asset_map.json`. Ảnh nền tự được thêm "No people, no animals, no text."
  - `art [--only a,b]`: kéo hình đã duyệt từ studio về `art/`.
  - `export`: dựng lại `game/assets.js`.
- Tư thế mới của nhân vật thì dùng `edits` (sửa từ ảnh gốc) để giữ đúng gương mặt và trang phục. Hoạt hình thì dùng `animations` (từ ảnh gốc + mô tả từng tư thế), nhìn từ bên cạnh, quay sang phải; muốn quay trái thì lật `flipX`.
- `export` xử lý thêm như sau:
  - Ảnh nền thu về tối đa 1600 px, WebP q80.
  - Ảnh nền cuộn ngang (danh sách `SCROLLING`) được nối mép trái/phải để lặp không lộ vết.
  - Sprite thu về 512 px; đồ vật nhỏ (danh sách `SMALL`) thu về 384 px.
- Chi phí với chất lượng `medium`: khoảng $0.02–0.04 mỗi ảnh. `assets.py` dừng lại nếu tổng chi của studio vượt `MAX_SPEND = 8.0` USD. Mốc ngày 07/10/2026: studio đã tiêu tổng cộng khoảng $3.22 (cả ba game), Lữ Khách khoảng $0.75.

## Giọng đọc: OpenAI TTS

- Chạy `tools/audio.py [--redo name,…] [--check-only]`. Lệnh chỉ render clip còn thiếu, rồi **kiểm tra mọi clip** bằng cách cho `gpt-4o-transcribe` nghe lại và so với kịch bản (ngưỡng 0.85).
- Giọng `gpt-4o-mini-tts`: người dẫn chuyện là `coral` (ấm, chậm, trang nghiêm khi đọc Kinh Thánh), boss là `ash` (buồn ngủ, buồn cười, không đáng sợ).
- Đọc điểm kiểm tra cho đúng:
  - Điểm hơi thấp vì số đọc thành chữ ("một trăm mười chín" so với "119") thì không sao.
  - Bản nghe lại **bị cụt giữa câu** nghĩa là clip hỏng, phải `--redo`.
  - Câu khen ngắn hay bị nghe nhầm ("Giỏi lắm" thành "Rồi lắm"), nên viết câu dài hơn một chút.
- Key OpenAI: lấy từ biến môi trường `OPENAI_API_KEY`, không có thì đọc `D:\code\game-asset-studio\.env`.
  - **Tuyệt đối không in key ra, không commit key.**
  - Key này dùng chung với dự án khác, chi phí cộng dồn. Phải hỏi taibt trước khi làm việc tốn nhiều tiền.

## Lưu tiến độ

`localStorage['lukhach.v1']` có các trường:

```js
{ stars: {l1:3, …, boss:2, l4:…}, mastery: {verseId: n}, shield: bool, easy: bool, muted: bool, seen: {r1: true, r2: true} }
```

- Đổi cấu trúc thì **phải viết đoạn chuyển đổi** trong `LK.save` ở `core.js`, như `seenIntro` đã được đổi thành `seen.r1`. Tiến độ của trẻ trên máy tính bảng không được mất.
- Level id (`l1`…`l6`, `boss`) là khoá lưu trữ, **không được đổi tên**. Chỉ được thêm level vào cuối danh sách: chỉ số trong `levels` quyết định thứ tự mở khoá, và boss Vùng 1 đang được tham chiếu bằng `levels[3]`.

## Android

- Build bằng `android/build-apk.ps1`:
  - JDK lấy từ `C:\Program Files\Android\Android Studio\jbr`, SDK ở `%LOCALAPPDATA%\Android\Sdk`.
  - AGP 8.13.0, Gradle 8.14.3, compileSdk/targetSdk 36, minSdk 24.
- `MainActivity.java` dựng WebView toàn màn hình, xoay `sensorLandscape`, không xin quyền gì.
  - Nút Back hệ thống gọi `window.wordIslandBack()`: trả về `true` nếu game tự xử lý (về bản đồ); đang ở bản đồ thì thoát app.
  - Khi app tạm dừng thì gọi `window.wordIslandPause()`.
  - Hai hook mang tên Word Island vì dùng chung wrapper với game đó.
- **Keystore** dùng chung với Word Island và Ollie's Farm, nằm ở `android/keystore/` + `android/keystore.properties`, đã gitignore.
  - Máy mới chưa có keystore thì chép từ `D:\code\word-island\android\` sang. Đừng để script tạo key mới: ký bằng key khác thì không cài đè lên app cũ được, trẻ mất tiến độ.
- Mỗi lần phát hành, tăng `versionCode` và `versionName`. Hiện tại là 2 / 0.2.
- Thử trên emulator:
  - AVD tên `Pixel_7_Pro`.
  - Chụp màn hình bằng `adb exec-out screencap -p > x.png` **trong Git Bash**. Lệnh `>` của PowerShell 5.1 làm hỏng file nhị phân.

## Bẫy trên máy Windows của taibt

- Git Bash: heredoc (`<<'EOF'`) làm hỏng dấu `\` trong nội dung. Muốn viết file có backslash thì dùng công cụ ghi file, đừng dùng heredoc.
- Python in tiếng Việt ra console bị lỗi `UnicodeEncodeError` (cp1252), phải đặt `PYTHONIOENCODING=utf-8`.
- Repo GitHub vừa tạo có thể trả `500 Internal Server Error` cho mọi lần ghi trong khoảng 30 phút đầu (đã gặp ngày 07/10). Cứ đợi rồi thử lại; không phải lỗi do code.
- Git đang bật `autocrlf`, nên cảnh báo "LF will be replaced by CRLF" là bình thường.

## Trước khi commit hoặc push

1. `cd tests && npm test`: cả ba script đều phải in `NO ERRORS`, mỗi ải phải "won=true stars=2" sau 1 lỗi cố ý, boss Vùng 1 được 3 sao nhờ khiên.
2. Đổi hình hoặc âm thanh thì chạy `python tools/assets.py export`, và commit cả `art/`, `content/audio/` lẫn `game/assets.js`.
3. Không commit `dist/`, `build/`, keystore, `.env`, `tests/node_modules/`. Đã có trong `.gitignore`, nhưng hãy xem lại `git status` trước khi commit.
4. Chỉ commit hoặc push khi taibt yêu cầu.
