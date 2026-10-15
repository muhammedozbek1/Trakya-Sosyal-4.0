/**
 * Akıllı Ders Programı OCR Motoru — Gemini Vision API ile Gerçek Görsel Analizi
 * Fotoğraftan ders adlarını, günleri, saatleri ve derslik bilgilerini otomatik çıkarır.
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// API Key yönetimi (AsyncStorage tabanlı)
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY_STORAGE_KEY = '@trakya_gemini_api_key';

export async function saveGeminiApiKey(key) {
  await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
}

export async function loadGeminiApiKey() {
  try {
    return await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearGeminiApiKey() {
  await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Örnek şablonlar (API erişimi olmayan durumlarda kullanıcıya gösterilir)
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_TRAKYA_SCHEDULES = [
  {
    name: 'Mühendislik Fakültesi (Bilgisayar Müh. 2. Sınıf)',
    courses: [
      {
        name: 'Algoritmalar ve Veri Yapıları',
        code: 'BM-202',
        day: 'Pazartesi',
        startTime: '09:30',
        endTime: '12:15',
        location: 'Mühendislik Fakültesi Amfi-2',
        instructor: 'Prof. Dr. Selim Kaya',
      },
      {
        name: 'Diferansiyel Denklemler',
        code: 'MAT-204',
        day: 'Pazartesi',
        startTime: '13:30',
        endTime: '16:15',
        location: 'Merkezi Derslikler D-102',
        instructor: 'Doç. Dr. Nesrin Aydın',
      },
      {
        name: 'Nesne Yönelimli Programlama',
        code: 'BM-206',
        day: 'Salı',
        startTime: '10:00',
        endTime: '12:30',
        location: 'Bilgisayar Lab-3 (Balkan)',
        instructor: 'Dr. Öğr. Üyesi Burak Çelik',
      },
      {
        name: 'Olasılık ve İstatistik',
        code: 'IST-208',
        day: 'Çarşamba',
        startTime: '14:00',
        endTime: '16:45',
        location: 'Mühendislik B Blok Amfi-1',
        instructor: 'Prof. Dr. Deniz Arslan',
      },
      {
        name: 'Ayrık Matematik',
        code: 'MAT-210',
        day: 'Perşembe',
        startTime: '11:00',
        endTime: '13:00',
        location: 'Merkezi Derslikler D-204',
        instructor: 'Doç. Dr. Canan Öztürk',
      },
      {
        name: 'Web Programlama',
        code: 'BM-212',
        day: 'Cuma',
        startTime: '13:30',
        endTime: '15:15',
        location: 'Bilgisayar Lab-2',
        instructor: 'Öğr. Gör. Murat Şahin',
      },
    ],
  },
  {
    name: 'İİBF (İktisat & İşletme Bölümü)',
    courses: [
      {
        name: 'Mikro İktisat II',
        code: 'IKT-202',
        day: 'Pazartesi',
        startTime: '10:00',
        endTime: '12:45',
        location: 'İİBF Zemin Kat Amfi-A',
        instructor: 'Prof. Dr. Kemal Yurt',
      },
      {
        name: 'Finansal Muhasebe',
        code: 'ISL-204',
        day: 'Salı',
        startTime: '13:30',
        endTime: '16:15',
        location: 'İİBF Amfi-B',
        instructor: 'Doç. Dr. Zeynep Koç',
      },
      {
        name: 'İstatistik II',
        code: 'IKT-206',
        day: 'Çarşamba',
        startTime: '09:30',
        endTime: '12:00',
        location: 'Merkezi Derslikler D-301',
        instructor: 'Dr. Öğr. Üyesi Erkan Tekin',
      },
      {
        name: 'Borçlar Hukuku',
        code: 'HUK-208',
        day: 'Perşembe',
        startTime: '14:00',
        endTime: '16:30',
        location: 'İİBF Konferans Salonu',
        instructor: 'Prof. Dr. Serdar Aksoy',
      },
    ],
  },
  {
    name: 'Tıp Fakültesi / Sağlık Bilimleri',
    courses: [
      {
        name: 'Tıbbi Biyokimya',
        code: 'TIP-102',
        day: 'Pazartesi',
        startTime: '08:30',
        endTime: '11:15',
        location: 'Tıp Fakültesi Amfi-1',
        instructor: 'Prof. Dr. Mehmet Güler',
      },
      {
        name: 'İnsan Anatomisi Uygulama',
        code: 'TIP-104',
        day: 'Salı',
        startTime: '10:00',
        endTime: '12:30',
        location: 'Tıp Fak. Anatomi Laboratuvarı',
        instructor: 'Doç. Dr. Hakan Erdem',
      },
      {
        name: 'Tıbbi Biyoloji ve Genetik',
        code: 'TIP-106',
        day: 'Perşembe',
        startTime: '13:30',
        endTime: '15:45',
        location: 'Tıp Fakültesi Amfi-2',
        instructor: 'Prof. Dr. Aylin Şimşek',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API üzerinden gerçek görsel analizi
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const OCR_PROMPT = `Bu görsel bir üniversite ders programı tablosudur (Trakya Üniversitesi OBS sistemi veya benzeri bir akademik takvim olabilir).

Görseldeki TÜM dersleri analiz ederek aşağıdaki JSON formatında çıkar:

[
  {
    "name": "Ders Adı (Türkçe, tam olarak tablodaki gibi)",
    "code": "Ders Kodu (varsa, örn: BM-202; yoksa boş bırak)",
    "day": "Gün adı (Türkçe: Pazartesi, Salı, Çarşamba, Perşembe, Cuma)",
    "startTime": "Başlangıç saati HH:MM formatında",
    "endTime": "Bitiş saati HH:MM formatında",
    "location": "Derslik veya amfi adı (varsa)",
    "instructor": "Öğretim elemanı adı (varsa)"
  }
]

ÖNEMLİ KURALLAR:
- Sadece JSON dizisini döndür, başka hiçbir açıklama veya metin ekleme
- Gün adları mutlaka Türkçe olsun (Pazartesi, Salı, Çarşamba, Perşembe, Cuma)
- Saat formatı mutlaka HH:MM olsun (örn: 09:30, 14:00)
- Bitiş saati yoksa başlangıç saatine 2 saat ekle
- Ders kodu yoksa boş string ("") yaz
- Derslik yoksa boş string ("") yaz, "Bilinmiyor" yazma
- Hoca adı yoksa boş string ("") yaz
- Tablo çizgili veya eğri olsa bile tüm satırları çıkarmaya çalış
- Görsel ders programı değilse veya ders bulunamıyorsa boş dizi [] döndür`;

/**
 * Görsel URI'sini base64'e çevirir
 */
async function imageUriToBase64(uri) {
  try {
    // Expo FileSystem ile dosyayı base64 olarak oku
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (err) {
    console.warn('Base64 dönüşüm hatası:', err);
    throw new Error('Görsel dosyası okunamadı: ' + err.message);
  }
}

/**
 * Gemini Vision API'ye istek gönderir
 */
async function callGeminiVision(base64Image, mimeType, apiKey) {
  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          {
            text: OCR_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn('Gemini API hatası:', response.status, errText);
    if (response.status === 400) {
      throw new Error('GEMINİ_GECERSIZ_ANAHTAR');
    } else if (response.status === 403) {
      throw new Error('GEMINİ_GECERSIZ_ANAHTAR');
    } else if (response.status === 429) {
      throw new Error('GEMINİ_LIMIT_ASIMI');
    }
    throw new Error('API_HATASI:' + response.status);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

/**
 * Gemini'nin döndürdüğü metni parse eder
 */
function parseGeminiResponse(rawText) {
  if (!rawText) return [];

  // Markdown kod bloklarını temizle
  let cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // JSON dizisini bul
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) return [];

  const jsonStr = cleaned.substring(startIdx, endIdx + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    // Her dersi normalize et
    const normalized = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item, idx) => ({
        id: 'ocr-' + Date.now() + '-' + idx,
        name: (item.name || 'Ders ' + (idx + 1)).trim(),
        code: (item.code || '').trim() || 'DERS-' + (100 + idx * 2),
        day: normalizeDayName(item.day || 'Pazartesi'),
        startTime: normalizeTime(item.startTime) || '09:00',
        endTime: normalizeTime(item.endTime) || '11:00',
        location: (item.location || '').trim() || 'Derslik Bilgisi Yok',
        instructor: (item.instructor || '').trim() || 'Öğretim Üyesi',
        notifyHalfHourBefore: true,
        notifyOnStart: true,
        color: '#059669',
      }));

    return normalized;
  } catch (e) {
    console.warn('JSON parse hatası:', e, '\nText:', jsonStr);
    return [];
  }
}

/**
 * Gün adını normalize eder (Türkçe karakter ve harf hatası toleransı)
 */
function normalizeDayName(day) {
  if (!day) return 'Pazartesi';
  const lower = day
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  if (lower.includes('pazartesi') || lower.startsWith('pzt') || lower.startsWith('pz'))
    return 'Pazartesi';
  if (lower.includes('sali') || lower.includes('sal') || lower.startsWith('sa'))
    return 'Salı';
  if (lower.includes('carsamba') || lower.includes('car') || lower.startsWith('ca'))
    return 'Çarşamba';
  if (lower.includes('persembe') || lower.includes('per') || lower.startsWith('pr'))
    return 'Perşembe';
  if (lower.includes('cuma') || lower.startsWith('cu')) return 'Cuma';

  return 'Pazartesi';
}

/**
 * Saat stringini HH:MM formatına normalize eder
 */
function normalizeTime(timeStr) {
  if (!timeStr) return null;
  const cleaned = String(timeStr).replace(/[.,\s]/g, ':').replace(/[^0-9:]/g, '');
  const match = cleaned.match(/(\d{1,2}):?(\d{2})/);
  if (!match) return null;
  const h = String(match[1]).padStart(2, '0');
  const m = String(match[2]).padStart(2, '0');
  return `${h}:${m}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana export: Görsel OCR işlemi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Yüklenen görsel için Gemini Vision tabanlı gerçek OCR analizi.
 *
 * @param {string|null} imageUri  - expo-image-picker'dan gelen görsel URI'si
 * @param {number} sampleIdx     - imageUri null ise kullanılacak örnek şablon indeksi
 * @returns {{ success, courses, templateName?, rawText?, imageUri, error?, needsApiKey? }}
 */
export async function processScheduleImageOCR(imageUri, sampleIdx = 0) {
  // ── Örnek şablon modu (imageUri null) ──────────────────────────────────────
  if (!imageUri) {
    await new Promise((r) => setTimeout(r, 800));
    const template = SAMPLE_TRAKYA_SCHEDULES[sampleIdx % SAMPLE_TRAKYA_SCHEDULES.length];
    const courses = template.courses.map((c, idx) => ({
      id: 'ocr-sample-' + Date.now() + '-' + idx,
      name: c.name,
      code: c.code,
      day: c.day,
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      instructor: c.instructor,
      notifyHalfHourBefore: true,
      notifyOnStart: true,
      color: '#059669',
    }));
    return { success: true, templateName: template.name, courses, imageUri: null };
  }

  // ── Gerçek görsel analizi ─────────────────────────────────────────────────
  const apiKey = await loadGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      courses: [],
      needsApiKey: true,
      error:
        'Gemini API anahtarı bulunamadı. Lütfen ayarlardan API anahtarınızı girin.',
    };
  }

  // Görsel uzantısından MIME type belirle
  const uriLower = (imageUri || '').toLowerCase();
  let mimeType = 'image/jpeg';
  if (uriLower.includes('.png')) mimeType = 'image/png';
  else if (uriLower.includes('.webp')) mimeType = 'image/webp';
  else if (uriLower.includes('.gif')) mimeType = 'image/gif';

  try {
    // 1. Görseli base64'e dönüştür
    const base64 = await imageUriToBase64(imageUri);

    // 2. Gemini Vision API'ye gönder
    const rawText = await callGeminiVision(base64, mimeType, apiKey);

    // 3. Yanıtı parse et
    const courses = parseGeminiResponse(rawText);

    if (courses.length === 0) {
      return {
        success: false,
        courses: [],
        rawText,
        imageUri,
        error:
          'Görselde ders programı tespit edilemedi. Lütfen daha net bir fotoğraf deneyin veya OBS ekran görüntüsü kullanın.',
      };
    }

    return { success: true, courses, rawText, imageUri };
  } catch (err) {
    console.warn('OCR işlemi hatası:', err);

    if (err.message === 'GEMINİ_GECERSIZ_ANAHTAR') {
      return {
        success: false,
        courses: [],
        needsApiKey: true,
        error: 'API anahtarı geçersiz veya yetkisiz. Lütfen doğru anahtarı girin.',
      };
    }
    if (err.message === 'GEMINİ_LIMIT_ASIMI') {
      return {
        success: false,
        courses: [],
        error:
          'Gemini API istek limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.',
      };
    }

    return {
      success: false,
      courses: [],
      error: 'Analiz sırasında hata: ' + err.message,
    };
  }
}
