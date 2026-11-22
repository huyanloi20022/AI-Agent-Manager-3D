import type { MemoryDecision } from './kickoffQuestions';
import type { ProjectBrief } from '../types';

export interface StageProcessStep {
  actor: string;
  action: string;
  detail: string;
}

export type ReportApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface StageDeliveryReport {
  id: string;
  deptIdx: number;
  deptLabel: string;
  fileName: string;
  submittedAt: string;
  status: ReportApprovalStatus;
  ceoFeedback?: string;
  stageLabel: string;
  title: string;
  problem: string;
  processSteps: StageProcessStep[];
  appliedMemory: string[];
  verification: string[];
  deliverables: string[];
  assistantAdvice: string;
}

function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour12: false });
}

export function buildDepartmentReport(
  deptIdx: number,
  project: ProjectBrief,
  milestone: number,
  memory: MemoryDecision[],
  reworks: number,
  previousFeedback?: string
): StageDeliveryReport {
  const report = createDepartmentReportCore(deptIdx, project, milestone, memory, reworks);
  if (previousFeedback && previousFeedback.trim()) {
    report.processSteps = [
      {
        actor: '👑 Xử lý góp ý Giám đốc (Bản sửa lại)',
        action: 'Đã tiếp thu & chỉnh sửa theo yêu cầu',
        detail: `Nội dung Giám đốc góp ý: "${previousFeedback.trim()}" — đã cập nhật đầy đủ vào bản nộp lại này.`,
      },
      ...report.processSteps,
    ];
    report.verification = [`✓ Đã khắc phục đúng góp ý Giám đốc: "${previousFeedback.trim()}"`, ...report.verification];
  }
  return report;
}

function createDepartmentReportCore(
  deptIdx: number,
  project: ProjectBrief,
  milestone: number,
  memory: MemoryDecision[],
  reworks: number
): StageDeliveryReport {
  const pickMem = (prefix: string) =>
    memory
      .filter((m) => m.deptLabel.includes(prefix))
      .slice(0, 3)
      .map((m) => `${m.deptLabel}: ${m.chosenLabel}${m.ceoNote ? ` (Ghi chú CEO: ${m.ceoNote})` : ''}`);

  const base = {
    id: `rep-${deptIdx}-${Date.now()}`,
    deptIdx,
    submittedAt: nowTime(),
    status: 'pending' as ReportApprovalStatus,
  };

  if (deptIdx === 1) {
    return {
      ...base,
      deptLabel: '🤝 Trợ lý (Bot)',
      fileName: 'PRD.md',
      stageLabel: 'GĐ 2 · Báo cáo PRD.md (Trợ lý)',
      title: `🤝 Trợ lý nộp PRD.md — "${project.name}"`,
      problem: `Tổng hợp toàn bộ yêu cầu từ Giám đốc và 18 quyết định trong Phòng Họp thành tài liệu PRD.md chuẩn hóa (${project.budget}) trước khi giao sang Design.`,
      processSteps: [
        {
          actor: '🤝 Trợ lý (Main Bot)',
          action: 'Chuẩn hóa mục tiêu & phạm vi MVP',
          detail: `Chuyển mô tả "${project.description}" thành danh sách User Stories và tiêu chí nghiệm thu rõ ràng.`,
        },
        {
          actor: '🧠 Đồng bộ Bộ nhớ chung',
          action: 'Gắn 18 quyết định CEO vào PRD.md',
          detail: 'Đính kèm toàn bộ quyết định công nghệ, UX, bảo mật và quy trình Rework để các phòng sau không làm lệch.',
        },
      ],
      appliedMemory: memory.slice(0, 4).map((m) => `${m.deptLabel}: ${m.chosenLabel}`),
      verification: [
        '✓ Đầy đủ mục tiêu, phạm vi MVP, ngân sách và tiêu chí Pass',
        '✓ Đã đồng bộ 100% với 18 quyết định Bộ nhớ chung',
      ],
      deliverables: ['PRD.md', 'company-memory.json'],
      assistantAdvice: 'PRD.md đã rõ ràng và khớp 100% chỉ đạo họp Kickoff. Mời Giám đốc duyệt để chuyển sang 🎨 Phòng Design.',
    };
  }

  if (deptIdx === 2) {
    return {
      ...base,
      deptLabel: '🎨 Design',
      fileName: 'design.md',
      stageLabel: 'GĐ 2 · Báo cáo Thiết kế (Design)',
      title: `🎨 Design nộp design.md — "${project.name}"`,
      problem: `Thiết kế bố cục màn hình, hệ thống màu sắc, biểu đồ trực quan và hợp đồng dữ liệu (TypeScript Contract) cho "${project.name}".`,
      processSteps: [
        {
          actor: '🎨 Design',
          action: 'Đọc PRD.md & vẽ kiến trúc UI/Component',
          detail: 'Phác thảo Header, 3 thẻ tổng quan, 2 biểu đồ SVG, thanh ngân sách cảnh báo 3 màu và bộ lọc responsive Desktop + Mobile.',
        },
        {
          actor: '🎨 Design → 💻 FE & ⚙️ BE',
          action: 'Chốt hợp đồng dữ liệu dùng chung',
          detail: 'Định nghĩa trước interface dữ liệu để Frontend và Backend có thể code song song ngay ở Vòng 1.',
        },
      ],
      appliedMemory: pickMem('Design'),
      verification: [
        '✓ Đủ trạng thái Empty State, Error State & dữ liệu mẫu',
        '✓ Tương thích Responsive Desktop (1280px) & Mobile (375px)',
      ],
      deliverables: ['design.md', 'ui-wireframe.svg', 'api-contract.ts'],
      assistantAdvice: 'Bản thiết kế gọn gàng, tối ưu cho việc code song song. Mời Giám đốc duyệt để mở Vòng 1/3 cho 💻 FE & ⚙️ BE!',
    };
  }

  if (deptIdx === 3 || deptIdx === 4) {
    const mName =
      milestone === 1
        ? 'Khung giao diện & API cốt lõi'
        : milestone === 2
          ? 'Biểu đồ trực quan & Xử lý dữ liệu'
          : 'Bộ lọc, Responsive & Hoàn thiện';
    return {
      ...base,
      deptLabel: '💻 FE & ⚙️ BE',
      fileName: `vong-${milestone}-code`,
      stageLabel: `GĐ 3 · Báo cáo Code Vòng ${milestone}/3`,
      title: `💻 FE & ⚙️ BE nộp báo cáo Vòng ${milestone}/3: ${mName}`,
      problem: `Hoàn thiện phần lập trình song song cho Vòng ${milestone}/3 ("${mName}") kèm đồng bộ API trực tiếp giữa 2 cánh Trái – Phải.`,
      processSteps: [
        {
          actor: '💻 Frontend (Cánh Trái)',
          action: `Triển khai giao diện Vòng ${milestone}`,
          detail:
            milestone === 1
              ? 'Xây dựng Header, 3 thẻ tổng quan và Modal thêm/sửa giao dịch có validate.'
              : milestone === 2
                ? 'Vẽ biểu đồ tròn Donut, biểu đồ cột theo ngày bằng SVG thuần và thanh ngân sách.'
                : 'Hoàn thiện bộ lọc đa điều kiện, tìm kiếm ghi chú và tối ưu giao diện Mobile.',
        },
        {
          actor: '💻 Frontend ↔ ⚙️ Backend',
          action: 'Đi bộ qua hành lang đồng bộ API trực tiếp',
          detail: 'Kiểm khớp tên trường dữ liệu, kiểu số VND, ngày ISO và hàm lưu trữ LocalStorage tránh lỗi ghép nối.',
        },
        {
          actor: '⚙️ Backend (Cánh Phải)',
          action: `Hoàn thiện logic & unit test Vòng ${milestone}`,
          detail: 'Viết hàm xử lý thuần túy + bổ sung bộ unit test Vitest cho các trường hợp biên.',
        },
      ],
      appliedMemory: [...pickMem('Frontend'), ...pickMem('Backend')].slice(0, 4),
      verification: [
        `✓ Đồng bộ FE ↔ BE Vòng ${milestone}/3 không lệch contract`,
        `✓ Tự kiểm tra biên dịch TypeScript sạch lỗi (Rework hiện tại: ${reworks})`,
      ],
      deliverables:
        milestone === 1
          ? ['src/types/expense.ts', 'src/utils/storage.ts', 'src/components/TransactionFormModal.tsx']
          : milestone === 2
            ? ['src/utils/finance.ts', 'src/components/CategoryDonutChart.tsx', 'src/components/BudgetProgressBar.tsx']
            : ['src/components/FilterBar.tsx', 'src/components/TransactionList.tsx'],
      assistantAdvice:
        milestone < 3
          ? `Code Vòng ${milestone}/3 đã hoàn thiện. Mời Giám đốc duyệt để chuyển sang 🧪 QA chạy test tự động Vòng ${milestone}!`
          : 'Code cả 3 vòng đã đầy đủ. Mời Giám đốc duyệt để chuyển sang 🔍 Review Lab kiểm định độc lập!',
    };
  }

  if (deptIdx === 5) {
    return {
      ...base,
      deptLabel: '🔍 Review Lab',
      fileName: 'review.md',
      stageLabel: 'GĐ 4 · Báo cáo Code Review Độc lập',
      title: `🔍 Review Lab nộp review.md — "${project.name}"`,
      problem: 'Đánh giá chéo độc lập toàn bộ diff code, bảo mật và kiểm thử giao diện trực quan trên trình duyệt Chromium thật.',
      processSteps: [
        {
          actor: '🔍 Code Reviewer',
          action: 'Soi toàn bộ Diff Code & Bảo mật',
          detail: 'Kiểm tra logic biên, cấu trúc module, đảm bảo không có lỗ hổng XSS hay lộ secret/API key.',
        },
        {
          actor: '🔍 Code Reviewer (Chromium)',
          action: 'Mở trình duyệt thật kiểm tra Desktop & Mobile',
          detail: 'Xác minh giao diện ở 1280×800 và 375×812 không bị tràn khung, không che nút bấm và biểu đồ hiển thị chuẩn.',
        },
      ],
      appliedMemory: pickMem('Review'),
      verification: [
        '✓ 0 lỗi bảo mật & 0 lỗi logic nghiêm trọng',
        '✓ Chromium Desktop (1280×800) & Mobile (375×812): Đạt chuẩn 100%',
      ],
      deliverables: ['review.md', 'chromium-desktop.png', 'chromium-mobile.png'],
      assistantAdvice: 'Review độc lập đã Pass toàn diện. Mời Giám đốc duyệt để chuyển sang 🧪 QA chạy bộ kiểm thử tự động cuối cùng!',
    };
  }

  if (deptIdx === 6) {
    const isFinal = milestone >= 3;
    return {
      ...base,
      deptLabel: '🧪 QA Script',
      fileName: isFinal ? 'ci-test-final.log' : `ci-vong-${milestone}.log`,
      stageLabel: isFinal ? 'GĐ 5 · Báo cáo QA Tổng & Duyệt UAT' : `GĐ 3 · Báo cáo QA Test Vòng ${milestone}/3`,
      title: isFinal
        ? `🧪 QA nộp báo cáo tổng thể (20/20 Pass) — "${project.name}"`
        : `🧪 QA nộp kết quả test Vòng ${milestone}/3`,
      problem: isFinal
        ? 'Chạy toàn bộ bộ kiểm thử tự động (Vitest + TypeScript + Vite Build) xác nhận sản phẩm sẵn sàng phát hành.'
        : `Chạy kiểm thử tự động liên tục ngay sau Vòng ${milestone}/3 để bảo đảm không có lỗi trước khi sang Vòng ${milestone + 1}.`,
      processSteps: [
        {
          actor: '🧪 QA Script (0 Token AI)',
          action: 'Chạy lệnh vitest --run',
          detail: isFinal ? 'Tất cả 20 / 20 unit tests Pass trong 499ms.' : `Tất cả ${milestone * 7} unit tests Vòng ${milestone} Pass 100%.`,
        },
        {
          actor: '🧪 QA Script (CI Build)',
          action: 'Chạy tsc --noEmit && vite build',
          detail: 'Kiểm tra kiểu dữ liệu sạch 0 lỗi và đóng gói thành công bản production dist/.',
        },
      ],
      appliedMemory: pickMem('QA'),
      verification: [
        isFinal ? '✓ vitest --run: 20 / 20 PASSED (100%)' : `✓ vitest --run (Vòng ${milestone}): ${milestone * 7}/${milestone * 7} PASSED`,
        '✓ tsc --noEmit && vite build: 0 errors',
        `✓ Số lần Rework đã xử lý: ${reworks}`,
      ],
      deliverables: [isFinal ? 'ci-test-final.log' : `ci-vong-${milestone}.log`, 'dist/index.html'],
      assistantAdvice: isFinal
        ? 'Mọi bài test & build đều xanh 100%. Mời Giám đốc bấm Duyệt để 🚀 DevOps mở Pull Request v1.0.0!'
        : `Test Vòng ${milestone} đã xanh 100%. Mời Giám đốc duyệt để 💻 FE & ⚙️ BE tiến sang Vòng ${milestone + 1}/3!`,
    };
  }

  // DevOps Release (idx === 7)
  return {
    ...base,
    deptLabel: '🚀 GitHub PR',
    fileName: 'Release v1.0.0',
    stageLabel: 'GĐ 6 · Báo cáo Phát hành (Release)',
    title: `🚀 DevOps nộp báo cáo Release v1.0.0 — "${project.name}"`,
    problem: 'Đóng gói commit sạch, đẩy nhánh mới, mở Pull Request lên GitHub kèm Release Notes và Snapshot Rollback.',
    processSteps: [
      {
        actor: '🚀 DevOps Publisher',
        action: 'Tạo nhánh & mở Pull Request lên GitHub',
        detail: `Đẩy toàn bộ mã nguồn "${project.name}", đính kèm báo cáo test 20/20 và review.md vào mô tả PR.`,
      },
      {
        actor: '🚀 DevOps Publisher',
        action: 'Gắn tag v1.0.0 & lưu Snapshot dự phòng',
        detail: 'Lưu snapshot bản ổn định để có thể Rollback tức thì nếu phát sinh sự cố sau phát hành.',
      },
    ],
    appliedMemory: pickMem('GitHub'),
    verification: [
      '✓ GitHub Pull Request đã mở thành công',
      '✓ Tag v1.0.0 & Rollback Snapshot sẵn sàng',
    ],
    deliverables: ['PR #1 (GitHub)', 'CHANGELOG.md', 'v1.0.0-snapshot'],
    assistantAdvice: 'Sản phẩm đã phát hành thành công! Bấm Duyệt để hoàn tất tổng kết KPI và cho cả công ty ra Khu Thư giãn ăn mừng.',
  };
}
