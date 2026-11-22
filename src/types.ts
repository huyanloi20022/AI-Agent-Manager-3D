export type RoomStatus = 'idle' | 'running' | 'done' | 'waiting' | 'error';

export type RoomFacing = 'south' | 'north' | 'east' | 'west';

export type ProjectStageId =
  | 'discovery'
  | 'kickoff_design'
  | 'implementation'
  | 'review_qa'
  | 'uat'
  | 'release'
  | 'retro';

export type GateKind = 'prd' | 'dept_report' | null;

export interface ProjectBrief {
  name: string;
  description: string;
  budget: string;
}

export interface DeliverableArtifact {
  id: string;
  stage: ProjectStageId;
  fileName: string;
  owner: string;
  summary: string;
  ready: boolean;
}

export type AgentActivity =
  | 'idle'
  | 'working'
  | 'walking_deliver'
  | 'walking_lounge'
  | 'chilling'
  | 'walking_desk'
  | 'walking_meeting'
  | 'meeting';

export interface Department {
  id: string;
  short: string;
  title: string;
  role: string;
  kind: string;
  color: string;
  position: [number, number, number];
  facing: RoomFacing;
  doorPos: [number, number];
  input: string;
  output: string;
  desc: string;
  equipment: 'ceo' | 'assistant' | 'design' | 'frontend' | 'backend' | 'review' | 'qa' | 'release';
}

export interface AgentRuntime {
  deptIdx: number;
  activity: AgentActivity;
  x: number;
  z: number;
  rotY: number;
  path: Array<[number, number]>;
  carryingTask: boolean;
  carryingRework: boolean;
  onArrive?:
    | { type: 'handoff'; toIdx: number; isRework: boolean; parallelToIdx?: number; triggerGate?: GateKind; submitDeptIdx?: number }
    | { type: 'sync'; partnerIdx: number }
    | { type: 'lounge' }
    | { type: 'desk'; startWorking: boolean }
    | { type: 'meeting' }
    | { type: 'retro_report' };
  loungeSpot: [number, number];
  meetingSpot: [number, number];
}

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  tone: 'info' | 'success' | 'warn' | 'error';
}

export interface ProjectedRoomLabel {
  idx: number;
  x: number;
  y: number;
  visible: boolean;
  isLounge?: boolean;
  isMeeting?: boolean;
}
