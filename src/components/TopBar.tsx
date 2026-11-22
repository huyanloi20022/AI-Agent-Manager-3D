interface TopBarProps {
  running: boolean;
  pausedAtGate: boolean;
  finished: boolean;
  autoOrbit: boolean;
  onOpenNewProject: () => void;
  onTogglePlay: () => void;
  onSimulateBug: () => void;
  onReset: () => void;
  onToggleOrbit: () => void;
}

export function TopBar({
  running,
  pausedAtGate,
  finished,
  autoOrbit,
  onOpenNewProject,
  onTogglePlay,
  onSimulateBug,
  onReset,
  onToggleOrbit,
}: TopBarProps) {
  const playLabel = finished
    ? '▶ Chạy lại dự án'
    : pausedAtGate
      ? '✋ Chờ CEO duyệt'
      : running
        ? '⏸ Tạm dừng'
        : '▶ Tiếp tục';

  return (
    <header className="topbar">
      <div className="brand">
        <span className="pulse-dot" />
        <div>
          <h1>AI Agent Company 3D · Quy trình 7 Giai đoạn Chuẩn</h1>
          <p>👑 Phòng Giám đốc quan sát 2 cánh · 🏛️ Phòng Họp Lớn · 💻 FE &amp; ⚙️ BE Code song song · ☕ Khu Thư giãn</p>
        </div>
      </div>
      <div className="toolbar">
        <button className="btn btn-gold" onClick={onOpenNewProject}>
          👑 Giao dự án mới
        </button>
        <button className="btn btn-primary" onClick={onTogglePlay}>
          {playLabel}
        </button>
        <button className="btn btn-warn" onClick={onSimulateBug}>
          ⚡ Giả lập lỗi Test → Rework
        </button>
        <button className="btn" onClick={onReset}>
          ↺ Reset
        </button>
        <button className="btn" onClick={onToggleOrbit}>
          {autoOrbit ? '⟳ Tự xoay: Bật' : '⟳ Tự xoay: Tắt'}
        </button>
      </div>
    </header>
  );
}
