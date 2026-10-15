/**
 * Edirne ETUS Akıllı Ulaşım & Doğal Dil (Fuzzy Matching) İşleme Motoru
 * Yazım hatalarını, harf eksikliklerini ve devrik Türkçe cümleleri tolere eder.
 */

// 1. Türkçe karakterleri sadeleştirme
export function normalizeTurkish(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ') // Kesme ve noktalama işaretlerini boşluğa çevir
    .replace(/\s+/g, ' ')
    .trim();
}

// 2. Levenshtein edit distance hesaplama
export function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 3. İki kelime arasındaki benzerlik oranı (0.0 - 1.0)
export function wordSimilarity(w1, w2) {
  if (!w1 || !w2) return 0;
  if (w1 === w2) return 1.0;

  // Kısa kelimelerde (<= 3 karakter) alt dize eşleşmesi güvenli değildir
  if (w1.length <= 3 || w2.length <= 3) {
    if (w1 === w2) return 1.0;
    return 0;
  }

  // Biri diğerinin başlangıcı ise (örn: balkan -> balkana)
  if (w1.startsWith(w2) || w2.startsWith(w1)) {
    const minLen = Math.min(w1.length, w2.length);
    const maxLen = Math.max(w1.length, w2.length);
    if (maxLen - minLen <= 3) {
      return 0.92;
    }
  }

  const maxLen = Math.max(w1.length, w2.length);
  const dist = levenshteinDistance(w1, w2);
  return 1 - dist / maxLen;
}

// 4. Edirne Noktaları Sözlüğü ve Yazım Hatası Tolerans Kelimeleri
export const EDIRNE_LOCATIONS = [
  {
    id: 'balkan',
    displayName: 'Balkan Yerleşkesi (Rektörlük & Fakülteler)',
    keywords: [
      'balkan', 'blkn', 'balkn', 'bolkan', 'balkane',
      'kampus', 'kmps', 'kmpus', 'rektorluk', 'muhendislik', 'mhnds',
      'iibf', 'merkezi derslik', 'merkezi derslikler', 'fen edebiyat',
      'kongre merkezi', 'balkan yerleskesi', 'balkan yoli', 'balkan yolu'
    ],
  },
  {
    id: 'aysekadin',
    displayName: 'Ayşekadın Yerleşkesi',
    keywords: [
      'aysekadin', 'ayskdn', 'aysekadn', 'ayse kadin', 'aysekadına',
      'asekadn', 'ubiyo', 'saglik myo', 'aysekadin karakol',
      'universite caddesi', 'ayse kadin yerleskesi'
    ],
  },
  {
    id: 'karaagac',
    displayName: 'Karaağaç Yerleşkesi (GSF & Lozan)',
    keywords: [
      'karaagac', 'kragac', 'kargac', 'krgc', 'karagac', 'kara agac',
      'gsf', 'guzel sanatlar', 'lozan', 'lozan aniti', 'tarihi gar',
      'meric', 'meric koprusu', 'pazarkule'
    ],
  },
  {
    id: 'tip',
    displayName: 'Trakya Üni. Tıp Fakültesi Hastanesi',
    keywords: [
      'tip', 'tip fakultesi', 'hastane', 'hstn', 'arastirma hastanesi',
      'poliklinik', 'saglik bilimleri'
    ],
  },
  {
    id: 'carsi',
    displayName: 'Saraçlar Caddesi / Şehir Merkezi (Selimiye)',
    keywords: [
      'carsi', 'crsi', 'saraclar', 'srclr', 'saraclr',
      'selimiye', 'merkez', 'heykel', 'eski cami', 'bedesten', 'alipasa', 'kaleici'
    ],
  },
  {
    id: 'otogar',
    displayName: 'Edirne Şehirlerarası Otogar',
    keywords: [
      'otogar', 'otgr', 'terminal', 'trmnl', 'sehirlerarasi', 'otobus terminali'
    ],
  },
  {
    id: 'kyk',
    displayName: 'KYK Öğrenci Yurtları (Sultan Çelebi / Selimiye)',
    keywords: [
      'kyk', 'yurt', 'yurtlar', 'sultan celebi', 'sultancelebi',
      'balkan kiz yurdu', 'selimiye kyk', 'erkek yurdu', 'kiz yurdu'
    ],
  },
  {
    id: 'pazartesi_pazari',
    displayName: 'Pazartesi Pazarı',
    keywords: [
      'pazartesi pazari', 'pzrtsi pzr', 'semt pazari', 'pazartesi'
    ],
  },
  {
    id: 'tren_gari',
    displayName: 'Edirne Tren Garı',
    keywords: [
      'tren gari', 'istasyon', 'gar', 'hizli tren'
    ],
  },
  {
    id: 'sukrupasa',
    displayName: 'Şükrüpaşa Mahallesi',
    keywords: [
      'sukrupasa', 'skrps', 'sukru pasa'
    ],
  },
];

// Türkçe yön ekleri analizi (-den / -dan => Çıkış, -e / -a => Hedef)
const ORIGIN_SUFFIXES = ['den', 'dan', 'ten', 'tan', 'nden', 'ndan'];
const DEST_SUFFIXES = ['e', 'a', 'ye', 'ya', 'ne', 'na'];

function checkSuffix(word, suffixes) {
  if (!word) return false;
  return suffixes.some((s) => word.endsWith(s) && word.length > s.length + 1);
}

function stripSuffix(word) {
  const all = [...ORIGIN_SUFFIXES, ...DEST_SUFFIXES];
  for (const s of all) {
    if (word.endsWith(s) && word.length > s.length + 1) {
      return word.slice(0, -s.length);
    }
  }
  return word;
}

/**
 * Kullanıcı cümlesinden lokasyonları ve yönü fuzzy olarak çıkarır
 */
export function extractLocationsFromQuery(query) {
  const normalized = normalizeTurkish(query);
  const words = normalized.split(' ').filter(Boolean);

  let candidates = [];

  // Her kelime veya ardışık 2 kelime için en iyi lokasyon eşleşmesini bul
  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const strippedWord = stripSuffix(rawWord);
    const twoWordPhrase = i < words.length - 1 ? `${rawWord} ${words[i + 1]}` : null;

    let wordOriginRole = 'unknown';
    if (checkSuffix(rawWord, ORIGIN_SUFFIXES)) {
      wordOriginRole = 'origin';
    } else if (checkSuffix(rawWord, DEST_SUFFIXES)) {
      wordOriginRole = 'destination';
    }

    for (const loc of EDIRNE_LOCATIONS) {
      let maxScore = 0;
      let matchedKw = '';

      for (const kw of loc.keywords) {
        const kwNorm = normalizeTurkish(kw);

        // Tam kelime / kalıp eşleşmesi
        if (twoWordPhrase && twoWordPhrase === kwNorm) {
          maxScore = 1.0;
          matchedKw = kw;
          break;
        }
        if (rawWord === kwNorm || strippedWord === kwNorm) {
          maxScore = 1.0;
          matchedKw = kw;
          break;
        }

        // Fuzzy benzerlik (tekil kelime)
        const sim1 = wordSimilarity(rawWord, kwNorm);
        const sim2 = wordSimilarity(strippedWord, kwNorm);
        const sim = Math.max(sim1, sim2);

        if (sim > maxScore) {
          maxScore = sim;
          matchedKw = kw;
        }
      }

      // Eşik: %72 ve üstü
      if (maxScore >= 0.72) {
        candidates.push({
          locId: loc.id,
          displayName: loc.displayName,
          score: Math.round(maxScore * 100),
          tokenIndex: i,
          tokenText: rawWord,
          role: wordOriginRole,
        });
      }
    }
  }

  // Skora göre sırala
  candidates.sort((a, b) => b.score - a.score);

  // Aynı kelimeye atanmış çoklu adayları ve aynı lokasyonu filtrele
  const usedTokens = new Set();
  const matchedLocs = [];
  const seenLocIds = new Set();

  for (const c of candidates) {
    if (!usedTokens.has(c.tokenIndex) && !seenLocIds.has(c.locId)) {
      usedTokens.add(c.tokenIndex);
      seenLocIds.add(c.locId);
      matchedLocs.push(c);
      if (matchedLocs.length === 2) break;
    }
  }

  let origin = null;
  let destination = null;

  if (matchedLocs.length === 2) {
    const [c1, c2] = matchedLocs;
    if (c1.role === 'origin') {
      origin = c1;
      destination = c2;
    } else if (c2.role === 'origin') {
      origin = c2;
      destination = c1;
    } else if (c1.role === 'destination') {
      destination = c1;
      origin = c2;
    } else if (c2.role === 'destination') {
      destination = c2;
      origin = c1;
    } else {
      // Cümle içi sıralamaya göre: önce gelen genellikle origin (Örn: "kragac balkan yoli")
      if (c1.tokenIndex < c2.tokenIndex) {
        origin = c1;
        destination = c2;
      } else {
        origin = c2;
        destination = c1;
      }
    }
  } else if (matchedLocs.length === 1) {
    const single = matchedLocs[0];
    if (single.role === 'origin') {
      origin = single;
    } else {
      // "balkana nasıl giderim" -> hedef Balkan
      destination = single;
    }
  }

  return { origin, destination, matches: matchedLocs };
}

/**
 * Mini AI Ulaşım Mantığı ve Yanıt Oluşturucu
 */
export function queryTransitAI(userPrompt) {
  if (!userPrompt || userPrompt.trim().length < 2) {
    return {
      success: false,
      message: 'Lütfen nereden nereye gitmek istediğinizi yazın (Örn: "kragac balkan yoli" veya "pazartesi pazarindan kykya").',
    };
  }

  const { origin, destination } = extractLocationsFromQuery(userPrompt);

  if (!origin && !destination) {
    return {
      success: false,
      message:
        'Cümlenizden güzergah noktalarını tam çıkaramadım. 🤔\n\nÖrnek arama kalıpları:\n• "Karaağaç\'tan Balkan\'a nasıl gidilir?"\n• "Pazartesi pazarından KYK\'ya otobüs var mı?"\n• "Otogardan Ayşekadın Kampüsüne"\n• "Çarşıdan Tıp Fakültesi Hastanesine"',
      suggestions: [
        "Karaağaç'tan Balkan Yerleşkesine",
        "Pazartesi pazarından KYK yurduna",
        'Otogardan Ayşekadına hangi hat gider?',
        'Çarşıdan Tıp Fakültesine nasıl gidilir?',
      ],
    };
  }

  // Yalnızca 1 lokasyon tespit edilmişse
  if (!origin && destination) {
    return generateSingleLocationResponse(destination, 'destination');
  }
  if (origin && !destination) {
    return generateSingleLocationResponse(origin, 'origin');
  }

  // İki lokasyon da tespit edilmişse nokta atışı rota
  return generateRouteResponse(origin, destination, userPrompt);
}

function generateRouteResponse(origin, destination, originalPrompt) {
  const oId = origin.locId;
  const dId = destination.locId;

  if (oId === dId) {
    return {
      success: true,
      origin,
      destination,
      title: 'Aynı Bölgedesiniz',
      recommendedLines: ['Yürüyüş'],
      duration: '3 - 5 dk (Yürüyerek)',
      fare: '0 ₺',
      summary: `Belirttiğiniz iki nokta da **${origin.displayName}** bölgesinde. Yürüyüş mesafesindesiniz, otobüse gerek yok!`,
      steps: ['Bulunduğunuz yerden yürüyüş yolunu takip ederek 5 dakikada ulaşabilirsiniz.'],
    };
  }

  // 1. Karaağaç Rotaları
  if (oId === 'karaagac' || dId === 'karaagac') {
    const isToKaraagac = dId === 'karaagac';
    return {
      success: true,
      origin,
      destination,
      title: '7A Karaağaç - Kampüs Hattı',
      recommendedLines: ['7A'],
      duration: oId === 'balkan' || dId === 'balkan' ? '25 - 30 dakika' : '15 - 20 dakika',
      fare: '16.50 ₺ (Öğrenci Kentkart)',
      summary: `Yapay zeka analizine göre **${origin.displayName}** ile **${destination.displayName}** arasındaki en direkt hat **7A** numaralı otobüstür.`,
      steps: [
        isToKaraagac
          ? 'Balkan Yerleşkesi veya Ayşekadın durağından 7A Karaağaç aracına binin.'
          : 'Karaağaç Tarihi Gar (GSF) veya Lozan Anıtı durağından 7A aracına binin.',
        'Araç tarihi Meriç & Tunca köprüleri ve Çarşı güzergahından geçer.',
        `${destination.displayName} durağında inin.`,
      ],
      transferTip: 'Her 12-15 dakikada bir sefer vardır. Son araç yaklaşık 23:30’dur.',
    };
  }

  // 2. Otogar Rotaları
  if (oId === 'otogar' || dId === 'otogar') {
    return {
      success: true,
      origin,
      destination,
      title: '1A & 5B Otogar - Kampüs Hatları',
      recommendedLines: ['1A', '5B'],
      duration: '20 - 25 dakika',
      fare: '16.50 ₺ (Öğrenci Kentkart)',
      summary: `Otogar ile **${destination.displayName}** arasında en sık çalışan hatlar **1A** ve **5B Ekspres** araçlarıdır.`,
      steps: [
        oId === 'otogar'
          ? 'Otogar ana peronundan 1A veya 5B nolu araca binin.'
          : 'Bulunduğunuz duraktan Otogar yönündeki 1A veya 5B aracına binin.',
        'Şükrüpaşa ve Ayşekadın caddesini takiben doğrudan ulaşır.',
        'Hedef durakta inebilirsiniz.',
      ],
      transferTip: 'Her 6-8 dakikada bir araç geçer. Gece 00:30’a kadar ring seferleri devam eder.',
    };
  }

  // 3. Pazartesi Pazarı Rotaları
  if (oId === 'pazartesi_pazari' || dId === 'pazartesi_pazari') {
    return {
      success: true,
      origin,
      destination,
      title: '3A & 1A Pazartesi Pazarı Güzergahı',
      recommendedLines: ['3A', '1A'],
      duration: '12 - 18 dakika',
      fare: '16.50 ₺ (Öğrenci Kentkart)',
      summary: `Pazartesi Pazarı ile **${destination.displayName}** arasında **3A** veya **1A** hatları en pratik seçimdir.`,
      steps: [
        'Pazar çıkışındaki ana cadde durağına geçin.',
        '3A numaralı ETUS otobüsüne binin.',
        `${destination.displayName} durağında inin.`,
      ],
      transferTip: 'Pazar günleri ve pazartesi günleri seferler yoğun olduğu için 1A alternatiftir.',
    };
  }

  // 4. KYK Yurtları Rotaları
  if (oId === 'kyk' || dId === 'kyk') {
    return {
      success: true,
      origin,
      destination,
      title: '1A & 5B KYK Yurtları Bağlantısı',
      recommendedLines: ['1A', '5B'],
      duration: '10 - 15 dakika',
      fare: '16.50 ₺ (Öğrenci Kentkart)',
      summary: `KYK Sultan Çelebi / Balkan Kız Yurdu ile **${destination.displayName}** arasında **1A** ve **5B** araçları ring yapmaktadır.`,
      steps: [
        'Yurt nizamiyesi önündeki ETUS durağından 1A ya da 5B otobüsüne binin.',
        'Tıp Fakültesi ve Balkan Yerleşkesi derslikler aksından geçer.',
        `${destination.displayName} durağında inin.`,
      ],
      transferTip: 'Sabah ders saatlerinde (08:15-09:00) ek öğrenci seferleri çalışır.',
    };
  }

  // 5. Balkan - Ayşekadın - Çarşı - Tıp
  return {
    success: true,
    origin,
    destination,
    title: '1A & 3A Ana Arter Kampüs Hattı',
    recommendedLines: ['1A', '3A'],
    duration: '10 - 15 dakika',
    fare: '16.50 ₺ (Öğrenci Kentkart)',
    summary: `**${origin.displayName}** ile **${destination.displayName}** arasında en hızlı ulaşım **1A** veya **3A** otobüsleri iledir.`,
    steps: [
      'Bulunduğunuz caddedeki en yakın durağa geçin.',
      '1A veya 3A numaralı araca binin (her 5-7 dakikada bir geçer).',
      `${destination.displayName} durağında inin.`,
    ],
    transferTip: 'En sık sefer yapan hat 1A’dır.',
  };
}

function generateSingleLocationResponse(location, type) {
  const isDest = type === 'destination';
  return {
    success: true,
    origin: isDest ? null : location,
    destination: isDest ? location : null,
    title: `${location.displayName} Ulaşım Rehberi`,
    recommendedLines: ['1A', '3A', '7A'],
    duration: 'Ortalama 10 - 15 dakika',
    fare: '16.50 ₺ (Öğrenci)',
    summary: `Yapay Zeka Analizi: **${location.displayName}** konumuna Edirne'nin merkezinden ve fakültelerden **1A**, **3A** ve **7A** hatlarıyla kolayca ulaşabilirsiniz.`,
    steps: [
      'Bulunduğunuz ana cadde durağından 1A veya 3A numaralı araca binebilirsiniz.',
      'Karaağaç bölgesinden geliyorsanız 7A hattı doğrudan ulaşım sağlar.',
    ],
    transferTip: 'Tam nereden bineceğinizi yazarsanız (Örn: "kragactan balkana" veya "otogardan ayskdna") size nokta atışı hat ve durak verebilirim! 💡',
  };
}
