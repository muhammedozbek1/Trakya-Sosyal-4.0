export const LOCATIONS = [
  { id: 'balkan', name: 'Balkan Yerleşkesi (Mühendislik, İİBF, Fen)', zone: 'Kampüs' },
  { id: 'tip', name: 'Trakya Üni. Tıp Fakültesi Hastanesi', zone: 'Sağlık' },
  { id: 'aysekadin', name: 'Ayşekadın Yerleşkesi', zone: 'Kampüs' },
  { id: 'karaagac', name: 'Karaağaç Yerleşkesi (Güzel Sanatlar Fak.)', zone: 'Kampüs' },
  { id: 'carsi', name: 'Saraçlar Caddesi / Şehir Merkezi (Selimiye)', zone: 'Merkez' },
  { id: 'otogar', name: 'Edirne Şehirlerarası Otogar', zone: 'Ulaşım' },
  { id: 'kyk_balkan', name: 'KYK Sultan Çelebi / Balkan Kız Yurdu', zone: 'Yurt' },
  { id: 'kyk_selimiye', name: 'KYK Selimiye Erkek Öğrenci Yurdu', zone: 'Yurt' },
  { id: 'tren_gari', name: 'Edirne Tren Garı', zone: 'Ulaşım' },
];

export const ETUS_LINES = [
  {
    code: '1A',
    name: 'Otogar - Çarşı - Ayşekadın - Balkan Yerleşkesi',
    direction: 'Çift Yönlü Ring',
    frequency: 'Her 6-8 dakikada bir',
    color: '#2563EB',
    workingHours: '06:30 - 00:30',
    stops: [
      'Edirne Otogarı',
      'Şükrüpaşa Mah.',
      'Ayşekadın Karakol',
      'Ayşekadın Kampüsü',
      'Saraçlar Çarşı',
      'Tıp Fakültesi',
      'Balkan Yerleşkesi Rektörlük',
      'Mühendislik Fakültesi',
    ],
  },
  {
    code: '3A',
    name: 'Yeni İmaret - Çarşı - Ayşekadın - Tıp - Balkan Kampüs',
    direction: 'Balkan Yerleşkesi İstikameti',
    frequency: 'Her 10 dakikada bir',
    color: '#059669',
    workingHours: '06:45 - 23:45',
    stops: [
      'Yeni İmaret',
      'Yıldırım Beyazıt',
      'Selimiye Devlet Hastanesi',
      'Saraçlar',
      'Ayşekadın',
      'Tıp Fakültesi Hastanesi',
      'Balkan Merkezi Derslikler',
    ],
  },
  {
    code: '7A',
    name: 'Karaağaç (GSF) - Lozan - Çarşı - Ayşekadın - Balkan',
    direction: 'Karaağaç - Kampüs Hattı',
    frequency: 'Her 15 dakikada bir',
    color: '#D97706',
    workingHours: '07:00 - 23:30',
    stops: [
      'Karaağaç Son Durak',
      'Tarihi Gar (GSF Yerleşkesi)',
      'Lozan Anıtı',
      'Meriç Köprüsü',
      'Saraçlar Caddesi',
      'Ayşekadın',
      'Balkan Yerleşkesi',
    ],
  },
  {
    code: '5B',
    name: 'Otogar - Sanayi - Tıp Fakültesi - Balkan Ekspres',
    direction: 'Hızlı Kampüs Ekspresi',
    frequency: 'Her 12 dakikada bir',
    color: '#7C3AED',
    workingHours: '07:15 - 22:30',
    stops: [
      'Otogar',
      'Sanayi Kavşağı',
      'KYK Sultan Çelebi',
      'Tıp Fakültesi Poliklinikler',
      'Balkan Kongre Merkezi',
    ],
  },
  {
    code: '2A',
    name: 'Gazimihal - Çarşı - Ayşekadın - Kırkpınar',
    direction: 'Şehir İçi',
    frequency: 'Her 10 dakikada bir',
    color: '#DC2626',
    workingHours: '06:45 - 23:15',
    stops: [
      'Gazimihal Köprüsü',
      'Saraçlar',
      'Eski Cami',
      'Ayşekadın',
      'Kırkpınar Er Meydanı',
    ],
  },
];

// Nereden Nereye Rehberi için Rota Eşleştirme Fonksiyonu
export function findRoute(fromId, toId) {
  if (!fromId || !toId) return null;
  if (fromId === toId) {
    return {
      sameLocation: true,
      message: 'Aynı noktayı seçtiniz. Yürüyüş mesafesindesiniz (0 dk).',
    };
  }

  // Karaağaç içeren rotalar
  if (fromId === 'karaagac' || toId === 'karaagac') {
    return {
      line: '7A',
      title: '7A Karaağaç - Şehir - Balkan Hattı',
      duration: fromId === 'balkan' || toId === 'balkan' ? '30 - 35 dk' : '15 - 20 dk',
      fare: '16.50 ₺ (İndirimli Öğrenci)',
      steps: [
        'En yakın duraktan 7A Karaağaç otobüsüne binin.',
        'Tarihi Meriç ve Tunca köprüleri güzergahından geçer.',
        'Saraçlar veya Ayşekadın üzerinden varış noktanızdaki durakta inin.',
      ],
      alternatives: ['Çarşı merkezine geçip 1A hattına aktarma yapabilirsiniz.'],
    };
  }

  // Otogar rotaları
  if (fromId === 'otogar' || toId === 'otogar') {
    return {
      line: '1A veya 5B',
      title: '1A ve 5B Kampüs - Otogar Hattı',
      duration: '20 - 25 dk',
      fare: '16.50 ₺ (İndirimli Öğrenci)',
      steps: [
        'Otogar çıkışındaki ETUS ana peronundan 1A veya 5B numaralı araca binin.',
        'Şükrüpaşa ve Ayşekadın caddesini takip eder.',
        'Tıp Fakültesi veya Balkan Yerleşkesi nizamiye durağında inin.',
      ],
      alternatives: ['3A hattı ile Çarşı üzerinden aktarmasız ulaşım.'],
    };
  }

  // Balkan ve Ayşekadın arası
  if ((fromId === 'balkan' && toId === 'aysekadin') || (fromId === 'aysekadin' && toId === 'balkan')) {
    return {
      line: '1A, 3A veya 7A',
      title: '1A / 3A / 7A Kampüsler Arası Hat',
      duration: '8 - 12 dk',
      fare: '16.50 ₺ (İndirimli Öğrenci)',
      steps: [
        'Ayşekadın Karakolu önündeki duraktan 1A veya 3A aracına binin.',
        'Doğrudan Balkan Yerleşkesi girişine kadar kesintisiz seyahat edin.',
        'Mühendislik / İİBF / Merkezi Derslikler duraklarında inin.',
      ],
      alternatives: ['Hava güzelse yürüyüş veya bisiklet yolu ile ~20 dk.'],
    };
  }

  // KYK yurtları
  if (fromId.includes('kyk') || toId.includes('kyk')) {
    return {
      line: '1A veya 5B',
      title: '1A / 5B Yurtlar & Kampüs Hattı',
      duration: '10 - 15 dk',
      fare: '16.50 ₺ (İndirimli Öğrenci)',
      steps: [
        'Yurt kapısı önündeki ETUS durağından 1A ya da 5B otobüsüne binin.',
        'Doğrudan Tıp Fakültesi ve Balkan Yerleşkesi derslikler bölgesine ulaşır.',
      ],
      alternatives: ['Her 5-7 dakikada bir araç geçer.'],
    };
  }

  // Genel Şehir Merkezi / Tıp / Diğer
  return {
    line: '1A veya 3A',
    title: '1A / 3A Ana Arter Hattı',
    duration: '12 - 18 dk',
    fare: '16.50 ₺ (İndirimli Öğrenci)',
    steps: [
      'Bulunduğunuz konumdaki en yakın ana cadde durağından 1A veya 3A otobüsüne binin.',
      'Edirne merkez ana güzergahı boyunca devam eder.',
      'Hedef durağınızda güvenle inin.',
    ],
    alternatives: ['Taksi alternatifi: Yaklaşık 80-110 ₺.'],
  };
}
