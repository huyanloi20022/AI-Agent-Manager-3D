import { useState } from 'react';
import type { MemoryDecision } from '../data/kickoffQuestions';
import type { StageDeliveryReport } from '../data/stageReports';
import type { DeliverableArtifact, Department, LogEntry, RoomStatus } from '../types';

interface InspectorPanelProps {
  departments: Department[];
  selectedIdx: number;
  progress: number[];
  statuses: RoomStatus[];
  reworks: number;
  tools: number;
  artifacts: DeliverableArtifact[];
  companyMemory: MemoryDecision[];
  stageReports: StageDeliveryReport[];
  logs: LogEntry[];
  onSelectDept: (idx: number) => void;
  onOpenStageReport: (report: StageDeliveryReport) => void;
}

export function InspectorPanel({
  departments,
  selectedIdx,
  progress,
  statuses,
  reworks,
  tools,
  artifacts,
  companyMemory,
  stageReports,
  logs,
  onSelectDept,
  onOpenStageReport,
}: InspectorPanelProps) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const dept = departments[selectedIdx];
  const deptPct = Math.round(progress[selectedIdx] ?? 0);
  const sopPct = Math.round(progress.reduce((a, b) => a + b, 0) / departments.length);
  const status = statuses[selectedIdx];
  const readyCount = artifacts.filter((a) => a.ready).length;
  const activeArtifact = artifacts.find((a) => a.id === selectedArtifactId);

  const barColor =
    status === 'error' ? '#ef4444' : status === 'done' ? '#22c55e' : status === 'waiting' ? '#f59e0b' : dept.color;

  return (
    <aside className="sidebar">
      {/* Live KPI Metrics */}
      <div className="side-card">
        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-label">Tiến độ</div>
            <div className="metric-value">{sopPct}%</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Tài liệu</div>
            <div className="metric-value" style={{ color: '#4ade80' }}>
              {readyCount}/{artifacts.length}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Rework / Tool</div>
            <div className="metric-value" style={{ fontSize: 13 }}>
              <span style={{ color: reworks > 0 ? '#f87171' : undefined }}>{reworks}</span> · {tools}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Department Card */}
      <div className="side-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            Chi tiết phòng ban
          </span>
          <span className="badge-kind">{dept.kind}</span>
        </div>

        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700 }}>{dept.title}</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{dept.role}</p>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Độ hoàn thành phòng này</span>
            <strong style={{ fontFamily: 'ui-monospace, monospace', color: barColor }}>{deptPct}%</strong>
          </div>
          <div className="room-badge-bar" style={{ height: 6 }}>
            <div className="room-badge-fill" style={{ width: `${deptPct}%`, background: barColor }} />
          </div>
        </div>

        <p style={{ fontSize: 12, lineHeight: 1.5, color: '#cbd5e1' }}>{dept.desc}</p>

        <div className="dept-pills">
          {departments.map((d, idx) => (
            <button
              key={d.id}
              className={`dept-pill ${idx === selectedIdx ? 'active' : ''}`}
              onClick={() => onSelectDept(idx)}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {/* Enterprise Deliverables (Artifacts) */}
      <div className="side-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            Tài liệu bàn giao (Artifacts)
          </span>
          <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'ui-monospace, monospace' }}>
            {readyCount}/{artifacts.length} sẵn sàng
          </span>
        </div>
        <div className="artifact-grid">
          {artifacts.map((art) => (
            <button
              key={art.id}
              type="button"
              className={`artifact-chip ${art.ready ? 'ready' : ''} ${selectedArtifactId === art.id ? 'selected' : ''}`}
              onClick={() => setSelectedArtifactId(selectedArtifactId === art.id ? null : art.id)}
            >
              <span>{art.ready ? '✓' : '○'}</span>
              <span>{art.fileName}</span>
            </button>
          ))}
        </div>
        {activeArtifact && (
          <div className="artifact-preview">
            <div style={{ fontWeight: 600, color: activeArtifact.ready ? '#4ade80' : '#94a3b8' }}>
              {activeArtifact.fileName} · {activeArtifact.owner}
            </div>
            <div style={{ marginTop: 3, color: '#cbd5e1' }}>
              {activeArtifact.ready ? activeArtifact.summary : 'Chưa bàn giao — chờ phòng ban hoàn tất giai đoạn này.'}
            </div>
          </div>
        )}
      </div>

      {/* Shared Company Memory (CEO Decisions from Kickoff Q&A) */}
      {companyMemory.length > 0 && (
        <div className="side-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ddd6fe' }}>
              🧠 Bộ nhớ chung Công ty
            </span>
            <span style={{ fontSize: 11, color: '#c4b5fd', fontFamily: 'ui-monospace, monospace' }}>
              {companyMemory.length} quyết định CEO
            </span>
          </div>
          <div className="memory-list">
            {companyMemory.map((m) => (
              <div key={m.questionId} className="memory-row">
                <strong>{m.deptLabel}</strong>{' '}
                <span style={{ color: '#a78bfa' }}>(Ref: {m.refs.join(', ')})</span>: {m.chosenLabel}
                {m.ceoNote ? <div style={{ color: '#fde68a' }}>👑 Ghi chú CEO: {m.ceoNote}</div> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Process Reports History */}
      {stageReports.length > 0 && (
        <div className="side-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd' }}>
              📄 Báo cáo quy trình giai đoạn
            </span>
            <span style={{ fontSize: 11, color: '#93c5fd', fontFamily: 'ui-monospace, monospace' }}>
              {stageReports.length} báo cáo
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {stageReports.map((rep) => (
              <button
                key={rep.id}
                type="button"
                className="artifact-chip ready"
                style={{ justifyContent: 'space-between', width: '100%', padding: '6px 9px' }}
                onClick={() => onOpenStageReport(rep)}
              >
                <span>📄 {rep.stageLabel}</span>
                <span>Xem →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Activity Feed */}
      <div className="side-card" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            Nhật ký điều hành công ty
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>Real-time</span>
        </div>
        <div className="log-list">
          {logs.map((entry) => {
            const dot =
              entry.tone === 'error'
                ? '#ef4444'
                : entry.tone === 'success'
                  ? '#22c55e'
                  : entry.tone === 'warn'
                    ? '#f59e0b'
                    : '#3b82f6';
            return (
              <div key={entry.id} className="log-item">
                <span className="legend-dot" style={{ background: dot, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <span className="log-time">[{entry.time}]</span>
                  <span>{entry.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
