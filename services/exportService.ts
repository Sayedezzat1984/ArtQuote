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

function generateQuoteHTML(quote: Quote, lang: 'ar' | 'en', currency: string): string {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const L = {
    title: isAr ? 'عرض سعر' : 'Price Quote',
    customer: isAr ? 'العميل' : 'Client',
    date: isAr ? 'التاريخ' : 'Date',
    validUntil: isAr ? 'صالح حتى' : 'Valid Until',
    item: isAr ? 'البند' : 'Item',
    qty: isAr ? 'الكمية' : 'Qty',
    price: isAr ? 'السعر' : 'Price',
    itemTotal: isAr ? 'إجمالي البند' : 'Item Total',
    subtotal: isAr ? 'المجموع الفرعي' : 'Subtotal',
    discount: isAr ? 'الخصم' : 'Discount',
    grandTotal: isAr ? 'الإجمالي النهائي' : 'Grand Total',
    notes: isAr ? 'ملاحظات' : 'Notes',
    artistTitle: isAr ? 'فنان تشكيلي' : 'Visual Artist',
  };

  const date = new Date(quote.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
  const validDate = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
    : '';

  const itemRows = quote.items.map(item => `
    <tr>
      <td>${item.title}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:center">${item.price.toLocaleString()} ${currency}</td>
      <td style="text-align:center">${(item.price * item.quantity).toLocaleString()} ${currency}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; direction:${dir}; color:#1a1a22; background:#fff; font-size:14px; }
  .page { max-width:800px; margin:0 auto; padding:36px; }
  .header { background:linear-gradient(135deg,#1a1a22 0%,#252530 100%); border-radius:12px; padding:28px 32px; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
  .brand-name { font-size:28px; font-weight:800; color:#C9A84C; letter-spacing:2px; }
  .brand-sub { font-size:12px; color:#9B9AA5; margin-top:4px; letter-spacing:1px; }
  .quote-info { text-align:${isAr ? 'left' : 'right'}; }
  .quote-label { font-size:10px; color:#9B9AA5; text-transform:uppercase; letter-spacing:1px; }
  .quote-num { font-size:22px; font-weight:800; color:#C9A84C; margin:4px 0; }
  .quote-date { font-size:11px; color:#9B9AA5; margin-top:2px; }
  .section-label { font-size:10px; color:#9B9AA5; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .customer-box { background:#f8f8fb; border-radius:8px; padding:16px 20px; margin-bottom:24px; border-${isAr ? 'right' : 'left'}:4px solid #C9A84C; }
  .customer-name { font-size:20px; font-weight:700; color:#1a1a22; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { background:#1a1a22; color:#C9A84C; padding:10px 14px; font-size:11px; font-weight:600; letter-spacing:0.5px; text-align:${isAr ? 'right' : 'left'}; }
  td { padding:10px 14px; border-bottom:1px solid #f0f0f0; color:#333; text-align:${isAr ? 'right' : 'left'}; }
  tr:nth-child(even) td { background:#f8f8fb; }
  .totals-wrap { display:flex; justify-content:${isAr ? 'flex-start' : 'flex-end'}; }
  .totals { width:300px; background:#f8f8fb; border-radius:8px; padding:18px 20px; }
  .total-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; font-size:13px; color:#666; }
  .total-row.grand { border-top:2px solid #C9A84C; padding-top:10px; margin-top:8px; font-size:17px; font-weight:700; color:#1a1a22; }
  .total-row.grand .val { color:#C9A84C; }
  .notes-box { background:#fffbef; border-radius:8px; padding:14px 18px; margin-top:20px; border-${isAr ? 'right' : 'left'}:4px solid #C9A84C; font-size:13px; color:#555; line-height:1.6; }
  .footer { text-align:center; margin-top:36px; font-size:11px; color:#bbb; letter-spacing:2px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand-name">SAYED EZZAT</div>
      <div class="brand-sub">${L.artistTitle}</div>
    </div>
    <div class="quote-info">
      <div class="quote-label">${L.title}</div>
      <div class="quote-num">${quote.quoteNumber}</div>
      <div class="quote-date">${L.date}: ${date}</div>
      ${validDate ? `<div class="quote-date">${L.validUntil}: ${validDate}</div>` : ''}
    </div>
  </div>

  <div class="section-label">${L.customer}</div>
  <div class="customer-box">
    <div class="customer-name">${quote.customerName}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${L.item}</th>
        <th style="text-align:center">${L.qty}</th>
        <th style="text-align:center">${L.price}</th>
        <th style="text-align:center">${L.itemTotal}</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="total-row"><span>${L.subtotal}</span><span>${quote.subtotal.toLocaleString()} ${currency}</span></div>
      ${quote.discount > 0 ? `<div class="total-row"><span>${L.discount}</span><span>- ${quote.discount.toLocaleString()} ${currency}</span></div>` : ''}
      <div class="total-row grand"><span>${L.grandTotal}</span><span class="val">${quote.total.toLocaleString()} ${currency}</span></div>
    </div>
  </div>

  ${quote.notes ? `<div class="notes-box"><strong>${L.notes}:</strong> ${quote.notes}</div>` : ''}

  <div class="footer">SAYED EZZAT &nbsp;|&nbsp; ${L.artistTitle}</div>
</div>
</body>
</html>`;
}

export async function exportQuoteAsPDF(quote: Quote, lang: 'ar' | 'en', currency: string): Promise<void> {
  try {
    const html = generateQuoteHTML(quote, lang, currency);
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

export async function exportQuoteAsJPG(ref: any, quote: Quote): Promise<void> {
  try {
    const { captureRef } = await import('react-native-view-shot');
    const uri = await captureRef(ref, { format: 'jpg', quality: 0.95 });
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
    await ensureFolder();
    const dest = APP_FOLDER + `${quote.quoteNumber}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: quote.quoteNumber });
    }
  } catch {
    Alert.alert('خطأ', 'فشل في تصدير JPG');
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
