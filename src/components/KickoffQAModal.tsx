import { useMemo, useState } from 'react';
import type { DeptQuestion, MemoryDecision } from '../data/kickoffQuestions';
import type { ProjectBrief } from '../types';

interface KickoffQAModalProps {
  open: boolean;
  project: ProjectBrief;
  questions: DeptQuestion[];
  onMinimize: () => void;
  onConfirmAll: (decisions: MemoryDecision[]) => void;
}

const DEPT_TABS = [
  { id: 'design', label: '🎨 Design' },
  { id: 'frontend', label: '💻 Frontend' },
  { id: 'backend', label: '⚙️ Backend' },
  { id: 'review', label: '🔍 Review' },
  { id: 'qa', label: '🧪 QA' },
  { id: 'release', label: '🚀 DevOps' },
];

export function KickoffQAModal({
  open,
  project,
  questions,
  onMinimize,
  onConfirmAll,
}: KickoffQAModalProps) {
  const [activeDept, setActiveDept] = useState('design');

  // Pre-fill Assistant's recommended best options so CEO can review, tweak, or approve fast!
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      const rec = q.options.find((o) => o.isRecommended) ?? q.options[0];
      map[q.id] = rec.id;
    }
    return map;
  });

  const [ceoNotes, setCeoNotes] = useState<Record<string, string>>({});

  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.deptId === activeDept),
    [questions, activeDept]
  );

  if (!open) return null;

  const handleApplyAssistantAll = () => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      const rec = q.options.find((o) => o.isRecommended) ?? q.options[0];
      map[q.id] = rec.id;
    }
    setSelections(map);
  };

  const handleFinalize = () => {
    const decisions: MemoryDecision[] = questions.map((q) => {
      const chosenId = selections[q.id];
      const opt = q.options.find((o) => o.id === chosenId) ?? q.options[0];
      return {
        questionId: q.id,
        deptLabel: q.deptLabel,
        refs: q.refs,
        chosenLabel: opt.label,
        ceoNote: ceoNotes[q.id]?.trim() || undefined,
      };
    });
    onConfirmAll(decisions);
  };

  return (
    <div className="modal-backdrop">
      <div className="qa-modal-card">
        <div className="modal-head">
          <div>
            <h2>🏛️ Phiên Hỏi – Đáp Phòng Họp Lớn · &ldquo;{project.name}&rdquo;</h2>
            <p>
              Mỗi phòng ban đặt 3 câu hỏi (có tham chiếu 🧠 Bộ nhớ sang các phòng khác). <strong>🤝 Trợ lý</strong> đã đề xuất sẵn phương án tối ưu ⭐ — <strong>👑 Giám đốc (Bạn)</strong> xem và chốt quyết định cuối cùng!
            </p>
          </div>
          <button type="button" className="btn" onClick={onMinimize}>
            Thu nhỏ xem 3D
          </button>
        </div>

        {/* Department Tabs */}
        <div className="qa-tabs">
          {DEPT_TABS.map((tab) => {
            const count = questions.filter((q) => q.deptId === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                className={`qa-tab ${activeDept === tab.id ? 'active' : ''}`}
                onClick={() => setActiveDept(tab.id)}
              >
                {tab.label} <span className="qa-tab-count">{count} câu</span>
              </button>
            );
          })}
        </div>

        {/* Questions List for Active Department */}
        <div className="qa-body">
          {visibleQuestions.map((q, idx) => (
            <div key={q.id} className="qa-item">
              <div className="qa-item-head">
                <div className="qa-q-title">
                  Câu {idx + 1}: {q.question}
                </div>
                <div className="qa-refs">
                  <span className="ref-badge">🧠 Tham chiếu: {q.refs.join(' · ')}</span>
                </div>
              </div>

              <div className="assistant-tip">
                <strong>⭐ Đề xuất của 🤝 Trợ lý:</strong> {q.assistantReason}
              </div>

              <div className="qa-options">
                {q.options.map((opt) => {
                  const checked = selections[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`qa-option ${checked ? 'selected' : ''}`}
                      onClick={() => setSelections((prev) => ({ ...prev, [q.id]: opt.id }))}
                    >
                      <span className="qa-radio">{checked ? '●' : '○'}</span>
                      <span className="qa-opt-text">{opt.label}</span>
                      {opt.isRecommended && <span className="rec-pill">⭐ Trợ lý khuyên dùng</span>}
                    </button>
                  );
                })}
              </div>

              <input
                className="qa-note-input"
                placeholder="Ghi chú chỉ đạo riêng của Giám đốc (tùy chọn)..."
                value={ceoNotes[q.id] ?? ''}
                onChange={(e) => setCeoNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="qa-footer">
          <div className="qa-summary">
            Tổng: <strong>{questions.length} câu hỏi</strong> từ 6 phòng ban · Đã chọn đủ <strong>{Object.keys(selections).length}/{questions.length}</strong> quyết định để lưu vào <strong>🧠 Bộ nhớ chung Công ty</strong>.
          </div>
          <div className="toolbar">
            <button type="button" className="btn btn-warn" onClick={handleApplyAssistantAll}>
              ⭐ Chọn toàn bộ theo Trợ lý
            </button>
            <button type="button" className="btn btn-success" onClick={handleFinalize}>
              ✓ Chốt quyết định &amp; Lưu Bộ nhớ → Bắt đầu triển khai!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

