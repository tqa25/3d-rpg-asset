# MMORPG v2 — Project Status

<!-- [QUICK-CONTEXT] -->
## 🚀 Quick Context for AI Agents
- **Tech Stack**: Vite + Phaser 3 (Client), Node.js + Fastify + WS (Server), Prisma + Postgres (DB).
- **Core Concept**: ESM All the way, Client chỉ hiển thị (lerp), mọi logic/stats thuộc về Server.
- **Port Map**: 80 (Nginx Proxy) -> 3000 (API/Health) / 3001 (WebSocket).
- **Domain Guide**: Đọc `CONTEXT.md` để biết terms (Mob, Entity, Zone...).
- **Current Phase**: Đang chuẩn bị chuyển sang **Phase 3 (Inventory & Items)**.
- **Next Task**: LUÔN LUÔN đọc `docs/STATE.md` để lấy nhiệm vụ cụ thể ngay lập tức, sau đó tham chiếu `[PHASES]`.

<!-- [SKILLS] -->
## 🛠 AI Agent Skills
Dự án này cấu hình một tập hợp các AI Skills. Xem `SKILLS.md` để biết chi tiết.
- Trigger `tdd`: Chạy `tdd` skill khi viết logic combat/AI/inventory mới.
- Trigger `improve-codebase`: Chạy khi cần refactor code.
- Trigger `grill-me`: Chạy khi bạn có plan mới và muốn AI chất vấn để tìm rủi ro.
- Trigger `handoff`: Chạy trước khi bạn muốn đổi ca/tắt máy để AI lưu context.

<!-- [ARCHITECTURE] -->
## 🏗 Architecture & Data Flow

### Folder Structure
```
/workspaces/phone_game/
├── shared/src/index.ts     # Shared types (Position, Character, v.v.)
├── server/
│   ├── src/ws/             # WebSocket logic (auth, move, chat)
│   ├── src/game/           # Logic (EntityManager, MobSpawner, Combat)
│   └── prisma/             # DB schema (Account, Character)
├── client/
│   ├── src/network/        # WS client độc lập
│   └── src/scenes/         # Phaser scenes (Boot, Game, UIScene)
└── docs/                   # Issue tracking (local markdown) & ADRs
```

### Data Flow
- **Auth**: Auto-guest account qua WebSocket.
- **State**: Server là Single Source of Truth.
- **Multiplayer**: Server xử lý multi-client, close tab cũ nếu 1 user login từ tab mới (dựa trên localStorage token).

<!-- [PHASES] -->
## 📋 Phases & Progress

### ✅ Phase 1 — Foundation & WS
- Server: Fastify, WS Auth, EntityManager.
- Client: Phaser scaffolding, GameScene (50x50 map), UIScene (Joystick, HUD), Lerp interpolation.
- Multiplayer 2+ clients.

### ✅ Phase 2 — Combat & Mobs
- Server: Mob configs (5 types), MobSpawner (Patrol/Chase AI), Combat system (dmg, crit, dodge).
- Server: Exp + Level up.
- Client: Tap target, Floating text, Death anim.

### 🔲 Phase 3 — Lớp Nhân Vật & Kỹ Năng 👈 [WE ARE HERE]
- [ ] DB: Class & Skill Models (Data-driven config)
- [ ] Server: Logic kỹ năng (AoE, Heal mục tiêu, Taunt hút Aggro)
- [ ] Client: UI thanh kỹ năng (Skill Bar) & Cooldown

### 🔲 Phase 4 — Tổ Đội (Party System)
- [ ] Server: Logic tạo Party, mời/rời Party, Share kinh nghiệm
- [ ] Client: UI Party list (hiển thị máu đồng đội)

### 🔲 Phase 5 — Phụ Bản & Boss (Instances & Boss Raids)
- [ ] Server: Instance Manager (tạo bản đồ riêng cho Party)
- [ ] Server: Boss AI (Cơ chế đặc biệt: Phase máu, vận skill diện rộng)
- [ ] Client: Cảnh báo vùng sát thương (Telegraph) & thanh máu Boss cực lớn

<!-- [RUN INSTRUCTIONS] -->
## 🔧 How to Run

```bash
# Server (PM2)
pm2 start ecosystem.config.js
pm2 restart mmorpg-server

# Client build
cd client && npm run build

# Nginx & Health
sudo nginx -t && sudo nginx -s reload
curl http://localhost/health

# DB push
cd server && npx prisma db push
```
