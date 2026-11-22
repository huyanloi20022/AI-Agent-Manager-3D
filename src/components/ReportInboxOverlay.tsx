import { useState } from 'react';
import type { StageDeliveryReport } from '../data/stageReports';

interface ReportInboxOverlayProps {
  reports: StageDeliveryReport[];
  onSelectReport: (report: StageDeliveryReport) => void;
}

export function ReportInboxOverlay({ reports, onSelectReport }: ReportInboxOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="report-inbox-overlay">
      <div className="report-inbox-header" onClick={() => setCollapsed((c) => !c)}>
        <div className="report-inbox-title">
          <span>📋 Báo cáo nộp Giám đốc</span>
          {pendingCount > 0 && <span className="inbox-pending-badge">{pendingCount} chờ duyệt</span>}
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {reports.length} file {collapsed ? '▾' : '▴'}
        </span>
      </div>

      {!collapsed && (
        <div className="report-inbox-list">
          {reports.length === 0 ? (
            <div className="report-inbox-empty">
              Chưa có báo cáo nào. Sau họp Kickoff, từng phòng làm xong sẽ nộp báo cáo vào danh sách này để bạn duyệt!
            </div>
          ) : (
            reports.map((rep) => {
              const badge =
                rep.status === 'pending'
                  ? { text: 'Chờ duyệt', cls: 'st-pending' }
                  : rep.status === 'approved'
                    ? { text: 'Đã OK', cls: 'st-approved' }
                    : { text: 'Sửa lại', cls: 'st-rejected' };
              return (
                <button
                  key={rep.id}
                  type="button"
                  className={`report-inbox-row ${rep.status === 'pending' ? 'is-pending' : ''}`}
                  onClick={() => onSelectReport(rep)}
                >
                  <div className="report-row-top">
                    <span className="report-row-dept">{rep.deptLabel}</span>
                    <span className={`report-status-pill ${badge.cls}`}>{badge.text}</span>
                  </div>
                  <div className="report-row-bottom">
                    <span className="report-row-file">📄 {rep.fileName}</span>
                    <span className="report-row-time">{rep.submittedAt}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

