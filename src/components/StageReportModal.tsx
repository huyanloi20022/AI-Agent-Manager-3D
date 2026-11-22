import { useEffect, useState } from 'react';
import type { StageDeliveryReport } from '../data/stageReports';

interface StageReportModalProps {
  report: StageDeliveryReport | null;
  canDecide: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  onClose: () => void;
  onApprove?: (feedback: string) => void;
  onReject?: (feedback: string) => void;
}

const QUICK_FEEDBACKS = [
  'Bổ sung thêm kiểm thử trường hợp biên (số âm / rỗng)',
  'Chỉnh giao diện Mobile gọn và dễ bấm hơn',
  'Viết rõ hơn phần kiến trúc & hợp đồng API',
];

export function StageReportModal({
  report,
  canDecide,
  approveLabel = '✓ Duyệt giai đoạn này',
  rejectLabel = '↩ Trả về sửa lại',
  onClose,
  onApprove,
  onReject,
}: StageReportModalProps) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setFeedback(report?.ceoFeedback ?? '');
  }, [report]);

  if (!report) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="qa-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="badge-kind" style={{ marginBottom: 6, display: 'inline-block' }}>
              {report.stageLabel}
            </span>
            <h2>📄 {report.title}</h2>
            <p>Mô tả chi tiết bài toán, quy trình từng phòng ban đã thực hiện và bằng chứng kiểm thử.</p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="qa-body">
          {/* 1. Problem */}
          <div className="qa-item">
            <div className="qa-q-title">1. 🎯 Vấn đề giải quyết ở giai đoạn này</div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.55 }}>{report.problem}</p>
          </div>

          {/* 2. Detailed Step-by-Step Process */}
          <div className="qa-item">
            <div className="qa-q-title">2. ⚙️ Quy trình thực hiện chi tiết từng bước</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.processSteps.map((step, idx) => (
                <div key={idx} className="process-step-row">
                  <div className="process-step-num">{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                      {step.actor} — <span style={{ color: '#93c5fd' }}>{step.action}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2, lineHeight: 1.45 }}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Shared Memory References */}
          {report.appliedMemory.length > 0 && (
            <div className="qa-item">
              <div className="qa-q-title">3. 🧠 Quyết định từ Bộ nhớ chung đã áp dụng</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {report.appliedMemory.map((m, i) => (
                  <div key={i} className="memory-row">
                    • {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Verification & Deliverables */}
          <div className="io-grid">
            <div className="qa-item">
              <div className="qa-q-title">4. 🧪 Bằng chứng kiểm thử</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#86efac' }}>
                {report.verification.map((v, i) => (
                  <div key={i}>{v}</div>
                ))}
              </div>
            </div>
            <div className="qa-item">
              <div className="qa-q-title">5. 📦 File / Sản phẩm bàn giao</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {report.deliverables.map((d, i) => (
                  <span key={i} className="artifact-chip ready">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Assistant Advice */}
          <div className="assistant-tip">
            <strong>⭐ Tổng hợp &amp; Khuyến nghị của 🤝 Trợ lý:</strong> {report.assistantAdvice}
          </div>

          {/* 6. CEO Editable Feedback / Revision Box */}
          <div className="qa-item" style={{ borderColor: 'rgba(234, 179, 8, 0.45)' }}>
            <div className="qa-q-title" style={{ color: '#fde68a' }}>
              6. ✍️ Góp ý / Yêu cầu chỉnh sửa của 👑 Giám đốc
            </div>
            {canDecide ? (
              <>
                <div className="preset-row">
                  <span className="preset-label">Góp ý nhanh:</span>
                  {QUICK_FEEDBACKS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="dept-pill"
                      onClick={() => setFeedback((prev) => (prev ? `${prev}; ${q}` : q))}
                    >
                      + {q}
                    </button>
                  ))}
                </div>
                <textarea
                  className="field-input"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập góp ý, điểm cần sửa hoặc chỉ đạo bổ sung cho phòng ban này (sẽ được lưu vào báo cáo & gửi lại phòng nếu bạn bấm Trả về sửa)..."
                />
              </>
            ) : (
              <div style={{ fontSize: 12, color: report.ceoFeedback ? '#fde68a' : 'var(--muted)' }}>
                {report.ceoFeedback
                  ? `👑 "${report.ceoFeedback}"`
                  : 'Giám đốc không để lại ghi chú chỉnh sửa cho báo cáo này.'}
              </div>
            )}
          </div>
        </div>

        <div className="qa-footer">
          <div className="qa-summary">
            Báo cáo lưu tại Hộp thư góc trên phải — góp ý của bạn sẽ được phòng ban tiếp thu trực tiếp.
          </div>
          <div className="toolbar">
            <button type="button" className="btn" onClick={onClose}>
              Xem mô hình 3D
            </button>
            {canDecide && onReject && (
              <button type="button" className="btn btn-danger" onClick={() => onReject(feedback.trim())}>
                {rejectLabel}
              </button>
            )}
            {canDecide && onApprove && (
              <button type="button" className="btn btn-success" onClick={() => onApprove(feedback.trim())}>
                {approveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
