export const COMMUNITY_CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: 'apps' },
  { id: 'teknoloji', label: 'Yazılım/Teknoloji', icon: 'code-working' },
  { id: 'kultur', label: 'Kültür/Sanat', icon: 'musical-notes' },
  { id: 'spor', label: 'Spor', icon: 'basketball' },
  { id: 'muzik', label: 'Müzik', icon: 'musical-note' },
];

export const COMMUNITIES_DATA = [
  {
    id: '1',
    communityName: 'Trakya Yazılım Kulübü',
    communityShortName: 'TYK',
    title: 'Mobil Uygulama & Coffee Break',
    description: 'React Native ve Expo ile mobil geliştirmeye giriş. Kahve eşliğinde kod sohbeti.',
    category: 'teknoloji',
    location: 'Ayşekadın - Kafka Cafe',
    time: '16:00 - 18:00',
    date: '14 Ekim Çarşamba',
    attendeesCount: 24,
    badge: 'Güncel',
    communityColor: '#2563EB',
    communityIcon: 'code-working',
    coordinates: { lat: 41.6771, lng: 26.5556 },
  },
  {
    id: '2',
    communityName: 'TÜSOT - Trakya Sosyal',
    communityShortName: 'TÜSOT',
    title: 'Haftalık Tanışma & Kahve Buluşması',
    description: 'Yeni dönem için tanışma buluşması. Topluluk faaliyetleri ve proje fikirleri.',
    category: 'kultur',
    location: 'Balkan Yerleşkesi - Sosyal Tesisler',
    time: '14:30 - 16:30',
    date: '15 Ekim Perşembe',
    attendeesCount: 42,
    badge: 'Yakında',
    communityColor: '#D97706',
    communityIcon: 'people-circle',
    coordinates: { lat: 41.6652, lng: 26.5421 },
  },
  {
    id: '3',
    communityName: 'IEEE Trakya Öğrenci Kolu',
    communityShortName: 'IEEE',
    title: 'PCB Tasarım & Donanım Atölyesi',
    description: 'KiCad ile PCB tasarımına giriş. Temel elektronik bileşenler ve üretim süreci.',
    category: 'teknoloji',
    location: 'Mühendislik Fakültesi - Lab 304',
    time: '10:00 - 14:00',
    date: '18 Ekim Pazar',
    attendeesCount: 18,
    badge: 'Kayıt Doldu',
    communityColor: '#059669',
    communityIcon: 'hardware-chip',
    coordinates: { lat: 41.6712, lng: 26.5589 },
  },
  {
    id: '4',
    communityName: 'Trakya Spor Topluluğu',
    communityShortName: 'TST',
    title: 'Yoga & Mindfulness Seansı',
    description: 'Sınav stresini atmak için haftalık yoga ve nefes egzersizleri. Her seviye uygun.',
    category: 'spor',
    location: 'Balkan Yerleşkesi - Spor Salonu',
    time: '18:00 - 19:30',
    date: 'Her Salı',
    attendeesCount: 35,
    badge: 'Düzenli',
    communityColor: '#DC2626',
    communityIcon: 'body',
    coordinates: { lat: 41.6652, lng: 26.5421 },
  },
  {
    id: '5',
    communityName: 'Trakya Müzik Topluluğu',
    communityShortName: 'TMT',
    title: 'Akustik Gecesi & Açık Mikrofon',
    description: 'Enstrümanını getir, şarkını söyle. İster dinle ister performans ver.',
    category: 'muzik',
    location: 'Karaağaç Kampüsü - Amfi',
    time: '19:00 - 22:00',
    date: '20 Ekim Cuma',
    attendeesCount: 67,
    badge: 'Açık',
    communityColor: '#7C3AED',
    communityIcon: 'musical-note',
    coordinates: { lat: 41.6823, lng: 26.5612 },
  },
  {
    id: '6',
    communityName: 'GDSC Trakya (Google Developer Student Clubs)',
    communityShortName: 'GDSC',
    title: 'Flutter & Firebase Hackathon Hazırlığı',
    description: 'Hackathon için ekip bulma, fikir geliştirme ve teknik mentorluk.',
    category: 'teknoloji',
    location: 'Ayşekadın - Cafe Gradus',
    time: '13:00 - 17:00',
    date: '25 Ekim Cumartesi',
    attendeesCount: 31,
    badge: 'Kayıt Açık',
    communityColor: '#4285F4',
    communityIcon: 'logo-flutter',
    coordinates: { lat: 41.6771, lng: 26.5556 },
  },
  {
    id: '7',
    communityName: 'Trakya Fotoğraf Çevresi',
    communityShortName: 'TFC',
    title: 'Şehir Fotoğrafları & Edit Atölyesi',
    description: 'Edirne sokaklarında fotoğraf çekimi sonrası Lightroom/Photoshop edit çalışması.',
    category: 'kultur',
    location: 'Karaağaç - Tarihi Gar Binası',
    time: '15:00 - 18:00',
    date: '26 Ekim Pazar',
    attendeesCount: 15,
    badge: 'Sınırlı',
    communityColor: '#EC4899',
    communityIcon: 'camera',
    coordinates: { lat: 41.6823, lng: 26.5612 },
  },
  {
    id: '8',
    communityName: 'Trakya Girişimcilik Kulübü',
    communityShortName: 'TEK',
    title: 'Startup Idea Validation Workshop',
    description: 'Fikrinizi test edin, MVP oluşturun, yatırımcıya sunum yapın. Mentor eşliğinde.',
    category: 'teknoloji',
    location: 'Balkan Yerleşkesi - Konferans Salonu',
    time: '10:00 - 16:00',
    date: '2 Kasım Cumartesi',
    attendeesCount: 48,
    badge: 'Kayıt Açık',
    communityColor: '#0891B2',
    communityIcon: 'rocket',
    coordinates: { lat: 41.6652, lng: 26.5421 },
  },
];

// Kategori ID'lerine göre Türkçe etiket
export const getCategoryLabel = (categoryId) => {
  const cat = COMMUNITY_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.label : categoryId;
};

// Kategori rengi (filtre çipleri için)
export const getCategoryColor = (categoryId) => {
  const colors = {
    teknoloji: '#2563EB',
    kultur: '#D97706',
    spor: '#DC2626',
    muzik: '#7C3AED',
    all: '#64748B',
  };
  return colors[categoryId] || colors.all;
};

// Topluluk tanıtım metinleri (Bilgi Al modalı için) - etkinlik id'sine göre
export const COMMUNITY_ABOUT = {
  '1': "Trakya Yazılım Kulübü olarak modern yazılım projeleri geliştiriyor, haftalık kod buluşmaları ve kahve eşliğinde teknik sohbetler düzenliyoruz. Mobil uygulama, web ve yapay zeka alanlarında kendini geliştirmek isteyen herkese kapımız açık; dönem sonunda birlikte bir hackathon düzenlemeyi hedefliyoruz.",
  '2': "TÜSOT, Trakya'nın en kalabalık sosyal topluluklarından biri. Amacımız kampüs hayatını dersliklerin dışına taşımak: tanışma buluşmaları, şehir gezileri, film geceleri ve gönüllülük projeleriyle Edirne'de unutulmaz bir öğrencilik yaşatmak.",
  '3': "IEEE Trakya Öğrenci Kolu olarak mühendisliğin mutfağındayız: PCB tasarımı, gömülü sistemler ve robotik atölyeleri düzenliyor, üyelerimizi ulusal yarışmalara hazırlıyoruz. Donanıma meraklıysan laboratuvarımızda sana da bir lehim masası hazır.",
  '4': "Trakya Spor Topluluğu ile ders stresini sahada atıyoruz. Haftalık yoga ve mindfulness seanslarının yanı sıra halı saha maçları, doğa yürüyüşleri ve koşu gruplarımız var. Seviyen ne olursa olsun, hareket etmek isteyen herkes davetli.",
  '5': "Trakya Müzik Topluluğu, kampüsün ritmini tutuyor. Akustik geceler, açık mikrofon etkinlikleri ve dönem sonu konserleriyle hem dinleyip hem çalabileceğin sıcak bir ortam sunuyoruz. Enstrümanın yoksa bile koromuza katılabilirsin.",
  '6': "GDSC Trakya (Google Developer Student Clubs) ile Google teknolojilerini öğreniyor, Flutter ve Firebase odaklı atölyeler düzenliyoruz. Hackathon takımları kuruyor, global Solution Challenge'a birlikte hazırlanıyoruz. Kodlamaya yeni başlayanlar için mentörlük programımız mevcut.",
  '7': "Trakya Fotoğraf Çevresi olarak Edirne'nin ışığını yakalıyoruz: tarihi sokaklarda fotoğraf yürüyüşleri, portre çalışmaları ve Lightroom edit atölyeleri yapıyoruz. Telefonla da profesyonel makineyle de katılabilirsin, önemli olan bakış açın.",
  '8': "Trakya Girişimcilik Kulübü, fikri olanla yol haritası arayanı buluşturuyor. Fikir doğrulama atölyeleri, MVP sprintleri ve yatırımcı sunumlarıyla öğrencileri startup dünyasına hazırlıyoruz. Dönem sonunda demo günü sahnesi seni bekliyor.",
};

export function getCommunityAbout(event) {
  if (event && COMMUNITY_ABOUT[event.id]) return COMMUNITY_ABOUT[event.id];
  return `${event?.communityName || 'Bu topluluk'} olarak düzenli buluşmalar, atölyeler ve sosyal etkinlikler düzenliyor, kampüs hayatını birlikte güzelleştiriyoruz.`;
}