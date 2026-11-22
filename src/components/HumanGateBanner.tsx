import type { StageDeliveryReport } from '../data/stageReports';
import type { GateKind, ProjectBrief } from '../types';

interface HumanGateBannerProps {
  gateKind: GateKind;
  project: ProjectBrief;
  pendingReport: StageDeliveryReport | null;
  onOpenQA?: () => void;
  onOpenReport?: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function HumanGateBanner({
  gateKind,
  project,
  pendingReport,
  onOpenQA,
  onOpenReport,
  onApprove,
  onReject,
}: HumanGateBannerProps) {
  if (!gateKind) return null;

  const isKickoff = gateKind === 'prd';

  return (
    <div className="human-gate-banner">
      <div>
        <h3>
          {isKickoff
            ? `🏛️ Phiên Hỏi–Đáp Kickoff (6 phòng ban · 18 câu hỏi) — "${project.name}"`
            : `📋 ${pendingReport?.deptLabel ?? 'Phòng ban'} vừa nộp báo cáo "${pendingReport?.fileName ?? ''}" — Chờ Giám đốc duyệt!`}
        </h3>
        <p>
          {isKickoff
            ? 'Cả 8/8 nhân viên đã hiểu dự án và gửi 18 câu hỏi (kèm đề xuất tối ưu của 🤝 Trợ lý). Mở bảng Hỏi–Đáp để chốt Bộ nhớ chung!'
            : pendingReport?.assistantAdvice ?? 'Mời Giám đốc xem chi tiết quy trình đã làm — bấm OK để chuyển sang bước tiếp theo, hoặc trả về sửa lại.'}
        </p>
      </div>
      <div className="toolbar">
        {isKickoff && onOpenQA && (
          <button className="btn btn-primary" onClick={onOpenQA}>
            🏛️ Mở bảng Hỏi–Đáp (18 câu)
          </button>
        )}
        {!isKickoff && onOpenReport && (
          <button className="btn btn-primary" onClick={onOpenReport}>
            📄 Xem báo cáo ({pendingReport?.fileName})
          </button>
        )}
        <button className="btn btn-success" onClick={onApprove}>
          {isKickoff ? '⭐ Chốt nhanh theo Trợ lý' : '✓ OK → Bước tiếp theo'}
        </button>
        <button className="btn btn-danger" onClick={onReject}>
          {isKickoff ? '↩ Giải thích lại' : '↩ Sửa lại'}
        </button>
      </div>
    </div>
  );
}
