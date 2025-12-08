export type Review = {
  id: string;
  author: string;
  rating: 1|2|3|4|5;
  text: string;
  createdAt: string;
};

export const MOCK_REVIEWS: Review[] = [
  { id:'r1', author:'anna', rating:5, text:'Đúng mô tả, ship nhanh.', createdAt:'2025-09-21 12:11' },
  { id:'r2', author:'bao_l', rating:4, text:'Hàng đẹp, hộp hơi móp.', createdAt:'2025-09-28 08:45' },
  { id:'r3', author:'chiaki', rating:5, text:'Size chuẩn, sẽ ủng hộ tiếp.', createdAt:'2025-10-02 19:02' },
  { id:'r4', author:'duy', rating:3, text:'Ổn, nhưng giao trễ 1 ngày.', createdAt:'2025-10-04 14:20' },
];