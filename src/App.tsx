import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HumanGateBanner } from './components/HumanGateBanner';
import { InspectorPanel } from './components/InspectorPanel';
import { KickoffQAModal } from './components/KickoffQAModal';
import { NewProjectModal } from './components/NewProjectModal';
import { ReportInboxOverlay } from './components/ReportInboxOverlay';
import { StageBar } from './components/StageBar';
import { StageReportModal } from './components/StageReportModal';
import { TopBar } from './components/TopBar';
import {
  buildOfficePath,
  DEPARTMENTS,
  LOUNGE_CENTER,
  LOUNGE_SPOTS,
  MEETING_CENTER,
  MEETING_SPOTS,
} from './data/departments';
import { buildKickoffQuestions, type MemoryDecision } from './data/kickoffQuestions';
import { buildDepartmentReport, type StageDeliveryReport } from './data/stageReports';
import { CompanyScene } from './three/CompanyScene';
import type {
  AgentRuntime,
  DeliverableArtifact,
  GateKind,
  LogEntry,
  ProjectBrief,
  ProjectStageId,
  ProjectedRoomLabel,
  RoomStatus,
} from './types';

function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour12: false });
}

function deskSeat(idx: number): [number, number] {
  const d = DEPARTMENTS[idx];
  const offset = 0.45;
  switch (d.facing) {
    case 'south':
      return [d.position[0], d.position[2] + offset];
    case 'north':
      return [d.position[0], d.position[2] - offset];
    case 'east':
      return [d.position[0] + offset, d.position[2]];
    case 'west':
      return [d.position[0] - offset, d.position[2]];
  }
}

function deskFacing(idx: number): number {
  switch (DEPARTMENTS[idx].facing) {
    case 'south':
      return Math.PI;
    case 'north':
      return 0;
    case 'east':
      return -Math.PI / 2;
    case 'west':
      return Math.PI / 2;
  }
}

function isInsideOwnRoom(ag: AgentRuntime, idx: number): boolean {
  const d = DEPARTMENTS[idx];
  return Math.hypot(ag.x - d.position[0], ag.z - d.position[2]) < 2.4;
}

function createInitialArtifacts(project: ProjectBrief): DeliverableArtifact[] {
  return [
    {
      id: 'prd',
      stage: 'kickoff_design',
      fileName: 'PRD.md',
      owner: '🤝 Trợ lý / PM',
      summary: `Biên bản họp & Tài liệu yêu cầu sản phẩm cho "${project.name}" (${project.budget}) sau khi cả 8 phòng ban đã hiểu rõ mục tiêu.`,
      ready: false,
    },
    {
      id: 'design',
      stage: 'kickoff_design',
      fileName: 'design.md',
      owner: '🎨 Design',
      summary: `Bản vẽ giao diện, sơ đồ component và hợp đồng API cho "${project.name}".`,
      ready: false,
    },
    {
      id: 'fe',
      stage: 'implementation',
      fileName: 'frontend-ui',
      owner: '💻 Frontend',
      summary: 'Mã nguồn giao diện React + Tailwind + Biểu đồ trực quan hoàn chỉnh trong Docker Sandbox.',
      ready: false,
    },
    {
      id: 'be',
      stage: 'implementation',
      fileName: 'backend-api',
      owner: '⚙️ Backend',
      summary: 'Logic nghiệp vụ, API xử lý dữ liệu và 20 unit test Vitest đạt độ phủ đầy đủ.',
      ready: false,
    },
    {
      id: 'review',
      stage: 'review_qa',
      fileName: 'review.md',
      owner: '🔍 Review Lab',
      summary: 'Đánh giá độc lập diff code & kiểm tra giao diện thực tế trên trình duyệt Chromium (Desktop & Mobile).',
      ready: false,
    },
    {
      id: 'qa',
      stage: 'review_qa',
      fileName: 'ci-test.log',
      owner: '🧪 QA Script',
      summary: 'vitest --run: 20/20 PASSED · tsc --noEmit: 0 errors · vite build: dist/ sẵn sàng.',
      ready: false,
    },
    {
      id: 'release',
      stage: 'release',
      fileName: 'Release v1.0.0',
      owner: '🚀 DevOps PR',
      summary: `Pull Request đã mở & gắn tag v1.0.0 cho "${project.name}" kèm Release Notes & phương án Rollback.`,
      ready: false,
    },
    {
      id: 'kpi',
      stage: 'retro',
      fileName: 'EOD-KPI.md',
      owner: '🤝 Trợ lý → 👑 CEO',
      summary: `Báo cáo tổng kết KPI, chi phí vận hành (${project.budget}) và đề xuất tối ưu SOP cho sprint sau.`,
      ready: false,
    },
  ];
}

/** Everyone immediately walks into the Grand Meeting Room FIRST to understand the project! */
function createInitialAgentsForMeeting(): AgentRuntime[] {
  return DEPARTMENTS.map((dept, idx) => {
    const [x, z] = deskSeat(idx);
    const [mx, mz] = MEETING_SPOTS[idx];
    return {
      deptIdx: idx,
      activity: 'walking_meeting',
      x,
      z,
      rotY: deskFacing(idx),
      path: buildOfficePath(x, z, mx, mz, dept.doorPos, undefined),
      carryingTask: false,
      carryingRework: false,
      onArrive: { type: 'meeting' },
      loungeSpot: LOUNGE_SPOTS[idx],
      meetingSpot: MEETING_SPOTS[idx],
    };
  });
}

const DEFAULT_PROJECT: ProjectBrief = {
  name: 'Personal Expense Tracker',
  description: 'Ứng dụng quản lý chi tiêu cá nhân có biểu đồ tròn, biểu đồ cột, thanh ngân sách cảnh báo và bộ lọc.',
  budget: '$1,200 · 1 Sprint',
};

const MILESTONES = [
  'Khung giao diện & API cốt lõi',
  'Biểu đồ trực quan & Xử lý dữ liệu',
  'Bộ lọc, Responsive & Hoàn thiện',
];

function buildBriefingSteps(project: ProjectBrief): Array<{ speakerIdx: number; text: string }> {
  return [
    { speakerIdx: 0, text: `👑 Giám đốc (Bạn) trình bày dự án "${project.name}": "${project.description}"` },
    { speakerIdx: 1, text: '🤝 Trợ lý xác nhận đã hiểu mục tiêu & ngân sách — sẵn sàng ghi biên bản PRD.md.' },
    { speakerIdx: 2, text: '🎨 Design xác nhận đã hiểu trải nghiệm người dùng cần thiết kế.' },
    { speakerIdx: 3, text: '💻 Frontend & ⚙️ Backend xác nhận đã hiểu yêu cầu kỹ thuật để code song song.' },
    { speakerIdx: 5, text: '🔍 Review Lab xác nhận tiêu chí đánh giá chất lượng & kiểm tra Chromium.' },
    { speakerIdx: 6, text: '🧪 QA & 🚀 DevOps xác nhận tiêu chí 20/20 unit tests & quy trình phát hành PR!' },
  ];
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CompanyScene | null>(null);
  const logSeqRef = useRef(1);

  const [project, setProject] = useState<ProjectBrief>(DEFAULT_PROJECT);
  const [modalOpen, setModalOpen] = useState(false);
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [companyMemory, setCompanyMemory] = useState<MemoryDecision[]>([]);
  const [stageReports, setStageReports] = useState<StageDeliveryReport[]>([]);
  const [activeReport, setActiveReport] = useState<StageDeliveryReport | null>(null);
  const kickoffQuestions = useMemo(() => buildKickoffQuestions(project.name), [project.name]);

  const [running, setRunning] = useState(true);
  const [gateKind, setGateKind] = useState<GateKind>(null);
  const [finished, setFinished] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Stage 1 starts immediately in the Grand Meeting Room so ALL employees understand the project FIRST!
  const [currentStage, setCurrentStage] = useState<ProjectStageId>('discovery');
  const [milestone, setMilestone] = useState(1); // 1..3 iterative code-sync-test-review loops
  const [meetingPhase, setMeetingPhase] = useState<'idle' | 'gathering' | 'discussing' | 'done'>('gathering');
  const [meetingProgress, setMeetingProgress] = useState(0);
  const [meetingSpeakerIdx, setMeetingSpeakerIdx] = useState(0);
  const [understoodCount, setUnderstoodCount] = useState(1);

  const [progress, setProgress] = useState<number[]>(() => DEPARTMENTS.map(() => 0));
  const [statuses, setStatuses] = useState<RoomStatus[]>(() => DEPARTMENTS.map(() => 'idle'));
  const [agents, setAgents] = useState<AgentRuntime[]>(() => createInitialAgentsForMeeting());
  const [artifacts, setArtifacts] = useState<DeliverableArtifact[]>(() => createInitialArtifacts(DEFAULT_PROJECT));
  const [reworks, setReworks] = useState(0);
  const [tools, setTools] = useState(0);
  const [injectBug, setInjectBug] = useState(false);
  const [labels, setLabels] = useState<ProjectedRoomLabel[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 0,
      time: nowTime(),
      message: `🏛️ GĐ 1 (Họp & Hiểu dự án): Giám đốc triệu tập cả 8 nhân viên vào Phòng Họp Lớn để nghe phổ biến dự án "${DEFAULT_PROJECT.name}" trước tiên!`,
      tone: 'info',
    },
  ]);

  const agentsRef = useRef(agents);
  agentsRef.current = agents;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;
  const injectBugRef = useRef(injectBug);
  injectBugRef.current = injectBug;
  const meetingPhaseRef = useRef(meetingPhase);
  meetingPhaseRef.current = meetingPhase;
  const meetingProgressRef = useRef(meetingProgress);
  meetingProgressRef.current = meetingProgress;
  const projectRef = useRef(project);
  projectRef.current = project;
  const milestoneRef = useRef(milestone);
  milestoneRef.current = milestone;
  const syncedMilestoneRef = useRef<number>(0);
  const companyMemoryRef = useRef(companyMemory);
  companyMemoryRef.current = companyMemory;
  const reworksRef = useRef(reworks);
  reworksRef.current = reworks;
  const pendingFeedbackByDeptRef = useRef<Record<number, string>>({});

  const pushLog = useCallback((message: string, tone: LogEntry['tone'] = 'info') => {
    const id = logSeqRef.current++;
    setLogs((prev) => [{ id, time: nowTime(), message, tone }, ...prev].slice(0, 40));
  }, []);

  const markArtifactReady = useCallback((id: string) => {
    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, ready: true } : a)));
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const companyScene = new CompanyScene(
      mountRef.current,
      DEPARTMENTS,
      {
        statuses,
        selectedIdx,
        agents,
        autoOrbit,
        meetingActive: meetingPhase === 'gathering' || meetingPhase === 'discussing',
        meetingSpeakerIdx,
      },
      (idx) => setSelectedIdx(idx),
      (projected) => setLabels(projected)
    );
    sceneRef.current = companyScene;
    return () => {
      companyScene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.updateSnapshot({
      statuses,
      selectedIdx,
      agents,
      autoOrbit,
      meetingActive: meetingPhase === 'gathering' || meetingPhase === 'discussing',
      meetingSpeakerIdx,
    });
  }, [statuses, selectedIdx, agents, autoOrbit, meetingPhase, meetingSpeakerIdx]);

  const recallAgentToDesk = (list: AgentRuntime[], idx: number, startWorking: boolean) => {
    const ag = list[idx];
    const [dx, dz] = deskSeat(idx);
    if (Math.hypot(ag.x - dx, ag.z - dz) < 0.25) {
      ag.x = dx;
      ag.z = dz;
      ag.rotY = deskFacing(idx);
      ag.activity = startWorking ? 'working' : 'idle';
      ag.path = [];
      ag.onArrive = undefined;
      return;
    }
    const fromDoor = isInsideOwnRoom(ag, idx) ? DEPARTMENTS[idx].doorPos : undefined;
    ag.activity = 'walking_desk';
    ag.carryingTask = false;
    ag.carryingRework = false;
    ag.path = buildOfficePath(ag.x, ag.z, dx, dz, fromDoor, DEPARTMENTS[idx].doorPos);
    ag.onArrive = { type: 'desk', startWorking };
  };

  const sendAgentToLounge = (list: AgentRuntime[], idx: number) => {
    if (idx === 0) {
      recallAgentToDesk(list, 0, false);
      return;
    }
    const cur = list[idx];
    const [lx, lz] = cur.loungeSpot;
    const fromDoor = isInsideOwnRoom(cur, idx) ? DEPARTMENTS[idx].doorPos : undefined;
    cur.activity = 'walking_lounge';
    cur.carryingTask = false;
    cur.carryingRework = false;
    cur.path = buildOfficePath(cur.x, cur.z, lx, lz, fromDoor, undefined);
    cur.onArrive = { type: 'lounge' };
  };

  const sendAgentDeliver = (
    list: AgentRuntime[],
    fromIdx: number,
    toIdx: number,
    isRework: boolean,
    extra?: { parallelToIdx?: number; triggerGate?: GateKind; submitDeptIdx?: number }
  ) => {
    const ag = list[fromIdx];
    const [tx, tz] = deskSeat(toIdx);
    const fromDoor = isInsideOwnRoom(ag, fromIdx) ? DEPARTMENTS[fromIdx].doorPos : undefined;
    const toDoor = DEPARTMENTS[toIdx].doorPos;
    ag.activity = 'walking_deliver';
    ag.carryingTask = true;
    ag.carryingRework = isRework;
    ag.path = buildOfficePath(ag.x, ag.z, tx, tz, fromDoor, toDoor);
    ag.onArrive = {
      type: 'handoff',
      toIdx,
      isRework,
      parallelToIdx: extra?.parallelToIdx,
      triggerGate: extra?.triggerGate,
      submitDeptIdx: extra?.submitDeptIdx,
    };
  };

  const startProjectRun = useCallback((brief: ProjectBrief) => {
    setProject(brief);
    setRunning(true);
    setGateKind(null);
    setQaModalOpen(false);
    setCompanyMemory([]);
    setStageReports([]);
    setActiveReport(null);
    pendingFeedbackByDeptRef.current = {};
    setFinished(false);
    setSelectedIdx(0);
    setCurrentStage('discovery');
    setMilestone(1);
    syncedMilestoneRef.current = 0;
    setMeetingPhase('gathering');
    setMeetingProgress(0);
    setMeetingSpeakerIdx(0);
    setUnderstoodCount(1);
    setProgress(DEPARTMENTS.map(() => 0));
    setStatuses(DEPARTMENTS.map(() => 'idle'));
    setAgents(createInitialAgentsForMeeting());
    setArtifacts(createInitialArtifacts(brief));
    setReworks(0);
    setTools(0);
    setInjectBug(false);
    setLogs([
      {
        id: logSeqRef.current++,
        time: nowTime(),
        message: `🏛️ GĐ 1 (Họp & Hiểu dự án): Giám đốc triệu tập cả 8 nhân viên vào Phòng Họp Lớn phổ biến dự án "${brief.name}" trước tiên!`,
        tone: 'info',
      },
    ]);
  }, []);

  const triggerRework = useCallback(
    (fromIdx: number, reason: string) => {
      setReworks((r) => r + 1);
      setGateKind(null);
      setCurrentStage('implementation');
      setRunning(true);

      const nextStatuses = [...statusesRef.current];
      const nextProgress = [...progressRef.current];
      for (let i = 3; i <= 6; i++) {
        nextProgress[i] = 0;
        nextStatuses[i] = i === fromIdx ? 'error' : 'idle';
      }
      nextStatuses[4] = 'running';
      setStatuses(nextStatuses);
      setProgress(nextProgress);

      const nextAgents = agentsRef.current.map((a) => ({ ...a, path: [...a.path] }));
      recallAgentToDesk(nextAgents, 3, false);
      recallAgentToDesk(nextAgents, 4, true);

      const messengerIdx = fromIdx === 0 ? 1 : fromIdx;
      sendAgentDeliver(nextAgents, messengerIdx, 3, true);
      setAgents(nextAgents);

      pushLog(`↩ ${DEPARTMENTS[fromIdx].short} gửi lệnh Rework về GĐ 3 (💻 FE & ⚙️ BE): ${reason}`, 'error');
    },
    [pushLog]
  );

  // Main 40ms simulation tick
  useEffect(() => {
    if (!running) return;
    const dt = 0.04;
    const walkSpeed = 5.4;

    const timer = window.setInterval(() => {
      const nextAgents = agentsRef.current.map((a) => ({ ...a, path: [...a.path] }));
      const nextProgress = [...progressRef.current];
      const nextStatuses = [...statusesRef.current];
      let dirtyAgents = false;
      let dirtyProgress = false;
      let dirtyStatuses = false;

      // 1. Move walking agents
      for (let i = 0; i < nextAgents.length; i++) {
        const ag = nextAgents[i];
        if (ag.path.length > 0) {
          dirtyAgents = true;
          const [tx, tz] = ag.path[0];
          const dx = tx - ag.x;
          const dz = tz - ag.z;
          const dist = Math.hypot(dx, dz);
          const step = walkSpeed * dt;

          if (dist <= step) {
            ag.x = tx;
            ag.z = tz;
            ag.path.shift();
          } else {
            ag.x += (dx / dist) * step;
            ag.z += (dz / dist) * step;
            ag.rotY = Math.atan2(dx, dz);
          }

          if (ag.path.length === 0 && ag.onArrive) {
            const ev = ag.onArrive;
            ag.onArrive = undefined;

            if (ev.type === 'meeting') {
              ag.activity = 'meeting';
              ag.rotY = Math.atan2(MEETING_CENTER[0] - ag.x, MEETING_CENTER[1] - ag.z);
            } else if (ev.type === 'lounge') {
              ag.activity = 'chilling';
              ag.rotY = Math.atan2(LOUNGE_CENTER[0] + 0.45 - ag.x, LOUNGE_CENTER[1] - ag.z);
              pushLog(`☕ ${DEPARTMENTS[i].short} đã ra Khu Thư giãn uống cà phê nghỉ ngơi.`, 'info');
            } else if (ev.type === 'desk') {
              ag.rotY = deskFacing(i);
              ag.activity = ev.startWorking ? 'working' : 'idle';
            } else if (ev.type === 'sync') {
              // FE <-> BE finished live API sync -> walk back to own desk and resume coding!
              pushLog(
                `🔄 ${DEPARTMENTS[i].short} ↔ ${DEPARTMENTS[ev.partnerIdx].short} đã đồng bộ API Contract xong (Vòng ${milestoneRef.current}/${MILESTONES.length}) — quay về bàn code tiếp!`,
                'info'
              );
              recallAgentToDesk(nextAgents, i, true);
            } else if (ev.type === 'retro_report') {
              markArtifactReady('kpi');
              sendAgentToLounge(nextAgents, i);
              setFinished(true);
              pushLog(
                `📊 GĐ 7 (Tổng kết): 🤝 Trợ lý đã trình EOD-KPI.md cho 👑 Giám đốc. Dự án "${projectRef.current.name}" hoàn tất 100%!`,
                'success'
              );
            } else if (ev.type === 'handoff') {
              const target = ev.toIdx;
              setSelectedIdx(target);

              if (ev.triggerGate === 'dept_report' && ev.submitDeptIdx !== undefined) {
                // Department arrived at CEO office to submit its report -> pause & wait for CEO OK!
                sendAgentToLounge(nextAgents, i);
                nextStatuses[0] = 'waiting';
                nextProgress[0] = 50;
                dirtyStatuses = true;
                dirtyProgress = true;
                if (ev.submitDeptIdx === 6 && milestoneRef.current >= MILESTONES.length) {
                  setCurrentStage('uat');
                }
                setGateKind('dept_report');
                setRunning(false);
                const prevFb = pendingFeedbackByDeptRef.current[ev.submitDeptIdx];
                if (prevFb) delete pendingFeedbackByDeptRef.current[ev.submitDeptIdx];
                const rep = buildDepartmentReport(
                  ev.submitDeptIdx,
                  projectRef.current,
                  milestoneRef.current,
                  companyMemoryRef.current,
                  reworksRef.current,
                  prevFb
                );
                setStageReports((prev) => [rep, ...prev]);
                setActiveReport(rep);
                pushLog(
                  `📋 ${rep.deptLabel} đã nộp báo cáo "${rep.fileName}" vào Hộp thư góc trên phải — chờ 👑 Giám đốc xem & bấm OK!`,
                  'warn'
                );
              } else {
                recallAgentToDesk(nextAgents, target, true);
                nextStatuses[target] = 'running';
                nextProgress[target] = 0;
                dirtyStatuses = true;
                dirtyProgress = true;

                if (ev.parallelToIdx !== undefined) {
                  recallAgentToDesk(nextAgents, ev.parallelToIdx, true);
                  nextStatuses[ev.parallelToIdx] = 'running';
                  nextProgress[ev.parallelToIdx] = 0;
                  setCurrentStage('implementation');
                  pushLog(
                    '⚡ GĐ 3 (Code Song Song): 🎨 Design bàn giao design.md → 💻 Frontend và ⚙️ Backend cùng triển khai song song!',
                    'info'
                  );
                } else {
                  pushLog(
                    ev.isRework
                      ? `🔧 ${DEPARTMENTS[target].short} đã nhận gói Rework và quay lại bàn sửa lỗi!`
                      : `📦 ${DEPARTMENTS[i].short} đã giao task tận tay cho ${DEPARTMENTS[target].short}.`,
                    ev.isRework ? 'warn' : 'info'
                  );
                }
                sendAgentToLounge(nextAgents, i);
              }
            }
          }
        }
      }

      // 2. Stage 1 FIRST: All-hands Kickoff Meeting until ALL 8 employees understand the project!
      if (meetingPhaseRef.current === 'gathering') {
        const allSeated = nextAgents.every((a) => a.activity === 'meeting');
        if (allSeated) {
          setMeetingPhase('discussing');
          setMeetingProgress(0);
          setMeetingSpeakerIdx(0);
          setUnderstoodCount(1);
          const steps = buildBriefingSteps(projectRef.current);
          pushLog(steps[0].text, 'info');
        }
      } else if (meetingPhaseRef.current === 'discussing') {
        const steps = buildBriefingSteps(projectRef.current);
        const prevM = meetingProgressRef.current;
        const nextM = Math.min(100, prevM + 16 * dt);
        setMeetingProgress(nextM);
        setUnderstoodCount(Math.min(8, 1 + Math.floor((nextM / 100) * 7)));

        const prevStep = Math.floor((prevM / 100) * steps.length);
        const curStep = Math.floor((nextM / 100) * steps.length);
        if (curStep > prevStep && curStep < steps.length) {
          setMeetingSpeakerIdx(steps[curStep].speakerIdx);
          pushLog(steps[curStep].text, 'info');
        }

        if (nextM >= 100 && prevM < 100) {
          setUnderstoodCount(8);
          setGateKind('prd');
          setQaModalOpen(true);
          setRunning(false);
          pushLog(
            '🏛️ Cả 8/8 nhân viên đã hiểu dự án và đặt 18 câu hỏi (kèm đề xuất tối ưu của 🤝 Trợ lý). Mời 👑 Giám đốc chốt quyết định & lưu vào Bộ nhớ chung!',
            'warn'
          );
        }
      }

      // 3. Department Working Progress (Stages 2..7)
      if (meetingPhaseRef.current === 'done') {
        for (let idx = 0; idx < DEPARTMENTS.length; idx++) {
          if (nextStatuses[idx] !== 'running') continue;
          if (nextAgents[idx].activity !== 'working') continue;

          dirtyProgress = true;
          const speed = idx === 1 ? 42 : idx === 3 ? 28 : idx === 4 ? 25 : 35;
          const prev = nextProgress[idx];
          const next = Math.min(100, prev + speed * dt);
          nextProgress[idx] = next;

          if (Math.floor(next / 25) > Math.floor(prev / 25) && idx !== 0 && idx !== 6) {
            setTools((t) => t + 2 + Math.floor(Math.random() * 4));
          }

          if (idx === 6 && injectBugRef.current && next >= 65) {
            setInjectBug(false);
            setTimeout(() => {
              triggerRework(6, 'Vitest phát hiện 1 unit test fail → QA chạy sang gọi 💻 FE & ⚙️ BE sửa!');
            }, 0);
            break;
          }

          if (idx === 3 && syncedMilestoneRef.current !== milestoneRef.current && next >= 45 && prev < 45) {
            // Mid-milestone live FE <-> BE interaction! Walk across to sync API contract!
            syncedMilestoneRef.current = milestoneRef.current;
            const sender = milestoneRef.current % 2 === 1 ? 3 : 4;
            const partner = sender === 3 ? 4 : 3;
            const agSync = nextAgents[sender];
            const [px, pz] = deskSeat(partner);
            agSync.activity = 'walking_deliver';
            agSync.carryingTask = true;
            agSync.carryingRework = false;
            agSync.path = buildOfficePath(agSync.x, agSync.z, px, pz, DEPARTMENTS[sender].doorPos, DEPARTMENTS[partner].doorPos);
            agSync.onArrive = { type: 'sync', partnerIdx: partner };
            dirtyAgents = true;
            pushLog(
              `🤝 Vòng ${milestoneRef.current}/${MILESTONES.length}: ${DEPARTMENTS[sender].short} đang đi bộ sang ${DEPARTMENTS[partner].short} trao đổi & khớp API trực tiếp!`,
              'info'
            );
          }

          if (next >= 100 && prev < 100) {
            nextStatuses[idx] = 'done';
            dirtyStatuses = true;
            dirtyAgents = true;

            if (idx === 1) {
              // Assistant finished PRD.md -> MUST submit report to CEO first!
              markArtifactReady('prd');
              pushLog('✓ 🤝 Trợ lý hoàn thành PRD.md — đang mang báo cáo lên 👑 Giám đốc duyệt trước khi giao Design!', 'success');
              sendAgentDeliver(nextAgents, 1, 0, false, { triggerGate: 'dept_report', submitDeptIdx: 1 });
            } else if (idx === 2) {
              // Design finished design.md -> MUST submit report to CEO first!
              markArtifactReady('design');
              pushLog('✓ 🎨 Design hoàn thành design.md — đang mang báo cáo lên 👑 Giám đốc duyệt trước khi mở Vòng 1!', 'success');
              sendAgentDeliver(nextAgents, 2, 0, false, { triggerGate: 'dept_report', submitDeptIdx: 2 });
            } else if (idx === 3 || idx === 4) {
              const otherIdx = idx === 3 ? 4 : 3;
              const otherDone = nextStatuses[otherIdx] === 'done';
              if (milestoneRef.current >= MILESTONES.length) {
                markArtifactReady(idx === 3 ? 'fe' : 'be');
              }
              if (otherDone) {
                // FE & BE finished current milestone -> MUST submit code report to CEO first!
                pushLog(
                  `✓ 💻 FE & ⚙️ BE xong Vòng ${milestoneRef.current}/${MILESTONES.length} — đang mang báo cáo lên 👑 Giám đốc kiểm tra!`,
                  'success'
                );
                sendAgentDeliver(nextAgents, idx, 0, false, { triggerGate: 'dept_report', submitDeptIdx: idx });
              } else {
                pushLog(
                  `✓ ${DEPARTMENTS[idx].short} xong Vòng ${milestoneRef.current} — đợi ${DEPARTMENTS[otherIdx].short} hoàn tất.`,
                  'info'
                );
              }
            } else if (idx === 5) {
              // Review Lab finished -> MUST submit review.md report to CEO first!
              markArtifactReady('review');
              pushLog('✓ 🔍 Review Lab hoàn thành review.md — đang mang báo cáo lên 👑 Giám đốc duyệt!', 'success');
              sendAgentDeliver(nextAgents, 5, 0, false, { triggerGate: 'dept_report', submitDeptIdx: 5 });
            } else if (idx === 6) {
              // QA finished -> MUST submit test report to CEO!
              if (milestoneRef.current >= MILESTONES.length) markArtifactReady('qa');
              pushLog(
                `✓ 🧪 QA hoàn thành kiểm thử Vòng ${milestoneRef.current}/${MILESTONES.length} — đang mang báo cáo lên 👑 Giám đốc duyệt!`,
                'success'
              );
              sendAgentDeliver(nextAgents, 6, 0, false, { triggerGate: 'dept_report', submitDeptIdx: 6 });
            } else if (idx === 7) {
              // DevOps finished -> submit Release report to CEO + celebration!
              markArtifactReady('release');
              sceneRef.current?.spawnCelebration(7);
              pushLog('🎉 🚀 DevOps đã mở Pull Request v1.0.0 — đang mang báo cáo phát hành lên 👑 Giám đốc nghiệm thu!', 'success');
              sendAgentDeliver(nextAgents, 7, 0, false, { triggerGate: 'dept_report', submitDeptIdx: 7 });
            }
          }
        }
      }

      if (dirtyAgents) setAgents(nextAgents);
      if (dirtyProgress) setProgress(nextProgress);
      if (dirtyStatuses) setStatuses(nextStatuses);
    }, 40);

    return () => window.clearInterval(timer);
  }, [running, pushLog, triggerRework, markArtifactReady]);

  const handleTogglePlay = () => {
    if (finished) {
      startProjectRun(project);
      return;
    }
    if (gateKind) {
      pushLog('Đang chờ Giám đốc bấm xác nhận ở thanh thông báo phía trên.', 'warn');
      return;
    }
    setRunning((r) => !r);
  };

  const handleSimulateBug = () => {
    setInjectBug(true);
    pushLog('⚡ Đã bật giả lập lỗi Test tại 🧪 Phòng QA để xem vòng lặp Rework!', 'warn');
  };

  const finalizeKickoffWithDecisions = (decisions: MemoryDecision[]) => {
    setCompanyMemory(decisions);
    setQaModalOpen(false);
    setGateKind(null);
    setMeetingPhase('done');
    setCurrentStage('kickoff_design');
    setProgress((p) => p.map((v, i) => (i === 0 ? 100 : 0)));
    setStatuses((s) => s.map((v, i) => (i === 0 ? 'done' : i === 1 ? 'running' : 'idle')));

    const nextAgents = agentsRef.current.map((a) => ({ ...a, path: [...a.path] }));
    for (let k = 0; k < nextAgents.length; k++) {
      recallAgentToDesk(nextAgents, k, k === 1);
    }
    setAgents(nextAgents);
    setSelectedIdx(1);
    setRunning(true);
    pushLog(
      `🧠 Đã lưu ${decisions.length} quyết định của 👑 Giám đốc vào Bộ nhớ chung Công ty! Cả team về phòng triển khai theo đúng bộ nhớ (GĐ 2: PRD & Design).`,
      'success'
    );
  };

  const handleApproveGate = (ceoFeedback = '') => {
    if (!gateKind) return;
    const kind = gateKind;

    if (kind === 'prd') {
      const defaultDecisions: MemoryDecision[] = kickoffQuestions.map((q) => {
        const rec = q.options.find((o) => o.isRecommended) ?? q.options[0];
        return {
          questionId: q.id,
          deptLabel: q.deptLabel,
          refs: q.refs,
          chosenLabel: rec.label,
        };
      });
      finalizeKickoffWithDecisions(defaultDecisions);
    } else if (kind === 'dept_report') {
      const pending = stageReports.find((r) => r.status === 'pending');
      setGateKind(null);
      setActiveReport(null);
      if (pending) {
        setStageReports((prev) =>
          prev.map((r) =>
            r.id === pending.id ? { ...r, status: 'approved', ceoFeedback: ceoFeedback || r.ceoFeedback } : r
          )
        );
        if (ceoFeedback) {
          setCompanyMemory((prev) => [
            {
              questionId: `fb-${Date.now()}`,
              deptLabel: pending.deptLabel,
              refs: ['👑 Giám đốc'],
              chosenLabel: `Ghi chú duyệt "${pending.fileName}"`,
              ceoNote: ceoFeedback,
            },
            ...prev,
          ]);
        }
      }
      const dIdx = pending?.deptIdx ?? 1;
      const nextAgents = agentsRef.current.map((a) => ({ ...a, path: [...a.path] }));
      setProgress((p) => p.map((v, i) => (i === 0 ? 100 : v)));
      setStatuses((s) => s.map((v, i) => (i === 0 ? 'done' : v)));

      if (dIdx === 1) {
        // CEO approved Assistant's PRD.md -> Assistant delivers to Design (2)
        sendAgentDeliver(nextAgents, 1, 2, false);
        pushLog('✓ Giám đốc duyệt PRD.md! 🤝 Trợ lý đang mang sang 🎨 Phòng Design.', 'success');
      } else if (dIdx === 2) {
        // CEO approved Design's design.md -> Design delivers to FE (3) & BE (4) in parallel!
        setCurrentStage('implementation');
        sendAgentDeliver(nextAgents, 2, 3, false, { parallelToIdx: 4 });
        pushLog(`✓ Giám đốc duyệt design.md! Khởi động Vòng 1/${MILESTONES.length} cho 💻 FE & ⚙️ BE song song.`, 'success');
      } else if (dIdx === 3 || dIdx === 4) {
        // CEO approved FE & BE milestone code -> send to QA (if milestone < 3) or Review Lab (if milestone === 3)
        if (milestone < MILESTONES.length) {
          sendAgentDeliver(nextAgents, dIdx, 6, false);
          pushLog(`✓ Giám đốc duyệt code Vòng ${milestone}! Chuyển ngay sang 🧪 QA chạy test tự động.`, 'success');
        } else {
          setCurrentStage('review_qa');
          sendAgentDeliver(nextAgents, dIdx, 5, false);
          pushLog('✓ Giám đốc duyệt code Vòng cuối! Chuyển sang 🔍 Review Lab kiểm định độc lập.', 'success');
        }
      } else if (dIdx === 5) {
        // CEO approved Review Lab -> send to QA (6)
        sendAgentDeliver(nextAgents, 5, 6, false);
        pushLog('✓ Giám đốc duyệt review.md! Chuyển sang 🧪 QA chạy bộ test tổng thể 20/20.', 'success');
      } else if (dIdx === 6) {
        if (milestone < MILESTONES.length) {
          // CEO approved Milestone QA -> launch next Milestone!
          const nextM = milestone + 1;
          setMilestone(nextM);
          setCurrentStage('implementation');
          setProgress((p) => p.map((v, i) => (i === 0 ? 100 : i === 3 || i === 4 || i === 6 ? 0 : v)));
          setStatuses((s) =>
            s.map((v, i) => (i === 0 ? 'done' : i === 3 || i === 4 ? 'running' : i === 6 ? 'idle' : v))
          );
          recallAgentToDesk(nextAgents, 3, true);
          recallAgentToDesk(nextAgents, 4, true);
          setSelectedIdx(3);
          pushLog(`✓ Giám đốc duyệt QA Vòng ${milestone}! Chuyển sang Vòng ${nextM}/${MILESTONES.length}: "${MILESTONES[nextM - 1]}".`, 'success');
        } else {
          // CEO approved Final UAT -> Assistant delivers Release command to DevOps (7)
          setCurrentStage('release');
          sendAgentDeliver(nextAgents, 1, 7, false);
          pushLog('✓ Giám đốc duyệt UAT cuối cùng! 🤝 Trợ lý mang lệnh phát hành sang 🚀 DevOps PR.', 'success');
        }
      } else if (dIdx === 7) {
        // CEO approved Release v1.0.0 -> Stage 7 Retro KPI & celebration!
        setCurrentStage('retro');
        const asst = nextAgents[1];
        const [cx, cz] = deskSeat(0);
        asst.activity = 'walking_deliver';
        asst.carryingTask = true;
        asst.carryingRework = false;
        asst.path = buildOfficePath(asst.x, asst.z, cx, cz, undefined, DEPARTMENTS[0].doorPos);
        asst.onArrive = { type: 'retro_report' };
        pushLog('✓ Giám đốc duyệt Release v1.0.0! 🤝 Trợ lý đang trình báo cáo tổng kết EOD-KPI.md.', 'success');
      }
      setAgents(nextAgents);
      setRunning(true);
    }
  };

  const handleRejectGate = (ceoFeedback = '') => {
    if (!gateKind) return;
    if (gateKind === 'prd') {
      setGateKind(null);
      setMeetingProgress(0);
      setUnderstoodCount(1);
      setMeetingSpeakerIdx(0);
      setRunning(true);
      pushLog('↩ Giám đốc yêu cầu giải thích kỹ lại trong Phòng Họp Lớn để cả team nắm chắc hơn!', 'warn');
    } else {
      const pending = stageReports.find((r) => r.status === 'pending');
      setGateKind(null);
      setActiveReport(null);
      const fbText = ceoFeedback || 'Cần rà soát kỹ hơn và bổ sung chi tiết theo yêu cầu Giám đốc.';
      if (pending) {
        setStageReports((prev) =>
          prev.map((r) => (r.id === pending.id ? { ...r, status: 'rejected', ceoFeedback: fbText } : r))
        );
      }
      const dIdx = pending?.deptIdx ?? 3;
      pendingFeedbackByDeptRef.current[dIdx] = fbText;
      if (dIdx === 3 || dIdx === 4) {
        pendingFeedbackByDeptRef.current[3] = fbText;
        pendingFeedbackByDeptRef.current[4] = fbText;
      }
      if (dIdx === 1 || dIdx === 2 || dIdx === 5 || dIdx === 7) {
        setReworks((r) => r + 1);
        setProgress((p) => p.map((v, i) => (i === dIdx ? 0 : i === 0 ? 100 : v)));
        setStatuses((s) => s.map((v, i) => (i === dIdx ? 'running' : i === 0 ? 'done' : v)));
        const nextAgents = agentsRef.current.map((a) => ({ ...a, path: [...a.path] }));
        recallAgentToDesk(nextAgents, dIdx, true);
        setAgents(nextAgents);
        setRunning(true);
        pushLog(
          `↩ Giám đốc trả về ${DEPARTMENTS[dIdx].short} sửa "${pending?.fileName}" với góp ý: "${fbText}"`,
          'error'
        );
      } else {
        triggerRework(0, `Giám đốc góp ý Vòng ${milestone}/${MILESTONES.length}: "${fbText}"`);
      }
    }
  };

  const handleSelectDept = (idx: number) => {
    setSelectedIdx(idx);
    sceneRef.current?.focusRoom(idx);
  };

  const chillingCount = agents.filter((a) => a.activity === 'chilling').length;
  const inMeetingCount = agents.filter((a) => a.activity === 'meeting').length;

  return (
    <div className="app-shell">
      <TopBar
        running={running}
        pausedAtGate={Boolean(gateKind)}
        finished={finished}
        autoOrbit={autoOrbit}
        onOpenNewProject={() => setModalOpen(true)}
        onTogglePlay={handleTogglePlay}
        onSimulateBug={handleSimulateBug}
        onReset={() => startProjectRun(project)}
        onToggleOrbit={() => setAutoOrbit((v) => !v)}
      />

      <StageBar
        project={project}
        currentStage={currentStage}
        milestone={milestone}
        totalMilestones={MILESTONES.length}
        completed={finished}
      />

      <div className="workspace">
        <div className="viewport-wrap">
          <HumanGateBanner
            gateKind={gateKind}
            project={project}
            pendingReport={stageReports.find((r) => r.status === 'pending') ?? null}
            onOpenQA={() => setQaModalOpen(true)}
            onOpenReport={() => {
              const p = stageReports.find((r) => r.status === 'pending') ?? stageReports[0];
              if (p) setActiveReport(p);
            }}
            onApprove={() => handleApproveGate()}
            onReject={() => handleRejectGate()}
          />

          {/* Top-Right Department Reports Inbox (Log-style List) */}
          <ReportInboxOverlay
            reports={stageReports}
            onSelectReport={(rep) => setActiveReport(rep)}
          />

          <div ref={mountRef} className="three-mount" />

          <div className="label-layer">
            {labels.map((lbl) => {
              if (!lbl.visible) return null;

              if (lbl.isMeeting) {
                const mpct = Math.round(meetingProgress);
                return (
                  <div
                    key="meeting"
                    className="room-badge"
                    style={{
                      left: `${lbl.x}px`,
                      top: `${lbl.y}px`,
                      width: 192,
                      borderColor:
                        meetingPhase === 'gathering' || meetingPhase === 'discussing'
                          ? '#60a5fa'
                          : 'rgba(148,163,184,0.3)',
                    }}
                    onClick={() => sceneRef.current?.focusMeeting()}
                  >
                    <div className="room-badge-top">
                      <span>🏛️ Phòng Họp Lớn</span>
                      <span className="room-badge-pct" style={{ color: '#60a5fa' }}>
                        {meetingPhase === 'discussing'
                          ? `Hiểu ${understoodCount}/8`
                          : meetingPhase === 'gathering'
                            ? `Vào ${inMeetingCount}/8`
                            : 'Đã hiểu 8/8'}
                      </span>
                    </div>
                    <div className="room-badge-bar">
                      <div className="room-badge-fill" style={{ width: `${mpct}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                );
              }

              if (lbl.isLounge) {
                return (
                  <div
                    key="lounge"
                    className="room-badge"
                    style={{
                      left: `${lbl.x}px`,
                      top: `${lbl.y}px`,
                      width: 152,
                      borderColor: 'rgba(251, 191, 36, 0.55)',
                    }}
                    onClick={() => sceneRef.current?.focusLounge()}
                  >
                    <div className="room-badge-top">
                      <span>☕ Khu Thư giãn</span>
                      <span className="room-badge-pct" style={{ color: '#fbbf24' }}>
                        {chillingCount} chill
                      </span>
                    </div>
                  </div>
                );
              }

              const d = DEPARTMENTS[lbl.idx];
              const pct = Math.round(progress[lbl.idx] ?? 0);
              const st = statuses[lbl.idx];
              const col =
                st === 'error' ? '#ef4444' : st === 'done' ? '#22c55e' : st === 'waiting' ? '#f59e0b' : d.color;

              return (
                <div
                  key={d.id}
                  className={`room-badge ${selectedIdx === lbl.idx ? 'selected' : ''}`}
                  style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
                  onClick={() => handleSelectDept(lbl.idx)}
                >
                  <div className="room-badge-top">
                    <span>{d.short}</span>
                    <span className="room-badge-pct" style={{ color: col }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="room-badge-bar">
                    <div className="room-badge-fill" style={{ width: `${pct}%`, background: col }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hud-bottom">
            <div className="hud-pill">GĐ 1: Họp hiểu dự án (8/8) → GĐ 2: PRD &amp; Design → GĐ 3: FE/BE song song → Review/QA → CEO duyệt</div>
            <div className="hud-pill">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#60a5fa' }} />
                Đang họp ({inMeetingCount})
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#fbbf24' }} />
                Thư giãn ({chillingCount})
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }} />
                Rework
              </span>
            </div>
          </div>
        </div>

        <InspectorPanel
          departments={DEPARTMENTS}
          selectedIdx={selectedIdx}
          progress={progress}
          statuses={statuses}
          reworks={reworks}
          tools={tools}
          artifacts={artifacts}
          companyMemory={companyMemory}
          stageReports={stageReports}
          logs={logs}
          onSelectDept={handleSelectDept}
          onOpenStageReport={(rep) => setActiveReport(rep)}
        />
      </div>

      <StageReportModal
        report={activeReport}
        canDecide={Boolean(activeReport && activeReport.status === 'pending' && gateKind === 'dept_report')}
        approveLabel="✓ OK → Chuyển bước tiếp theo"
        rejectLabel="↩ Gửi góp ý & Trả về sửa lại"
        onClose={() => setActiveReport(null)}
        onApprove={(fb) => handleApproveGate(fb)}
        onReject={(fb) => {
          setActiveReport(null);
          handleRejectGate(fb);
        }}
      />

      <KickoffQAModal
        key={project.name}
        open={qaModalOpen}
        project={project}
        questions={kickoffQuestions}
        onMinimize={() => setQaModalOpen(false)}
        onConfirmAll={finalizeKickoffWithDecisions}
      />

      <NewProjectModal
        open={modalOpen}
        current={project}
        onClose={() => setModalOpen(false)}
        onSubmit={startProjectRun}
      />
    </div>
  );
}
