import type { ProjectBrief, ProjectStageId } from '../types';

export const PROJECT_STAGES: Array<{ id: ProjectStageId; label: string }> = [
  { id: 'discovery', label: '1. Họp & Hiểu dự án' },
  { id: 'kickoff_design', label: '2. PRD & Thiết kế' },
  { id: 'implementation', label: '3. Lặp Code ↔ Test' },
  { id: 'review_qa', label: '4. Review & QA Tổng' },
  { id: 'uat', label: '5. CEO Duyệt UAT' },
  { id: 'release', label: '6. Release PR' },
  { id: 'retro', label: '7. Tổng kết & KPI' },
];

interface StageBarProps {
  project: ProjectBrief;
  currentStage: ProjectStageId;
  milestone: number;
  totalMilestones: number;
  completed: boolean;
}

export function StageBar({ project, currentStage, milestone, totalMilestones, completed }: StageBarProps) {
  const curIdx = PROJECT_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="stage-bar">
      <div className="stage-project-tag">
        <span className="stage-project-name">📁 {project.name}</span>
        <span className="stage-project-budget">
          {currentStage === 'implementation' ? `Vòng ${milestone}/${totalMilestones}` : project.budget}
        </span>
      </div>
      <div className="stage-steps">
        {PROJECT_STAGES.map((st, idx) => {
          const isDone = completed || idx < curIdx;
          const isActive = !completed && idx === curIdx;
          const label =
            st.id === 'implementation' && isActive
              ? `3. Code ↔ Test (Vòng ${milestone}/${totalMilestones})`
              : st.label;
          return (
            <div key={st.id} className={`stage-chip ${isDone ? 'done' : isActive ? 'active' : ''}`}>
              <span>{isDone ? '✓' : ''}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
