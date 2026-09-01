// Powered by OnSpace.AI
export const mockArtworks = [
  {
    id: '1',
    title: 'لوحة الغروب الذهبي',
    description: 'لوحة زيتية تصوّر غروب الشمس فوق البحر بألوان دافئة تعكس جمال اللحظة الهادئة',
    category: 'زيت على قماش',
    price: 2500,
    dimensions: '60×80 سم',
    year: '2024',
    available: true,
    image: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'البورتريه الكلاسيكي',
    description: 'بورتريه بالألوان المائية بأسلوب كلاسيكي راقٍ يجمع بين الدقة والتعبير الإنساني العميق',
    category: 'ألوان مائية',
    price: 1800,
    dimensions: '40×50 سم',
    year: '2024',
    available: true,
    image: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'تجريد الروح',
    description: 'عمل تجريدي معاصر يعبّر عن الحرية والطاقة الداخلية بضربات قلم جريئة وألوان متناقضة',
    category: 'أكريليك',
    price: 3200,
    dimensions: '100×120 سم',
    year: '2023',
    available: false,
    image: null,
    createdAt: new Date().toISOString(),
  },
];

export const mockCustomers = [
  {
    id: '1',
    name: 'أحمد محمد السيد',
    phone: '0501234567',
    email: 'ahmed@example.com',
    address: 'الرياض، حي النخيل',
    notes: 'مهتم باللوحات الكلاسيكية والبورتريهات',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'فاطمة العمري',
    phone: '0559876543',
    email: 'fatima@example.com',
    address: 'جدة، حي الزهراء',
    notes: 'تفضّل الأعمال التجريدية الكبيرة',
    createdAt: new Date().toISOString(),
  },
];

export const mockQuotes = [
  {
    id: '1',
    quoteNumber: 'QT-2024-001',
    customerId: '1',
    customerName: 'أحمد محمد السيد',
    items: [
      { artworkId: '1', title: 'لوحة الغروب الذهبي', price: 2500, quantity: 1 },
    ],
    subtotal: 2500,
    discount: 0,
    total: 2500,
    status: 'sent',
    notes: 'شامل التغليف والتوصيل',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
