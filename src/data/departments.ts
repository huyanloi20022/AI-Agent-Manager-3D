import type { Department } from '../types';

export const DEPARTMENTS: Department[] = [
  {
    id: 'ceo',
    short: '👑 Giám đốc (Bạn)',
    title: 'Phòng Giám đốc (CEO — Trung tâm quan sát 2 cánh)',
    role: 'Bạn · Chủ trì họp Kickoff & Duyệt cuối',
    kind: 'CEO · Human Gate',
    color: '#eab308',
    position: [0, 0, -6.2],
    facing: 'south',
    doorPos: [0, -3.55],
    input: 'Ý tưởng & Báo cáo QA',
    output: 'Định hướng / Approve / Reject',
    desc: 'Phòng điều hành trung tâm kính 3 mặt, nhìn bao quát cả 2 cánh Trái – Phải và Phòng Họp Lớn phía trước. Bạn chủ trì họp Kickoff và là người duyệt Approve / Reject cuối cùng.',
    equipment: 'ceo',
  },
  // Left Wing (facing East toward the central hallway & Meeting Room)
  {
    id: 'assistant',
    short: '🤝 Trợ lý (Bot)',
    title: 'Phòng Trợ lý Giám đốc (Main Bot)',
    role: 'Executive Assistant · Điều phối chính',
    kind: 'AI Assistant',
    color: '#ec4899',
    position: [-9.2, 0, -4.4],
    facing: 'east',
    doorPos: [-6.1, -4.4],
    input: 'Biên bản họp Kickoff',
    output: 'Brief & Điều phối phòng ban',
    desc: 'Nằm ngay cánh trái sát Phòng Giám đốc. Ghi chép biên bản họp Kickoff, mang task sang Design và truyền lệnh Approve từ bạn xuống DevOps.',
    equipment: 'assistant',
  },
  {
    id: 'design',
    short: '🎨 Design',
    title: 'Phòng Product & UI Design',
    role: 'Plan & UI Designer · AI Agent',
    kind: 'AI Agent',
    color: '#3b82f6',
    position: [-9.2, 0, -0.2],
    facing: 'east',
    doorPos: [-6.1, -0.2],
    input: 'Brief từ Trợ lý',
    output: 'Bản thiết kế design.md',
    desc: 'Thiết kế giao diện, trải nghiệm người dùng, sơ đồ component và mô hình dữ liệu. Xong việc sẽ mang bản thiết kế sang Phòng Frontend rồi ra Khu Thư giãn.',
    equipment: 'design',
  },
  {
    id: 'frontend',
    short: '💻 Frontend',
    title: 'Phòng Frontend Engineering',
    role: 'Frontend Engineer · AI Agent',
    kind: 'AI Agent · Sandbox',
    color: '#8b5cf6',
    position: [-9.2, 0, 4.0],
    facing: 'east',
    doorPos: [-6.1, 4.0],
    input: 'design.md / Lỗi Rework',
    output: 'Giao diện React + Biểu đồ',
    desc: 'Xây dựng giao diện React/Tailwind/Three.js trong Docker Sandbox. Khi bị QA hoặc Giám đốc trả về Rework sẽ quay lại bàn làm việc sửa ngay.',
    equipment: 'frontend',
  },
  // Right Wing (facing West toward the central hallway & Meeting Room)
  {
    id: 'backend',
    short: '⚙️ Backend',
    title: 'Phòng Backend & API',
    role: 'Backend Engineer · AI Agent',
    kind: 'AI Agent · Sandbox',
    color: '#6366f1',
    position: [9.2, 0, -4.4],
    facing: 'west',
    doorPos: [6.1, -4.4],
    input: 'Contract từ Frontend',
    output: 'API + Logic + Unit Tests',
    desc: 'Nằm ở cánh phải, xây dựng logic xử lý dữ liệu, lưu trữ, API và viết unit test. Hoàn thành sẽ mang mã nguồn sang Phòng Review rồi ra Khu Thư giãn.',
    equipment: 'backend',
  },
  {
    id: 'review',
    short: '🔍 Review Lab',
    title: 'Phòng Code Review Độc lập',
    role: 'Code Reviewer · AI Agent',
    kind: 'AI Agent · Chromium',
    color: '#06b6d4',
    position: [9.2, 0, -0.2],
    facing: 'west',
    doorPos: [6.1, -0.2],
    input: 'Code diff Frontend & Backend',
    output: 'Báo cáo review.md',
    desc: 'Chuyên gia AI độc lập soi từng dòng diff, kiểm tra bảo mật và chạy thử trên trình duyệt Chromium thật trước khi mang sang phòng QA.',
    equipment: 'review',
  },
  {
    id: 'qa',
    short: '🧪 QA Script',
    title: 'Phòng QA Tự động (CI Script)',
    role: 'Auto Test & Build · Shell Script',
    kind: 'CI Script · 0 Token',
    color: '#f59e0b',
    position: [9.2, 0, 4.0],
    facing: 'west',
    doorPos: [6.1, 4.0],
    input: 'Toàn bộ Workspace',
    output: 'Báo cáo Vitest & Build',
    desc: 'Chạy test tự động không tốn AI token. Nếu lỗi sẽ cầm gói đỏ chạy sang Phòng Frontend gọi kỹ sư dậy sửa; nếu Pass sẽ mang báo cáo lên Giám đốc!',
    equipment: 'qa',
  },
  // Bottom Left (facing North)
  {
    id: 'release',
    short: '🚀 GitHub PR',
    title: 'Phòng DevOps & Phát hành',
    role: 'GitHub PR Publisher · AI Agent',
    kind: 'AI Agent · GitHub',
    color: '#22c55e',
    position: [-3.8, 0, 6.2],
    facing: 'north',
    doorPos: [-3.8, 3.55],
    input: 'Lệnh Approve từ Giám đốc',
    output: 'Pull Request trên GitHub',
    desc: 'Đóng gói commit, đẩy nhánh mới và mở Pull Request lên GitHub. Xong việc sẽ bắn pháo hoa ăn mừng và sang Khu Thư giãn kế bên tụ họp cùng cả công ty!',
    equipment: 'release',
  },
];

// GRAND KICKOFF MEETING ROOM (Heart of HQ: 8.6 × 4.6, more than 2.5x normal room size!)
export const MEETING_CENTER: [number, number] = [0, -0.2];
export const MEETING_SPOTS: Array<[number, number]> = [
  [0, -1.65],     // 0: CEO at grand north head of table
  [-1.7, -1.35],  // 1: Assistant
  [-2.65, -0.2],  // 2: Design
  [-1.7, 1.05],   // 3: Frontend
  [1.7, -1.35],   // 4: Backend
  [2.65, -0.2],   // 5: Review
  [1.7, 1.05],    // 6: QA
  [0, 1.25],      // 7: Release
];

// SPACIOUS CAFÉ LOUNGE (Bottom Right Wing: 6.4 × 3.2)
export const LOUNGE_CENTER: [number, number] = [2.6, 6.2];
export const LOUNGE_SPOTS: Array<[number, number]> = [
  [0.2, 5.5],  // 0: CEO backup
  [0.9, 5.45], // 1: Assistant near espresso bar
  [2.1, 5.35], // 2: Design north sofa
  [3.4, 5.35], // 3: Frontend north sofa
  [4.8, 6.2],  // 4: Backend east lounge
  [3.4, 7.05], // 5: Review south sofa
  [2.1, 7.05], // 6: QA south sofa
  [0.9, 6.95], // 7: Release west lounge
];

/** Clean ring-corridor pathfinding around the Grand Meeting Room (ring at x=±6.1, z=-3.55, z=+3.55) */
export function buildOfficePath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  fromDoor?: [number, number],
  toDoor?: [number, number]
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const push = (x: number, z: number) => {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(last[0] - x, last[1] - z) > 0.15) {
      pts.push([x, z]);
    }
  };

  // Ring corridor coordinates
  const L = -6.1;
  const R = 6.1;
  const N = -3.55;
  const S = 3.55;

  // Step 1: Exit source space onto the ring corridor
  let curX = fromX;
  let curZ = fromZ;
  if (fromDoor) {
    push(fromDoor[0], fromDoor[1]);
    curX = fromDoor[0];
    curZ = fromDoor[1];
  } else if (Math.abs(fromX) < 4.5 && Math.abs(fromZ - MEETING_CENTER[1]) < 2.5) {
    // Exiting Grand Meeting Room via nearest N/S doorway
    const exitZ = toZ < MEETING_CENTER[1] ? N : S;
    push(0, exitZ);
    curX = 0;
    curZ = exitZ;
  } else if (fromZ > 4.2 && fromX > -1) {
    // Exiting Café Lounge onto south corridor
    push(fromX, S);
    curX = fromX;
    curZ = S;
  }

  // Step 2: Determine entry point on ring corridor for destination
  let targetEntryX = toX;
  let targetEntryZ = toZ;
  if (toDoor) {
    targetEntryX = toDoor[0];
    targetEntryZ = toDoor[1];
  } else if (Math.abs(toX) < 4.5 && Math.abs(toZ - MEETING_CENTER[1]) < 2.5) {
    // Entering Grand Meeting Room via N/S doorway
    targetEntryX = 0;
    targetEntryZ = curZ < MEETING_CENTER[1] ? N : S;
  } else if (toZ > 4.2 && toX > -1) {
    // Entering Café Lounge from south corridor
    targetEntryX = toX;
    targetEntryZ = S;
  }

  // Step 3: Walk around the ring corridor cleanly (never cutting through the Grand Meeting Room!)
  const onLeft = (x: number) => x <= -5.2;
  const onRight = (x: number) => x >= 5.2;
  const onNorth = (z: number) => z <= -3.0;
  const onSouth = (z: number) => z >= 3.0;

  if (onLeft(curX) && onRight(targetEntryX)) {
    const viaZ = curZ + targetEntryZ < 0 ? N : S;
    push(L, viaZ);
    push(R, viaZ);
  } else if (onRight(curX) && onLeft(targetEntryX)) {
    const viaZ = curZ + targetEntryZ < 0 ? N : S;
    push(R, viaZ);
    push(L, viaZ);
  } else if (onNorth(curZ) && onSouth(targetEntryZ)) {
    const viaX = curX + targetEntryX < 0 ? L : R;
    push(viaX, N);
    push(viaX, S);
  } else if (onSouth(curZ) && onNorth(targetEntryZ)) {
    const viaX = curX + targetEntryX < 0 ? L : R;
    push(viaX, S);
    push(viaX, N);
  } else if ((onLeft(curX) || onRight(curX)) && (onNorth(targetEntryZ) || onSouth(targetEntryZ))) {
    push(curX, targetEntryZ);
  } else if ((onNorth(curZ) || onSouth(curZ)) && (onLeft(targetEntryX) || onRight(targetEntryX))) {
    push(targetEntryX, curZ);
  }

  push(targetEntryX, targetEntryZ);
  push(toX, toZ);
  return pts;
}
