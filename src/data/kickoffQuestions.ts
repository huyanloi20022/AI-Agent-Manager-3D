export interface DeptQuestionOption {
  id: string;
  label: string;
  isRecommended?: boolean;
}

export interface DeptQuestion {
  id: string;
  deptId: string;
  deptLabel: string;
  question: string;
  /** Cross-department memory references */
  refs: string[];
  assistantReason: string;
  options: DeptQuestionOption[];
}

export interface MemoryDecision {
  questionId: string;
  deptLabel: string;
  refs: string[];
  chosenLabel: string;
  ceoNote?: string;
}

/** Generate 3 strategic questions per department (6 departments x 3 = 18 questions) tailored to the project */
export function buildKickoffQuestions(projectName: string): DeptQuestion[] {
  return [
    // 🎨 Design (3 câu)
    {
      id: 'des-1',
      deptId: 'design',
      deptLabel: '🎨 Design',
      question: `Với "${projectName}", phong cách giao diện chủ đạo nên ưu tiên hướng nào?`,
      refs: ['💻 Frontend', '👑 Giám đốc'],
      assistantReason: 'Giao diện tối giản hiện đại (Dashboard Card + Biểu đồ rõ nét) giúp Frontend dựng nhanh bằng Tailwind và dễ đọc số liệu.',
      options: [
        { id: 'a', label: 'Tối giản hiện đại (Clean Dashboard + Biểu đồ trực quan)', isRecommended: true },
        { id: 'b', label: 'Đậm chất doanh nghiệp (Nhiều bảng biểu chi tiết)' },
        { id: 'c', label: 'Dark-first cao cấp (Tương phản mạnh)' },
      ],
    },
    {
      id: 'des-2',
      deptId: 'design',
      deptLabel: '🎨 Design',
      question: 'Mức độ ưu tiên thiết kế cho thiết bị di động (Mobile Responsive)?',
      refs: ['💻 Frontend', '🔍 Review Lab'],
      assistantReason: 'Thiết kế Responsive chuẩn cả Desktop (1280px) & Mobile (375px) giúp Review Lab nghiệm thu trên Chromium không bị tràn khung.',
      options: [
        { id: 'a', label: 'Chuẩn Responsive cả Desktop & Mobile (ưu tiên đồng đều)', isRecommended: true },
        { id: 'b', label: 'Chỉ tập trung Desktop trước để ra MVP nhanh' },
        { id: 'c', label: 'Mobile-first như ứng dụng điện thoại' },
      ],
    },
    {
      id: 'des-3',
      deptId: 'design',
      deptLabel: '🎨 Design',
      question: 'Có cần tạo sẵn dữ liệu mẫu (Seed Data) ngay khi mở app lần đầu không?',
      refs: ['⚙️ Backend', '🧪 QA Script'],
      assistantReason: 'Có sẵn dữ liệu mẫu giúp Giám đốc xem ngay biểu đồ hoạt động khi UAT và giúp QA có bộ test chuẩn.',
      options: [
        { id: 'a', label: 'Có dữ liệu mẫu sinh động + nút Reset dữ liệu', isRecommended: true },
        { id: 'b', label: 'Màn hình trống hoàn toàn (Empty State)' },
        { id: 'c', label: 'Hiện hướng dẫn nhập từng bước (Onboarding Wizard)' },
      ],
    },

    // 💻 Frontend (3 câu)
    {
      id: 'fe-1',
      deptId: 'frontend',
      deptLabel: '💻 Frontend',
      question: `Nên dùng thư viện biểu đồ nào cho "${projectName}" để vừa nhẹ vừa đẹp?`,
      refs: ['🎨 Design', '🧪 QA Script'],
      assistantReason: 'Biểu đồ SVG thuần không phụ thuộc thư viện nặng giúp build Vite cực nhanh, không lỗi xung đột phiên bản khi QA chạy CI.',
      options: [
        { id: 'a', label: 'SVG thuần tùy biến (Nhẹ, 0 lỗi dependency, build siêu nhanh)', isRecommended: true },
        { id: 'b', label: 'Recharts / Chart.js (Nhiều hiệu ứng có sẵn)' },
        { id: 'c', label: 'ECharts (Biểu đồ phân tích chuyên sâu)' },
      ],
    },
    {
      id: 'fe-2',
      deptId: 'frontend',
      deptLabel: '💻 Frontend',
      question: 'Quản lý trạng thái (State) và đồng bộ hợp đồng dữ liệu với Backend thế nào?',
      refs: ['⚙️ Backend', '🔍 Review Lab'],
      assistantReason: 'Tách riêng lớp TypeScript types & utils/finance dùng chung giúp FE & BE code song song không bị lệch cấu trúc dữ liệu.',
      options: [
        { id: 'a', label: 'TypeScript Contract chung + Pure Utils tách khỏi UI', isRecommended: true },
        { id: 'b', label: 'Redux Toolkit / Zustand quản lý tập trung' },
        { id: 'c', label: 'Viết gộp state trong từng Component cho nhanh' },
      ],
    },
    {
      id: 'fe-3',
      deptId: 'frontend',
      deptLabel: '💻 Frontend',
      question: 'Xử lý thao tác người dùng (thêm/sửa/xóa) theo kiểu nào để mượt nhất?',
      refs: ['🎨 Design', '🧪 QA Script'],
      assistantReason: 'Modal popup rõ ràng kèm validate ngay khi nhập giúp hạn chế dữ liệu sai (số âm, bỏ trống) và dễ viết test tự động.',
      options: [
        { id: 'a', label: 'Modal Form có kiểm tra hợp lệ tức thì (Realtime Validation)', isRecommended: true },
        { id: 'b', label: 'Chỉnh sửa trực tiếp trên dòng (Inline Edit)' },
        { id: 'c', label: 'Chuyển sang trang form riêng' },
      ],
    },

    // ⚙️ Backend (3 câu)
    {
      id: 'be-1',
      deptId: 'backend',
      deptLabel: '⚙️ Backend',
      question: `Lưu trữ dữ liệu cho phiên bản đầu của "${projectName}" nên chọn phương án nào?`,
      refs: ['💻 Frontend', '🚀 GitHub PR'],
      assistantReason: 'Lưu LocalStorage có lớp trừu tượng Storage Adapter giúp chạy ngay không cần cài DB server, sau này nâng lên API/MySQL chỉ đổi 1 file.',
      options: [
        { id: 'a', label: 'LocalStorage qua Storage Adapter (Chạy ngay, dễ nâng cấp API sau)', isRecommended: true },
        { id: 'b', label: 'REST API Node.js + SQLite ngay từ đầu' },
        { id: 'c', label: 'PostgreSQL / MySQL Docker đầy đủ' },
      ],
    },
    {
      id: 'be-2',
      deptId: 'backend',
      deptLabel: '⚙️ Backend',
      question: 'Chiến lược xử lý lỗi dữ liệu hỏng hoặc nhập sai định dạng (Edge Cases)?',
      refs: ['🔍 Review Lab', '🧪 QA Script'],
      assistantReason: 'Tự động fallback an toàn & làm sạch dữ liệu giúp ứng dụng không bao giờ trắng trang và đạt 100% test edge-case.',
      options: [
        { id: 'a', label: 'Safe Fallback + Validate chặt mọi đầu vào (chống crash)', isRecommended: true },
        { id: 'b', label: 'Hiện thông báo lỗi và yêu cầu người dùng reset' },
        { id: 'c', label: 'Bỏ qua validate để tối giản code' },
      ],
    },
    {
      id: 'be-3',
      deptId: 'backend',
      deptLabel: '⚙️ Backend',
      question: 'Có cần hỗ trợ tính năng sao lưu / xuất dữ liệu (Export) ngay ở bản MVP không?',
      refs: ['🎨 Design', '💻 Frontend'],
      assistantReason: 'Thiết kế sẵn hàm serialize JSON/CSV trong tầng utils tốn rất ít công nhưng giúp mở rộng tính năng Export ở Sprint 2 ngay lập tức.',
      options: [
        { id: 'a', label: 'Chuẩn bị sẵn hàm Export JSON/CSV trong tầng logic', isRecommended: true },
        { id: 'b', label: 'Chưa cần, để sang Sprint 2 mới thiết kế' },
        { id: 'c', label: 'Làm luôn nút Xuất Excel/PDF ngay trong bản MVP' },
      ],
    },

    // 🔍 Review Lab (3 câu)
    {
      id: 'rev-1',
      deptId: 'review',
      deptLabel: '🔍 Review Lab',
      question: 'Mức độ khắt khe khi chấm Code Review độc lập cho dự án này?',
      refs: ['💻 Frontend', '⚙️ Backend'],
      assistantReason: 'Chặn các lỗi nghiêm trọng (bug logic, lỗi bảo mật, lỗi hiển thị) và góp ý nhẹ phần style giúp đảm bảo chất lượng mà không kéo dài thời gian Rework.',
      options: [
        { id: 'a', label: 'Cân bằng: Chặn lỗi logic/UI/bảo mật, linh hoạt style', isRecommended: true },
        { id: 'b', label: 'Cực kỳ khắt khe: Lỗi nhỏ cũng trả về Rework' },
        { id: 'c', label: 'Nhanh gọn: Chỉ kiểm tra chạy được không crash' },
      ],
    },
    {
      id: 'rev-2',
      deptId: 'review',
      deptLabel: '🔍 Review Lab',
      question: 'Có bắt buộc kiểm thử giao diện trực quan bằng trình duyệt Chromium thật không?',
      refs: ['🎨 Design', '🧪 QA Script'],
      assistantReason: 'Chụp & kiểm tra trên Chromium thật ở 2 kích thước (Desktop + Mobile) bắt được các lỗi vỡ layout mà unit test không thấy.',
      options: [
        { id: 'a', label: 'Bắt buộc kiểm tra trên Chromium (Desktop 1280px + Mobile 375px)', isRecommended: true },
        { id: 'b', label: 'Chỉ cần đọc code diff, không cần mở trình duyệt' },
        { id: 'c', label: 'Chỉ kiểm tra trên Desktop' },
      ],
    },
    {
      id: 'rev-3',
      deptId: 'review',
      deptLabel: '🔍 Review Lab',
      question: 'Quét bảo mật (tránh lộ API Key, XSS, dữ liệu nhạy cảm) áp dụng mức nào?',
      refs: ['⚙️ Backend', '🚀 GitHub PR'],
      assistantReason: 'Kiểm tra chống XSS và quét không để lộ secret trước khi push GitHub là tiêu chuẩn bắt buộc của công ty chuyên nghiệp.',
      options: [
        { id: 'a', label: 'Bắt buộc quét XSS & kiểm tra không lộ secret trước khi mở PR', isRecommended: true },
        { id: 'b', label: 'Chỉ kiểm tra cơ bản' },
        { id: 'c', label: 'Bỏ qua vì chỉ chạy nội bộ' },
      ],
    },

    // 🧪 QA Script (3 câu)
    {
      id: 'qa-1',
      deptId: 'qa',
      deptLabel: '🧪 QA Script',
      question: 'Mục tiêu độ phủ Unit Test tối thiểu cho tầng xử lý logic là bao nhiêu?',
      refs: ['⚙️ Backend', '💻 Frontend'],
      assistantReason: 'Tối thiểu 15–20 unit test bao phủ tính toán chính & biên (số 0, số âm, vượt 100%) đảm bảo độ tin cậy cao với thời gian chạy < 1 giây.',
      options: [
        { id: 'a', label: 'Tối thiểu 20 unit test Vitest bao phủ cả Edge Cases (Pass 100%)', isRecommended: true },
        { id: 'b', label: '5–8 smoke test cơ bản' },
        { id: 'c', label: 'Full E2E Playwright + Unit Test > 90% coverage' },
      ],
    },
    {
      id: 'qa-2',
      deptId: 'qa',
      deptLabel: '🧪 QA Script',
      question: 'Khi Script Test phát hiện lỗi, chính sách tự động Rework nên đặt tối đa mấy vòng?',
      refs: ['💻 Frontend', '⚙️ Backend', '👑 Giám đốc'],
      assistantReason: 'Tối đa 3 vòng tự sửa (targeted_fix) giúp AI tự khắc phục hầu hết lỗi; nếu quá 3 vòng sẽ báo Giám đốc can thiệp tránh lặp vô hạn.',
      options: [
        { id: 'a', label: 'Tự động trả về sửa tối đa 3 vòng (Targeted Fix)', isRecommended: true },
        { id: 'b', label: 'Dừng ngay lập tức báo Giám đốc khi lỗi lần đầu' },
        { id: 'c', label: 'Thử lại tối đa 1 vòng duy nhất' },
      ],
    },
    {
      id: 'qa-3',
      deptId: 'qa',
      deptLabel: '🧪 QA Script',
      question: 'Có bắt buộc kiểm tra TypeScript (`tsc --noEmit`) và Production Build trước khi trình Giám đốc?',
      refs: ['💻 Frontend', '🚀 GitHub PR'],
      assistantReason: 'Chạy đủ bộ `vitest --run && tsc --noEmit && vite build` đảm bảo code trình lên CEO luôn build ra sản phẩm chạy thật 100%.',
      options: [
        { id: 'a', label: 'Bắt buộc Pass đủ 3 bước: Unit Test + TypeScript + Vite Build', isRecommended: true },
        { id: 'b', label: 'Chỉ cần Pass Unit Test' },
        { id: 'c', label: 'Chỉ cần Build không lỗi' },
      ],
    },

    // 🚀 DevOps / Release (3 câu)
    {
      id: 'rel-1',
      deptId: 'release',
      deptLabel: '🚀 GitHub PR',
      question: `Chiến lược bàn giao code lên GitHub cho "${projectName}" sau khi Giám đốc duyệt UAT?`,
      refs: ['🔍 Review Lab', '👑 Giám đốc'],
      assistantReason: 'Tạo nhánh riêng (`feat/...`) và mở Pull Request kèm báo cáo test giúp lịch sử Git sạch sẽ và dễ Rollback khi cần.',
      options: [
        { id: 'a', label: 'Tạo nhánh mới + Mở Pull Request kèm báo cáo Test & Review', isRecommended: true },
        { id: 'b', label: 'Push thẳng trực tiếp lên nhánh main' },
        { id: 'c', label: 'Chỉ lưu artifact nội bộ, chưa đẩy lên GitHub' },
      ],
    },
    {
      id: 'rel-2',
      deptId: 'release',
      deptLabel: '🚀 GitHub PR',
      question: 'Đánh số phiên bản (Versioning) & ghi Release Notes theo chuẩn nào?',
      refs: ['🤝 Trợ lý (Bot)', '🧪 QA Script'],
      assistantReason: 'Gắn tag SemVer (`v1.0.0`) + tóm tắt thay đổi giúp Trợ lý tổng hợp báo cáo EOD-KPI rõ ràng cho Giám đốc.',
      options: [
        { id: 'a', label: 'Chuẩn SemVer (v1.0.0) + Release Notes tự động', isRecommended: true },
        { id: 'b', label: 'Đánh dấu theo ngày phát hành' },
        { id: 'c', label: 'Không cần gắn tag phiên bản' },
      ],
    },
    {
      id: 'rel-3',
      deptId: 'release',
      deptLabel: '🚀 GitHub PR',
      question: 'Phương án dự phòng (Rollback) nếu phát hiện sự cố sau khi phát hành?',
      refs: ['🧪 QA Script', '👑 Giám đốc'],
      assistantReason: 'Giữ nguyên snapshot phiên bản trước cho phép quay lại trạng thái ổn định trong vòng 10 giây nếu có sự cố.',
      options: [
        { id: 'a', label: 'Lưu Snapshot bản ổn định để Rollback tức thì 1 click', isRecommended: true },
        { id: 'b', label: 'Sửa lỗi nóng (Hotfix) trực tiếp trên bản mới' },
        { id: 'c', label: 'Chưa cần phương án Rollback ở bản MVP' },
      ],
    },
  ];
}

