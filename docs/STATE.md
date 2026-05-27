# 🧠 Current Agent State (Short-term Memory)

> **Dành cho Agent:** Khi bắt đầu một phiên làm việc mới, HÃY ĐỌC FILE NÀY ĐẦU TIÊN để biết mình đang ở đâu, vừa làm gì và phải làm gì tiếp theo, tránh việc phải quét lại toàn bộ codebase. 
> 
> **Hãy tự động cập nhật file này trước khi kết thúc ca làm việc (handoff).**

---

## 🟢 Vừa hoàn thành (Just Completed)
- Đã quy hoạch lại toàn bộ file hướng dẫn AI (`AGENTS.md`, `SKILLS.md`, `CONTEXT.md`).
- Thiết lập xong Sandcastle prompt và OpenCode commands.

## 🟡 Đang dang dở / Lỗi hiện tại (In Progress / Known Issues)
- Đang chuẩn bị chuyển giao sang Phase 3 (Lớp Nhân Vật & Kỹ Năng).
- Chưa có lỗi nào hiện tại.

## 🔴 Bước tiếp theo ngay lập tức (Immediate Next Step)
1. Tạo file config JSON/TypeScript cho hệ thống Skill (Data-driven logic).
2. Định nghĩa cấu trúc Schema Prisma cho Class & Skill Progress nếu cần lưu trữ.
3. Thiết kế Event luồng cast skill từ Client -> Server (Targeting, CD check, Damage calculation).
