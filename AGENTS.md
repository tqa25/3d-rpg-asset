# MMORPG v2 — Project Status

## 🎯 Goal
Rebuild MMORPG game từ scratch, phase-by-phase. Mỗi phase hoàn chỉnh và test được trước khi sang phase tiếp theo.

---

## 🏗 Architecture

### Tech Stack
| Layer | Technology |
|---|---|
| Client | Vite + Phaser 3 + TypeScript (ESM) |
| Server | Node.js + Fastify + WebSocket (`ws`) |
| Database | PostgreSQL + Prisma ORM |
| Proxy | Nginx (reverse proxy + static files) |
| Runtime | PM2 + `tsx` |
| Network | Tailscale (VPN), Nginx port 80 |

### Folder Structure
```
/workspaces/phone_game/
├── shared/src/index.ts     # Shared types (Position, Character, EntityData, etc.)
├── server/
│   ├── src/
│   │   ├── index.ts                # Fastify entry, health endpoint, graceful shutdown
│   │   ├── ws/WebSocketServer.ts   # WS server: auth, move, chat, heartbeat, broadcast
│   │   └── game/EntityManager.ts   # Player tracking, entity data, stats calc
│   ├── prisma/schema.prisma       # DB schema (Account, Character)
│   └── .env                       # DATABASE_URL, SERVER_PORT=3000, WS_PORT=3001
├── client/
│   ├── src/
│   │   ├── main.ts                     # Phaser game config, resize handler
│   │   ├── network/WebSocketClient.ts  # WS client: auth, heartbeat, reconnect, latency
│   │   └── scenes/
│   │       ├── BootScene.ts    # Generate placeholder textures
│   │       ├── GameScene.ts    # Game world (map, player, entities, movement, WS handlers)
│   │       └── UIScene.ts      # HUD (HP, level, zone, latency, chat) + virtual joystick
│   ├── index.html
│   └── package.json
├── nginx.conf                    # Nginx config (proxy /ws→3001, /api→3000, static→dist/)
├── ecosystem.config.js           # PM2 config
└── AGENTS.md                     # ← this file
```

### Network Flow (Ports)
```
Browser ──port 80──→ Nginx
  ├── /            → static files (client/dist/)
  ├── /health      → Fastify API (localhost:3000)
  ├── /ws          → WebSocket (localhost:3001)
  └── /api/        → Fastify API (localhost:3000, future)
```

### Data Flow
```
Client (Phaser) ←──WS──→ Server (Node.js) ←──Prisma──→ PostgreSQL
  ├── auth (guest token)    ├── Account + Character CRUD
  ├── move (position)       ├── EntityManager (online players)
  ├── chat (zone text)      └── Zone broadcasting
  └── ping/pong (latency)
```

---

## 📋 Phases & Progress

### ✅ Phase 0 — Cleanup & Foundation
- [x] Deleted old codebase
- [x] Init workspace: `shared/`, `server/`, `client/`
- [x] Prisma schema: `Account`, `Character` only
- [x] Dropped legacy tables via `prisma db push --accept-data-loss`
- [x] PM2 ecosystem, nginx.conf, logs, healthcheck

### ✅ Phase 1 — WebSocket + Auth + Player Spawn
- [x] Server: Fastify entry, health endpoint, graceful shutdown
- [x] Server: WebSocket auth (guest token auto-create)
- [x] Server: WebSocket move, chat, ping/pong, heartbeat (120s timeout)
- [x] Server: EntityManager (player map, zone broadcasting)
- [x] Client: Vite + Phaser 3 scaffolding
- [x] Client: BootScene (placeholder textures: player, mob, boss, tiles, loot)
- [x] Client: GameScene (50x50 map, player container, WS handlers, entity lerp)
- [x] Client: UIScene (HP bar, level, zone, latency, chat panel)
- [x] Client: WebSocketClient (auth, heartbeat, reconnect, latency tracking)
- [x] Client: Virtual joystick (UIScene, screen-space, touch + keyboard fallback)
- [x] Client: Keyboard WASD/Arrow keys (GameScene)
- [x] **Multiplayer**: Server xử lý nhiều client, close old WS khi reconnect
- [x] Build client (`vite build`), deploy qua Nginx
- [x] Test: health OK, WS auth OK, 2 player thấy nhau + chat zone

### ✅ Phase 2 — Combat & Mobs
- [x] Server: Mob configs (5 types: Slime Lv.1 → Orc Lv.5)
- [x] Server: MobSpawner (spawn points, spawn/damage/respawn)
- [x] Server: Patrol AI (random waypoint, 3s interval)
- [x] Server: Chase AI (aggro, chase, return, mob attacks player)
- [x] Server: Combat system (damage calc, crit, dodge, aggro trigger)
- [x] Server: Death & respawn (broadcast death, respawn after timer)
- [x] Server: XP gain + level up (stat growth, full heal, DB save)
- [x] Client: Attack target selection (tap entity, red pulse indicator)
- [x] Client: Floating damage numbers (red normal, yellow crit, blue dodge)
- [x] Client: Mob HP bar update (real-time via entity_update)
- [x] Client: Death animation (flash red → shrink → fade)
- [x] Client: XP bar in HUD (blue bar below HP)
- [x] Client: Level up notification (gold text, scale tween)
- [x] Build + deploy: server restart OK, client build OK, 12 mobs spawned

### 🔲 Phase 3 — Inventory & Items
- [ ] DB: Item, Inventory models
- [ ] Server: Drop loot on mob death
- [ ] Client: Inventory UI (grid, equip, use)
- [ ] Client: Loot pickup (tap loot on ground)
- [ ] Equipment stats affect derived stats

### 🔲 Phase 4 — Quests & NPCs
- [ ] DB: Quest, QuestProgress models
- [ ] Server: Quest logic (accept, progress, complete)
- [ ] Client: NPC dialog UI
- [ ] Client: Quest journal

### 🔲 Phase 5 — Bosses & Raids
- [ ] Server: Boss mechanics (phases, AoE, enrage)
- [ ] Server: Instance system (party-only zones)
- [ ] Client: Boss UI (health bar, mechanics warnings)
- [ ] Leaderboard for boss kills

### 🔲 Phase 6 — Polish & Scaling
- [ ] Ladder/region system (multiple zones)
- [ ] Anti-cheat basics
- [ ] Mobile performance optimization
- [ ] SSL (Let's Encrypt + HTTPS)

---

## 🧩 Key Decisions

- **Full rebuild**: Wiped old codebase to eliminate accumulated bugs
- **Phase-by-phase**: Deliver + test small increments, each phase is playable
- **Auto-guest accounts**: Server creates Account + Character on first WS `auth`
- **ESM all the way**: `"type": "module"` for cleaner imports
- **Decoupled network**: `WebSocketClient` class separated from Phaser scenes
- **UIScene for HUD + joystick**: UIScene camera độc lập, không bị zoom/follow của GameScene ảnh hưởng
- **LocalStorage token**: Guest token persists across sessions; server handles multi-tab bằng cách close old WS

---

## 🔧 How to Run

```bash
# Server (PM2)
pm2 start ecosystem.config.js
pm2 restart mmorpg-server
pm2 logs mmorpg-server

# Client build
cd client && npm run build

# Nginx
sudo nginx -t && sudo nginx -s reload

# Health check
curl http://localhost/health

# DB push (after schema change)
cd server && npx prisma db push
```

## 🌐 Access
- **Local**: `http://localhost`
- **Tailscale**: `http://100.116.46.3`
- **Public IP**: `http://161.118.237.80` (tạm thời, không HTTPS)

## 🧪 Manual Testing Checklist

### Multiplayer (2 tabs)
- [ ] Tab 1 mở → spawn ở center map
- [ ] Tab 2 mở → spawn ở center map
- [ ] Tab 1 thấy Tab 2 (entity spawn)
- [ ] Tab 2 thấy Tab 1 (entity spawn)
- [ ] Di chuyển → thấy entity kia move
- [ ] Chat → thấy message của nhau

### Movement
- [ ] Joystick touch (mobile) → player di chuyển
- [ ] WASD + Arrow keys (desktop) → player di chuyển
- [ ] Map bounds clamp (không ra ngoài 50x50)
- [ ] Entity interpolation mượt (lerp)

### UI
- [ ] HP bar cập nhật theo currentHp/maxHp
- [ ] Level text update
- [ ] Zone name hiển thị
- [ ] Latency ms hiển thị (xanh <100, vàng 100-200, đỏ >200)
- [ ] Chat panel: "Tap to chat..." → prompt → send → hiện message
- [ ] Joystick không bị trượt khỏi màn hình
- [ ] UI góc trên không bị đè

### Connection
- [ ] Auth auto-create guest account
- [ ] Guest token persists (F5 → cùng character)
- [ ] Heartbeat (ping/pong mỗi 5s)
- [ ] Auto-reconnect (exponential backoff, max 10 lần)
- [ ] Close tab → broadcast entity_remove

---

## ⚠️ Known Issues
- Nginx warning: `4096 worker_connections exceed open file resource limit: 1024` — an toàn để chạy test
- `vite build` warning: chunk >500KB (Phaser 3 bundle) — ignore cho phase 1
- Server TypeScript strict errors pre-existing (tsx runtime ignores them)
- No SSL — HTTP only, traffic không mã hóa

---

## 📁 Critical Files Reference

| File | Purpose |
|---|---|
| `server/src/index.ts` | Fastify entry, /health, WS + EntityManager init, graceful shutdown |
| `server/src/ws/WebSocketServer.ts` | WebSocket: auth, move, chat, ping, heartbeat, zone broadcast, multi-tab handling |
| `server/src/game/MobSpawner.ts` | Mob spawn points, spawn/damage/respawn, patrol AI, chase AI, aggro system |
| `server/src/game/mobConfigs.ts` | 5 mob type configs (Slime→Orc): stats, exp, respawn, ranges |
| `server/src/game/combat.ts` | Damage calculation (crit, dodge), distance utility |
| `server/src/game/EntityManager.ts` | Online player map, entity data, derived stats formula |
| `server/prisma/schema.prisma` | Account + Character models |
| `shared/src/index.ts` | TypeScript interfaces shared client+server |
| `client/src/main.ts` | Phaser game config, RESIZE scale, scene registration |
| `client/src/network/WebSocketClient.ts` | WS connection, auth, heartbeat, reconnect, events |
| `client/src/scenes/BootScene.ts` | Generate placeholder textures (circle shapes) |
| `client/src/scenes/GameScene.ts` | World (50x50 map), player, entities, movement, WS handlers, keyboard |
| `client/src/scenes/UIScene.ts` | HUD (HP/level/zone/latency), chat panel, virtual joystick |
| `ecosystem.config.js` | PM2: runs server via `tsx` |
| `nginx.conf` | Reverse proxy: 80→static, /ws→3001, /api→3000 |
| `server/.env` | DATABASE_URL, SERVER_PORT=3000, WS_PORT=3001 |
