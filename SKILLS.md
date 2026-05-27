# AI Skills Playbook for MMORPG Project

File này liệt kê các AI agent skills có sẵn trong dự án và khi nào nên sử dụng chúng. AI Assistant có thể tự động gọi các skill này khi nhận thấy workflow phù hợp.

## 🟢 Nhóm 1: Core Skills (Sử dụng Thường Xuyên)

Đây là các skills có giá trị cao nhất trong quá trình phát triển game:

- **`tdd`** (`.claude/skills/tdd/`) 
  - **Dùng khi**: Cần implement combat logic mới, AI của quái (Mob AI), hệ thống inventory, hoặc bất kỳ logic phức tạp nào có thể tách biệt. 
  - **Lợi ích**: Đảm bảo game logic chặt chẽ, dễ debug.
- **`review`** (`.claude/skills/review/`)
  - **Dùng khi**: Review pull request hoặc thay đổi code trước khi merge.
  - **Lợi ích**: Kiểm tra xem spec/UI có đúng với yêu cầu không.
- **`prototype`** (`.claude/skills/prototype/`)
  - **Dùng khi**: Cần làm thử nghiệm nhanh một UI mới (ví dụ: Quest Board, Inventory Grid) hoặc test loop logic mà không muốn phá codebase chính.
- **`improve-codebase-architecture`** (`.claude/skills/improve-codebase-architecture/`)
  - **Dùng khi**: Sau khi kết thúc 1 phase, cần review xem có tech debt không, refactor các thành phần bị phình to (vd: `EntityManager.ts` quá lớn).
- **`grill-me`** & **`grill-with-docs`** (`.claude/skills/grill-*/`)
  - **Dùng khi**: Chuẩn bị làm phase mới, user đưa ra một system design mới và agent cần "hỏi xoáy đáp xoay" để đảm bảo plan đủ vững. Skill thứ 2 giúp cập nhật `CONTEXT.md` và `docs/adr/`.
- **`ubiquitous-language`** (`.claude/skills/ubiquitous-language/`)
  - **Dùng khi**: Nhận thấy dự án đang có các thuật ngữ lộn xộn (ví dụ lúc gọi là `Enemy`, lúc gọi là `Mob`, lúc là `Monster`), skill này giúp chuẩn hóa ngôn ngữ giao tiếp vào `CONTEXT.md`.
- **`handoff`** (`.claude/skills/handoff/`)
  - **Dùng khi**: Trước khi pause việc, tạo 1 file tóm tắt session hiện tại để agent tiếp theo có thể resume dễ dàng.
- **`zoom-out`** (`.claude/skills/zoom-out/`)
  - **Dùng khi**: Bị kẹt vào một lỗi cụ thể quá lâu, cần thoát ra nhìn lại bức tranh tổng thể hệ thống (Server <-> WebSocket <-> Client).
- **`pre-release`** (`.claude/skills/pre-release/`)
  - **Dùng khi**: Kiểm tra cuối cùng trước khi deploy version mới lên Production/Nginx.

---

## 🟡 Nhóm 2: Setup & Management (Sử dụng Khi Cần Thiết)

Các skills về quản lý dự án và infrastructure:

- **`setup-matt-pocock-skills`**: Chạy một lần duy nhất để kết nối hệ thống skill với Issue tracker. (Đã cấu hình dùng **Local Markdown**).
- **`setup-pre-commit`**: Cấu hình husky/lint-staged để đảm bảo format và type-check trước khi commit.
- **`git-guardrails-claude-code`**: Bảo vệ repo, chặn các lệnh git nguy hiểm (push force, reset hard).
- **`to-issues`**: Biến một Spec/Plan thành các file issue markdown nhỏ trong thư mục `docs/issues/` (Local Tracker).
- **`to-prd`**: Từ đoạn chat thảo luận requirements, gen ra Product Requirements Document (PRD).
- **`triage`**: Duyệt qua danh sách bugs/issues tồn đọng và prioritize chúng.
- **`diagnose`**: Tìm hiểu nguyên nhân một lỗi trên production thông qua log và metrics một cách có hệ thống.
- **`write-a-skill`**: Sử dụng khi cần tạo thêm một AI skill mới đặc thù cho MMORPG.
