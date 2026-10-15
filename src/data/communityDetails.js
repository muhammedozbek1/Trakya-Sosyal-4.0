/**
 * Topluluk detay sayfası için mock veriler:
 * moderatörler, üyeler ve örnek sohbet mesajları.
 * Backend hazır olana kadar deterministik (event id'ye göre) üretilir.
 */

const FIRST_NAMES = [
  'Zeynep', 'Emre', 'Elif', 'Mert', 'Selin', 'Burak', 'Ayşe', 'Can',
  'Deniz', 'Ege', 'Fatma', 'Kerem', 'Melis', 'Onur', 'Pınar', 'Serkan',
];

const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Arslan', 'Koç', 'Kurt',
  'Öztürk', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Aydın', 'Erdoğan',
];

const DEPARTMENTS = [
  'Bilgisayar Mühendisliği - 3. Sınıf',
  'Yazılım Mühendisliği - 2. Sınıf',
  'Elektrik-Elektronik Müh. - 4. Sınıf',
  'Makine Mühendisliği - 1. Sınıf',
  'İşletme - 2. Sınıf',
  'Mimarlık - 3. Sınıf',
  'Tıp Fakültesi - 2. Sınıf',
  'Endüstri Mühendisliği - 4. Sınıf',
];

function hashString(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) % 9973;
  }
  return hash;
}

function pick(arr, seed, offset) {
  return arr[(seed + offset * 7) % arr.length];
}

/**
 * Topluluk moderatörleri (başkan + yardımcı + moderatör)
 */
export function getCommunityModerators(event) {
  const seed = hashString(event?.id);
  const color = event?.communityColor || '#1E4DB7';
  return [
    {
      id: `mod-president-${event?.id}`,
      name: `${pick(FIRST_NAMES, seed, 1)} ${pick(LAST_NAMES, seed, 2)}`,
      department: pick(DEPARTMENTS, seed, 3),
      role: 'Topluluk Başkanı',
      isModerator: true,
      color,
    },
    {
      id: `mod-vice-${event?.id}`,
      name: `${pick(FIRST_NAMES, seed, 4)} ${pick(LAST_NAMES, seed, 5)}`,
      department: pick(DEPARTMENTS, seed, 6),
      role: 'Başkan Yardımcısı',
      isModerator: true,
      color,
    },
    {
      id: `mod-event-${event?.id}`,
      name: `${pick(FIRST_NAMES, seed, 7)} ${pick(LAST_NAMES, seed, 8)}`,
      department: pick(DEPARTMENTS, seed, 9),
      role: 'Etkinlik Moderatörü',
      isModerator: true,
      color,
    },
  ];
}

/**
 * Katılan üyeler listesi (6 kişi)
 */
export function getCommunityMembers(event) {
  const seed = hashString(event?.id);
  const color = event?.communityColor || '#1E4DB7';
  const members = [];
  for (let i = 0; i < 6; i++) {
    members.push({
      id: `member-${event?.id}-${i}`,
      name: `${pick(FIRST_NAMES, seed, 10 + i)} ${pick(LAST_NAMES, seed, 12 + i)}`,
      department: pick(DEPARTMENTS, seed, 14 + i),
      role: 'Üye',
      isModerator: false,
      color,
    });
  }
  return members;
}

/**
 * Örnek sohbet mesajları
 */
export function getMockChatMessages(event) {
  const seed = hashString(event?.id);
  const title = event?.title || 'etkinlik';
  const location = event?.location || 'belirtilen mekan';
  const mod1 = `${pick(FIRST_NAMES, seed, 1)} ${pick(LAST_NAMES, seed, 2)}`;
  return [
    {
      id: `mock-${event?.id}-1`,
      sender: mod1,
      department: pick(DEPARTMENTS, seed, 3),
      text: `Herkese merhaba! ${title} için son hazırlıkları tamamlıyoruz.`,
      time: '12:30',
      isOwn: false,
      isModerator: true,
    },
    {
      id: `mock-${event?.id}-2`,
      sender: `${pick(FIRST_NAMES, seed, 4)} ${pick(LAST_NAMES, seed, 5)}`,
      department: pick(DEPARTMENTS, seed, 6),
      text: 'Merhaba, ilk kez katılacağım. Yanımda bir şey getirmem gerekiyor mu?',
      time: '12:42',
      isOwn: false,
      isModerator: false,
    },
    {
      id: `mock-${event?.id}-3`,
      sender: mod1,
      department: pick(DEPARTMENTS, seed, 3),
      text: `Hiçbir şey getirmene gerek yok, ${location} buluşuyoruz. Sadece zamanında gelmen yeterli.`,
      time: '12:45',
      isOwn: false,
      isModerator: true,
    },
    {
      id: `mock-${event?.id}-4`,
      sender: `${pick(FIRST_NAMES, seed, 7)} ${pick(LAST_NAMES, seed, 8)}`,
      department: pick(DEPARTMENTS, seed, 9),
      text: 'Kontenjan durumu nedir, arkadaşımı da getirebilir miyim?',
      time: '13:05',
      isOwn: false,
      isModerator: false,
    },
    {
      id: `mock-${event?.id}-5`,
      sender: `${pick(FIRST_NAMES, seed, 10)} ${pick(LAST_NAMES, seed, 12)}`,
      department: pick(DEPARTMENTS, seed, 14),
      text: 'Ben geçen hafta katıldım, ortam çok güzeldi. Kesinlikle gelin!',
      time: '13:20',
      isOwn: false,
      isModerator: false,
    },
  ];
}

/**
 * Avatar için isim baş harfleri
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}