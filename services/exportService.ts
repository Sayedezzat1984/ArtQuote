// Powered by OnSpace.AI
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { Quote, Artwork, Customer } from '@/contexts/AppContext';

const APP_FOLDER = FileSystem.documentDirectory + 'SayedEzzat/';

async function ensureFolder() {
  const info = await FileSystem.getInfoAsync(APP_FOLDER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(APP_FOLDER, { intermediates: true });
  }
}

function generateQuoteHTML(quote: Quote, lang: 'ar' | 'en', currency: string, artworks?: Artwork[], customer?: Customer): string {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const L = {
    title: isAr ? 'عرض سعر احترافي' : 'Professional Price Quote',
    customer: isAr ? 'بيانات العميل' : 'Client Details',
    date: isAr ? 'تاريخ الإصدار' : 'Issue Date',
    validUntil: isAr ? 'صالح حتى' : 'Valid Until',
    quoteNo: isAr ? 'رقم العرض' : 'Quote No.',
    item: isAr ? 'الوصف والعمل الفني' : 'Description & Artwork',
    qty: isAr ? 'الكمية' : 'Qty',
    unitPrice: isAr ? 'سعر الوحدة' : 'Unit Price',
    itemTotal: isAr ? 'الإجمالي' : 'Total',
    subtotal: isAr ? 'المجموع الفرعي' : 'Subtotal',
    discount: isAr ? 'الخصم' : 'Discount',
    grandTotal: isAr ? 'الإجمالي النهائي' : 'Grand Total',
    notes: isAr ? 'ملاحظات' : 'Notes',
    artistTitle: isAr ? 'فنان تشكيلي' : 'Visual Artist',
    paymentTerms: isAr ? 'شروط الدفع' : 'Payment Terms',
    deliveryPeriod: isAr ? 'مدة التسليم' : 'Delivery Period',
    contractTerms: isAr ? 'شروط التعاقد' : 'Contract Terms',
    dimensions: isAr ? 'الأبعاد' : 'Dimensions',
    phone: isAr ? 'الجوال' : 'Phone',
    email: isAr ? 'البريد' : 'Email',
    address: isAr ? 'العنوان' : 'Address',
    artworksSection: isAr ? 'الأعمال الفنية' : 'Artworks',
    thankyou: isAr ? 'شكراً لثقتكم بأعمالنا الفنية' : 'Thank you for your trust in our artwork',
  };

  const date = new Date(quote.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const validDate = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // Build artwork cards with images
  const artworkCards = quote.items.map(item => {
    const art = artworks?.find(a => a.id === item.artworkId);
    const imgSrc = art?.images?.[0] || art?.image || '';
    const dims = art?.dimensions ? `<div class="artwork-dim">📐 ${art.dimensions}</div>` : '';
    const category = art?.category ? `<div class="artwork-cat">${art.category}${art.year ? ` · ${art.year}` : ''}</div>` : '';
    const desc = art?.description ? `<div class="artwork-desc">${art.description}</div>` : '';
    const imgBlock = imgSrc
      ? `<img src="${imgSrc}" class="artwork-img" onerror="this.style.display='none'" />`
      : `<div class="artwork-img-placeholder">🎨</div>`;
    return `
    <div class="artwork-card">
      ${imgBlock}
      <div class="artwork-content">
        <div class="artwork-title">${item.title}</div>
        ${category}${dims}${desc}
        <div class="artwork-price-row">
          <span class="artwork-subtotal">${(item.price * item.quantity).toLocaleString()} ${currency}</span>
          <span class="artwork-qty">${item.quantity} × ${item.price.toLocaleString()} ${currency}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const customerPhone = customer?.phone ? `<div class="cust-detail"><span class="cust-icon">📱</span>${L.phone}: ${customer.phone}</div>` : '';
  const customerEmail = customer?.email ? `<div class="cust-detail"><span class="cust-icon">✉️</span>${L.email}: ${customer.email}</div>` : '';
  const customerAddress = customer?.address ? `<div class="cust-detail"><span class="cust-icon">📍</span>${L.address}: ${customer.address}</div>` : '';

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Tajawal',Arial,sans-serif; direction:${dir}; color:#1a1a22; background:#f4f4f8; font-size:14px; }
  .page { max-width:820px; margin:0 auto; background:#fff; }

  /* ── Hero Header ── */
  .hero { background:linear-gradient(135deg, #0d0d0f 0%, #1a1a22 50%, #252530 100%); padding:40px 44px; position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; top:-60px; ${isAr ? 'left' : 'right'}:-60px; width:200px; height:200px; border-radius:50%; background:rgba(201,168,76,0.08); }
  .hero::after { content:''; position:absolute; bottom:-40px; ${isAr ? 'right' : 'left'}:-40px; width:140px; height:140px; border-radius:50%; background:rgba(201,168,76,0.05); }
  .hero-inner { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1; }
  .brand-block {}
  .brand-name { font-size:34px; font-weight:900; color:#C9A84C; letter-spacing:3px; text-transform:uppercase; line-height:1; }
  .brand-divider { width:50px; height:3px; background:linear-gradient(90deg,#C9A84C,transparent); margin:10px 0; }
  .brand-sub { font-size:13px; color:#9B9AA5; letter-spacing:2px; text-transform:uppercase; }
  .quote-badge { text-align:${isAr ? 'left' : 'right'}; }
  .quote-badge-label { font-size:10px; color:#5A5A6A; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
  .quote-number { font-size:26px; font-weight:900; color:#C9A84C; letter-spacing:1px; }
  .quote-dates { margin-top:10px; }
  .quote-date-row { font-size:11px; color:#9B9AA5; padding:3px 0; }
  .quote-date-row span { color:#E8C96A; font-weight:600; }

  /* ── Status Bar ── */
  .status-bar { background:#C9A84C; padding:8px 44px; display:flex; justify-content:space-between; align-items:center; }
  .status-label { font-size:11px; color:#0d0d0f; font-weight:700; letter-spacing:2px; text-transform:uppercase; }

  /* ── Body ── */
  .body { padding:36px 44px; }

  .section-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .section-icon { width:32px; height:32px; background:#1a1a22; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
  .section-title { font-size:13px; font-weight:700; color:#1a1a22; text-transform:uppercase; letter-spacing:1px; }
  .section-line { flex:1; height:1px; background:linear-gradient(${isAr ? 'to left' : 'to right'},#e0e0e8,transparent); }

  /* ── Customer Card ── */
  .customer-card { background:linear-gradient(135deg,#f8f8fb,#fff); border-radius:12px; padding:20px 24px; margin-bottom:32px; border:1px solid #e8e8f0; border-${isAr ? 'right' : 'left'}:4px solid #C9A84C; }
  .customer-name { font-size:22px; font-weight:800; color:#1a1a22; margin-bottom:10px; }
  .cust-detail { font-size:12px; color:#555; padding:3px 0; display:flex; align-items:center; gap:8px; }
  .cust-icon { font-size:13px; }

  /* ── Artwork Cards ── */
  .artworks-section { margin-bottom:32px; }
  .artwork-card { display:flex; gap:16px; background:#f8f8fb; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid #e8e8f0; align-items:flex-start; }
  .artwork-img { width:100px; height:100px; object-fit:cover; border-radius:8px; border:2px solid #e0e0e8; flex-shrink:0; }
  .artwork-img-placeholder { width:100px; height:100px; background:linear-gradient(135deg,#e8e8f0,#f4f4f8); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:32px; flex-shrink:0; border:2px solid #e0e0e8; }
  .artwork-content { flex:1; }
  .artwork-title { font-size:16px; font-weight:700; color:#1a1a22; margin-bottom:5px; }
  .artwork-cat { font-size:11px; color:#C9A84C; font-weight:600; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px; }
  .artwork-dim { font-size:11px; color:#888; margin-bottom:4px; }
  .artwork-desc { font-size:12px; color:#666; line-height:1.6; margin-bottom:8px; }
  .artwork-price-row { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px dashed #e0e0e8; margin-top:8px; flex-wrap:wrap; gap:6px; }
  .artwork-subtotal { font-size:17px; font-weight:800; color:#C9A84C; }
  .artwork-qty { font-size:11px; color:#888; }

  /* ── Totals ── */
  .totals-section { margin-bottom:32px; }
  .totals-wrap { display:flex; justify-content:${isAr ? 'flex-start' : 'flex-end'}; }
  .totals-box { width:320px; background:#f8f8fb; border-radius:12px; padding:20px 24px; border:1px solid #e8e8f0; }
  .total-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:13px; color:#555; border-bottom:1px solid #f0f0f4; }
  .total-row:last-child { border-bottom:none; }
  .total-row.grand { background:linear-gradient(135deg,#1a1a22,#252530); margin:-1px -1px -1px -1px; padding:14px 24px; border-radius:0 0 10px 10px; margin-top:4px; }
  .total-row.grand .lbl { font-size:14px; font-weight:700; color:#fff; }
  .total-row.grand .val { font-size:22px; font-weight:900; color:#C9A84C; }
  .total-row.disc .val { color:#e84444; }

  /* ── Contract Terms ── */
  .terms-card { background:#f8f8fb; border-radius:12px; padding:20px 24px; margin-bottom:32px; border:1px solid #e8e8f0; display:flex; gap:24px; flex-wrap:wrap; }
  .term-block { flex:1; min-width:200px; }
  .term-label { font-size:10px; color:#C9A84C; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .term-value { font-size:14px; color:#1a1a22; font-weight:600; line-height:1.5; }

  /* ── Notes ── */
  .notes-card { background:#fffdf0; border-radius:12px; padding:18px 24px; margin-bottom:32px; border:1px solid #f0e8c0; border-${isAr ? 'right' : 'left'}:4px solid #C9A84C; }
  .notes-title { font-size:11px; color:#C9A84C; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .notes-text { font-size:13px; color:#555; line-height:1.8; }

  /* ── Footer ── */
  .footer { background:linear-gradient(135deg, #0d0d0f 0%, #1a1a22 100%); padding:24px 44px; display:flex; justify-content:space-between; align-items:center; }
  .footer-brand { font-size:16px; font-weight:900; color:#C9A84C; letter-spacing:3px; }
  .footer-sub { font-size:10px; color:#5A5A6A; letter-spacing:1px; margin-top:3px; }
  .footer-thanks { font-size:11px; color:#9B9AA5; text-align:${isAr ? 'left' : 'right'}; font-style:italic; }
  .watermark { text-align:center; padding:10px; font-size:10px; color:#ccc; background:#f4f4f8; }
</style>
</head>
<body>
<div class="page">

  <!-- Hero Header -->
  <div class="hero">
    <div class="hero-inner">
      <div class="brand-block">
        <div class="brand-name">Sayed Ezzat</div>
        <div class="brand-divider"></div>
        <div class="brand-sub">${L.artistTitle}</div>
      </div>
      <div class="quote-badge">
        <div class="quote-badge-label">${L.title}</div>
        <div class="quote-number">${quote.quoteNumber}</div>
        <div class="quote-dates">
          <div class="quote-date-row">${L.date}: <span>${date}</span></div>
          ${validDate ? `<div class="quote-date-row">${L.validUntil}: <span>${validDate}</span></div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-label">${L.quoteNo} · ${quote.quoteNumber}</div>
    <div class="status-label">${quote.items.length} ${isAr ? 'أعمال فنية' : 'Artworks'}</div>
  </div>

  <!-- Body -->
  <div class="body">

    <!-- Customer -->
    <div class="section-header">
      <div class="section-icon">👤</div>
      <div class="section-title">${L.customer}</div>
      <div class="section-line"></div>
    </div>
    <div class="customer-card">
      <div class="customer-name">${quote.customerName}</div>
      ${customerPhone}${customerEmail}${customerAddress}
    </div>

    <!-- Artworks -->
    <div class="section-header">
      <div class="section-icon">🎨</div>
      <div class="section-title">${L.artworksSection}</div>
      <div class="section-line"></div>
    </div>
    <div class="artworks-section">
      ${artworkCards}
    </div>

    <!-- Totals -->
    <div class="section-header">
      <div class="section-icon">💰</div>
      <div class="section-title">${isAr ? 'الإجماليات' : 'Totals'}</div>
      <div class="section-line"></div>
    </div>
    <div class="totals-section">
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="total-row">
            <span class="lbl">${L.subtotal}</span>
            <span class="val">${quote.subtotal.toLocaleString()} ${currency}</span>
          </div>
          ${quote.discount > 0 ? `<div class="total-row disc"><span class="lbl">${L.discount}</span><span class="val">- ${quote.discount.toLocaleString()} ${currency}</span></div>` : ''}
          <div class="total-row grand">
            <span class="lbl">${L.grandTotal}</span>
            <span class="val">${quote.total.toLocaleString()} ${currency}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contract Terms -->
    ${(quote.paymentTerms || quote.deliveryPeriod) ? `
    <div class="section-header">
      <div class="section-icon">📋</div>
      <div class="section-title">${L.contractTerms}</div>
      <div class="section-line"></div>
    </div>
    <div class="terms-card">
      ${quote.paymentTerms ? `<div class="term-block"><div class="term-label">💳 ${L.paymentTerms}</div><div class="term-value">${quote.paymentTerms}</div></div>` : ''}
      ${quote.deliveryPeriod ? `<div class="term-block"><div class="term-label">🚚 ${L.deliveryPeriod}</div><div class="term-value">${quote.deliveryPeriod}</div></div>` : ''}
    </div>` : ''}

    <!-- Notes -->
    ${quote.notes ? `
    <div class="section-header">
      <div class="section-icon">📝</div>
      <div class="section-title">${L.notes}</div>
      <div class="section-line"></div>
    </div>
    <div class="notes-card">
      <div class="notes-text">${quote.notes}</div>
    </div>` : ''}

  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-brand">SAYED EZZAT</div>
      <div class="footer-sub">${L.artistTitle}</div>
    </div>
    <div class="footer-thanks">${L.thankyou}</div>
  </div>
  <div class="watermark">${quote.quoteNumber} · Sayed Ezzat · ${date}</div>

</div>
</body>
</html>`;
}

export async function exportQuoteAsPDF(quote: Quote, lang: 'ar' | 'en', currency: string, artworks?: Artwork[], customer?: Customer): Promise<void> {
  try {
    const html = generateQuoteHTML(quote, lang, currency, artworks, customer);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await ensureFolder();
    const dest = APP_FOLDER + `${quote.quoteNumber}.pdf`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: quote.quoteNumber });
    }
  } catch {
    Alert.alert('خطأ', 'فشل في تصدير PDF');
  }
}

export async function exportQuoteAsJPG(ref: any, quote: Quote, lang?: 'ar' | 'en', currency?: string, artworks?: Artwork[], customer?: Customer): Promise<void> {
  try {
    // Generate a simplified HTML for JPG preview and print/share it
    const html = generateQuoteHTML(quote, lang || 'ar', currency || 'ج.م', artworks, customer);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await ensureFolder();
    const dest = APP_FOLDER + `${quote.quoteNumber}_preview.pdf`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: quote.quoteNumber });
    }
  } catch {
    Alert.alert('خطأ', 'فشل في تصدير الملف');
  }
}

export async function exportBackup(artworks: Artwork[], customers: Customer[], quotes: Quote[]): Promise<void> {
  try {
    const backup = JSON.stringify(
      { version: '1.0', app: 'SayedEzzat', exportedAt: new Date().toISOString(), artworks, customers, quotes },
      null,
      2
    );
    await ensureFolder();
    const date = new Date().toISOString().split('T')[0];
    const path = APP_FOLDER + `backup_${date}.json`;
    await FileSystem.writeAsStringAsync(path, backup, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'SayedEzzat Backup' });
    }
  } catch {
    Alert.alert('خطأ', 'فشل في تصدير النسخة الاحتياطية');
  }
}

export async function importBackup(): Promise<{ artworks: Artwork[]; customers: Customer[]; quotes: Quote[] } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return null;
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const data = JSON.parse(content);
    if (!Array.isArray(data.artworks) || !Array.isArray(data.customers) || !Array.isArray(data.quotes)) {
      Alert.alert('خطأ', 'الملف غير صالح أو تالف');
      return null;
    }
    return { artworks: data.artworks, customers: data.customers, quotes: data.quotes };
  } catch {
    Alert.alert('خطأ', 'فشل في قراءة الملف');
    return null;
  }
}
