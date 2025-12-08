// src/data/qna.ts
export type QAItem = {
  id: string;
  author: string;
  question: string;
  answer?: string;
  createdAt: string; // "YYYY-MM-DD HH:mm"
};

export const MOCK_QA: QAItem[] = [
  {
    id: 'q1',
    author: 'buyer_102',
    question: 'Có hộp và phiếu bảo hành không?',
    answer: 'Không có hộp, tặng túi đựng.',
    createdAt: '2025-10-01 10:20',
  },
  {
    id: 'q2',
    author: 'minty',
    question: 'Da có bị trầy xước sâu không?',
    answer: 'Chỉ có vết xước hairline nhẹ như ảnh.',
    createdAt: '2025-10-03 09:02',
  },
];
// Optional default export để tránh lỗi import nhầm
export default MOCK_QA;
