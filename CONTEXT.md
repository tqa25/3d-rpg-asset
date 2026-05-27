# MMORPG Domain Context & Architecture

File này cung cấp **Ngữ cảnh Cốt lõi** (Core Context) cho các AI Agent, giúp Agent hiểu đúng về từ vựng, quy tắc và kiến trúc của project này mà không cần đọc mã nguồn mỗi lần. Nó được dùng cho các tool như `grill-with-docs`, `improve-codebase-architecture` và làm glossary chuẩn.

## 1. Domain Glossary (Ngôn ngữ Chung)

Sử dụng thống nhất các từ vựng sau, TUYỆT ĐỐI KHÔNG dùng các từ đồng nghĩa (synonyms) để tránh nhầm lẫn:

- **Entity**: Từ chung để chỉ bất cứ thứ gì có trên bản đồ (Player, Mob, Loot, NPC). Mọi entity đều có id, x, y.
- **Mob**: Quái vật điều khiển bởi server (AI/Spawner). KHÔNG gọi là Enemy hay Monster.
- **Player**: Nhân vật do người chơi điều khiển qua Client. KHÔNG gọi là Character (Character là term DB).
- **Zone**: Khu vực bản đồ trên server (ví dụ zone kích thước 50x50), xử lý broadcast gói tin (Player nào trong zone đó mới nhận được event).
- **Loot**: Vật phẩm rơi ra trên sàn sau khi giết Mob. KHÔNG gọi là DropItem.
- **Lerp** (Linear Interpolation): Kỹ thuật phía Client di chuyển entity mượt mà giữa 2 tọa độ thay vì nhảy cóc (snap).
- **Aggro**: Sự thu hút sát thương. Khi Mob đang rượt theo/đánh Player nào thì Player đó đang giữ "Aggro".
- **Heartbeat**: Cơ chế Ping/Pong định kỳ (mỗi 5s/120s) qua WebSocket để kiểm tra Client còn sống không.
- **Party**: Nhóm người chơi (tối đa 4-5 người) cùng chia sẻ mục tiêu và kinh nghiệm.
- **Instance**: Khu vực bản đồ (Zone) được tạo bản sao riêng cho một Party, người ngoài không thể vào.
- **Taunt**: Kỹ năng ép Mob/Boss phải chuyển *Aggro* sang mục tiêu thi triển.
- **Telegraph**: Vùng cảnh báo kỹ năng trên mặt đất trước khi Boss gây sát thương.

## 2. Key Architectural Decisions (ADRs)

Các quyết định thiết kế đã được thống nhất:

- **Local Markdown Issue Tracker**: Dự án không dùng GitHub/GitLab issues. Tất cả tracking công việc dùng file markdown local trong thư mục `docs/`.
- **ESM All The Way**: Sử dụng `"type": "module"` cho cả Client và Server.
- **Thư mục chia làm 3**: `client/` (Phaser 3), `server/` (Node.js/Fastify/WS), `shared/` (Types/Interfaces chung dùng cho cả 2 bên).
- **UIScene Tách Biệt**: Phía Client, phần UI (Máu, HUD, Joystick) được vẽ lên một `UIScene` đè lên trên `GameScene` để không bị văng/zoom khi camera di chuyển theo nhân vật chính.
- **Guest Auto-create**: Server tự động tạo tài khoản Khách (Guest Account) ở database (Prisma) và cấp token khi lần đầu tiên WebSocket auth. Token lưu ở localStorage.

## 3. Constraints & Anti-patterns

- **Mobile First**: Cần ưu tiên cảm ứng (Virtual Joystick) trên Mobile Browser.
- **No SSL Yet**: Traffic hiện tại là HTTP/WS thường (chưa có HTTPS/WSS), không cần setup mã hóa trong code dev.
- **Database**: Sử dụng PostgreSQL với Prisma ORM (`prisma db push`). Không dùng raw query nếu không cần thiết.
- **Network Decoupling**: File `WebSocketClient.ts` ở Client phải đứng độc lập, tách khỏi logic render của Phaser Scene. Các Scene lắng nghe event qua EventEmitter thay vì gọi trực tiếp WS object.
- **Single Source of Truth**: Máu (HP), Level, Exp, Position ĐỀU thuộc quyền quyết định của Server. Client chỉ render lại (predict + rollback) hoặc hiển thị những gì Server trả về. Không tự tính Máu ở Client.
