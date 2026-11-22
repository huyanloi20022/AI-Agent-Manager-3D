import { useState } from 'react';
import type { ProjectBrief } from '../types';

interface NewProjectModalProps {
  open: boolean;
  current: ProjectBrief;
  onClose: () => void;
  onSubmit: (brief: ProjectBrief) => void;
}

const PRESETS: ProjectBrief[] = [
  {
    name: 'Personal Expense Tracker',
    description: 'Ứng dụng quản lý chi tiêu cá nhân có biểu đồ tròn, biểu đồ cột, thanh ngân sách cảnh báo và bộ lọc.',
    budget: '$1,200 · 1 Sprint',
  },
  {
    name: 'Sàn Thương Mại Điện Tử Mini',
    description: 'Website bán hàng có giỏ hàng, thanh toán QR, quản lý đơn hàng và dashboard doanh thu thời gian thực.',
    budget: '$4,500 · 2 Sprints',
  },
  {
    name: 'Hệ thống Quản lý Kho AI',
    description: 'Quản lý nhập/xuất tồn kho, quét mã vạch, cảnh báo hết hàng tự động và báo cáo tồn kho theo ngày.',
    budget: '$6,000 · 2 Sprints',
  },
];

export function NewProjectModal({ open, current, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState(current.name);
  const [description, setDescription] = useState(current.description);
  const [budget, setBudget] = useState(current.budget);

  if (!open) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || 'Triển khai theo quy trình 7 giai đoạn chuẩn công ty.',
      budget: budget.trim() || '$2,000',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleApply}>
        <div className="modal-head">
          <div>
            <h2>👑 Giám đốc giao dự án mới</h2>
            <p>Cả 8 phòng ban sẽ tập trung vào Phòng Họp Lớn nghe bạn trình bày và xác nhận hiểu dự án trước tiên, sau đó mới giải tán về phòng triển khai.</p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="preset-row">
          <span className="preset-label">Chọn nhanh mẫu:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="dept-pill"
              onClick={() => {
                setName(p.name);
                setDescription(p.description);
                setBudget(p.budget);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <label className="field-label">
          Tên dự án
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: App Quản lý Chi tiêu Cá nhân"
            required
          />
        </label>

        <label className="field-label">
          Mục tiêu &amp; Phạm vi chính (Brief cho Trợ lý soạn PRD)
          <textarea
            className="field-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả tính năng cốt lõi, người dùng mục tiêu..."
          />
        </label>

        <label className="field-label">
          Ngân sách &amp; Thời gian dự kiến
          <input
            className="field-input"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Ví dụ: $2,500 · 1 Sprint"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            🏛️ Triệu tập họp Kickoff &amp; Giao dự án
          </button>
        </div>
      </form>
    </div>
  );
}

