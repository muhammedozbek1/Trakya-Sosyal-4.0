// Trakya Üniversitesi popüler bölüm listesi (otomatik öneri için)
export const DEPARTMENTS = [
  { name: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'Yazılım Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'Makine Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'Endüstri Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'İnşaat Mühendisliği', faculty: 'Mühendislik Fakültesi' },
  { name: 'Mimarlık', faculty: 'Mimarlık Fakültesi' },
  { name: 'Tıp', faculty: 'Tıp Fakültesi' },
  { name: 'Diş Hekimliği', faculty: 'Diş Hekimliği Fakültesi' },
  { name: 'Eczacılık', faculty: 'Eczacılık Fakültesi' },
  { name: 'Hukuk', faculty: 'Hukuk Fakültesi' },
  { name: 'İşletme', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
  { name: 'İktisat', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
  { name: 'Uluslararası İlişkiler', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
  { name: 'Yönetim Bilişim Sistemleri', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
  { name: 'Ebelik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Hemşirelik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Beslenme ve Diyetetik', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Fizyoterapi ve Rehabilitasyon', faculty: 'Sağlık Bilimleri Fakültesi' },
  { name: 'Sınıf Öğretmenliği', faculty: 'Eğitim Fakültesi' },
  { name: 'Okul Öncesi Öğretmenliği', faculty: 'Eğitim Fakültesi' },
  { name: 'Türkçe Öğretmenliği', faculty: 'Eğitim Fakültesi' },
  { name: 'İngilizce Öğretmenliği', faculty: 'Eğitim Fakültesi' },
  { name: 'Psikoloji', faculty: 'Edebiyat Fakültesi' },
  { name: 'Sosyoloji', faculty: 'Edebiyat Fakültesi' },
  { name: 'Tarih', faculty: 'Edebiyat Fakültesi' },
  { name: 'Türk Dili ve Edebiyatı', faculty: 'Edebiyat Fakültesi' },
  { name: 'Matematik', faculty: 'Fen Fakültesi' },
  { name: 'Fizik', faculty: 'Fen Fakültesi' },
  { name: 'Kimya', faculty: 'Fen Fakültesi' },
  { name: 'Biyoloji', faculty: 'Fen Fakültesi' },
  { name: 'Moleküler Biyoloji ve Genetik', faculty: 'Fen Fakültesi' },
  { name: 'İlahiyat', faculty: 'İlahiyat Fakültesi' },
  { name: 'Resim', faculty: 'Güzel Sanatlar Fakültesi' },
  { name: 'Müzik', faculty: 'Devlet Konservatuvarı' },
  { name: 'Beden Eğitimi ve Spor', faculty: 'Spor Bilimleri Fakültesi' },
];

/**
 * Canlı bölüm önerisi: önce "başlayanlar", sonra "içerenler" (en fazla limit adet)
 */
export function searchDepartments(query, limit = 6) {
  const q = (query || '').toLocaleLowerCase('tr').trim();
  if (q.length === 0) return [];
  const starts = [];
  const contains = [];
  for (const dept of DEPARTMENTS) {
    const name = dept.name.toLocaleLowerCase('tr');
    if (name === q) continue; // birebir eşleşmede öneri gösterme
    if (name.startsWith(q)) starts.push(dept);
    else if (name.includes(q)) contains.push(dept);
  }
  return [...starts, ...contains].slice(0, limit);
}