// Powered by OnSpace.AI
export const mockArtworks = [
  {
    id: '1',
    title: 'جدارية الموجة الكبرى',
    description: 'جدارية ضخمة منحوتة تصوّر موجة بحرية بأسلوب تجريدي معاصر، مناسبة للفضاءات الداخلية الفاخرة',
    category: 'جداريات',
    price: 15000,
    dimensions: '200×120 سم',
    year: '2024',
    available: true,
    image: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'وحدة إضاءة حديثة',
    description: 'تشكيل نحتي مدمج مع إضاءة LED يخلق أجواء بصرية فريدة، تصميم عصري يناسب الديكور الفندقي والسكني',
    category: 'وحدات إضاءة',
    price: 8500,
    dimensions: '40×40 سم',
    year: '2024',
    available: true,
    image: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'مجسم الفراشة',
    description: 'مجسم نحتي ثلاثي الأبعاد على شكل فراشة بجناحين شفافين من الراتينج، يعكس الضوء بشكل ساحر',
    category: 'مجسمات',
    price: 5500,
    dimensions: '60×45 سم',
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
      { artworkId: '1', title: 'جدارية الموجة الكبرى', price: 15000, quantity: 1 },
    ],
    subtotal: 15000,
    discount: 0,
    total: 15000,
    status: 'sent',
    notes: 'شامل التغليف والتوصيل',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
