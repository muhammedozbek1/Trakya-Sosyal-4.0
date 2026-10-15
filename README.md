# 🎓 Trakya Sosyal 4.0 (Edirne Öğrenci Yaşam & Kampüs Uygulaması)

Trakya Üniversitesi öğrencilerine özel olarak geliştirilmiş modern, cross-platform mobil uygulamadır.

---

## 🌟 Güncellenen ve Yeni Özellikler

### 1. 📚 Akademi & Bildirim Tıklama Detay Kartı Entegrasyonu (YENİLENDİ)
- **Bildirime Tıklanınca Doğrudan Detay Kartı Açılır:**
  - Otomatik hatırlatıcı bildirimi (30 dk kala veya başlangıç uyarısı) geldiğinde öğrenci bildirime dokunduğu anda uygulama açılır ve doğrudan o dersin **Detay Kartı (Modal)** ekrana gelir.
  - Uygulama arka plandayken veya kapalıyken bildirime basılsa dahi (`NotificationResponseReceivedListener` & `getLastNotificationResponseAsync`) ilgili dersin kartı otomatik açılır.
- **Detay Kartı İçeriği:**
  - 🏛️ **Dersin Amfisi / Dersliği:** (Örn: *Mühendislik Fakültesi Amfi-2*, *Merkezi Derslikler D-104*)
  - 👨‍🏫 **Dersin Öğretim Elemanı / Hocası:** (Örn: *Prof. Dr. Selim Kaya*)
  - 📊 **Ders Sıralaması / İlerlemesi:** Günün kaçıncı dersi olduğu net formatta gösterilir (Örn: *"Günün 1/4. dersi"*, *"Günün 2/4. dersi"*).
  - 🕒 **Başlangıç & Bitiş Saatleri:** Saat aralığı ve bildirim açık/kapalı durumu.
  - 💬 **Tatlı & Sempatik Uyarı (Her Kartta Tek ve Özel Bir Söz):**
    - Her dersin detay kartında dikkat dağıtmayan, samimi tek bir hatırlatma yer alır (Örn: *"Derse odaklanmayı unutma reis! 🎓"* veya *"Telefonu sessize al, derse odaklan! 🤫"* veya *"Kahveni kaptıysan amfiye doğru sakin adımlarla geçebilirsin. ☕"*).

### 2. ✨ Motivasyon Köşesi (Günün Sözü - YENİLENDİ)
- Akademi sekmesine tıklandığında sayfanın en üstünde kısa, tadında ve abartısız bir motivasyon kartı yer alır.
- **⚠️ KRİTİK KURAL UYGULANDI:** Bu motivasyon sözleri kesinlikle bildirim olarak **gönderilmez**. Sadece öğrenci Akademi sekmesine kendi bastığında ekranın üstünde görüntülenir.

### 3. ☕ Sosyal & Edirne Kafe Kampanyaları
- **Açık Adres & Harita Entegrasyonu:** Her kafenin tam açık adresi ve tek tıkla açılan **"Haritada Aç"** butonu.
- **Öğrenci Menü Fiyatları (Esnek/Opsiyonel):** Kafe kartı içinde açılır-kapanır menü fiyat listesi ve öğrenciye özel indirimli fiyatlar.
- **Kupon Kodu & QR Gösterimi:** Kasada gösterilmek üzere tek dokunuşla açılan kupon kartı.

### 4. 🤖 Akıllı Ulaşım Modülü (Mini AI Asistan & Fuzzy Matching)
- **Doğal Dil Arama:** *"Karaağaç'tan Balkan Yerleşkesine nasıl giderim?"* veya *"kragac balkan yoli"*, *"pzrtsi pzr kyk"* gibi hatalı ve kısaltmalı yazımları %100 tolere eden yerel yapay zeka algoritması.
- **Nokta Atışı Rota Kartı:** 1A, 3A, 7A, 5B hatları, güzergah adımları, seyahat süresi ve 16.50 ₺ Kentkart tarifesi.

### 5. 🔐 Üniversite Maili ile Giriş Sistemi
- `@ogr.trakya.edu.tr` ve `@trakya.edu.tr` kurumsal e-posta doğrulaması ve hızlı demo girişi.

---

## 📱 Telefonda Nasıl Çalıştırılır?

### Adım 1: Expo Go Uygulamasını İndirin
- **Android:** Google Play Store'dan `Expo Go` uygulamasını indirin.
- **iOS:** App Store'dan `Expo Go` uygulamasını indirin.

### Adım 2: Geliştirici Sunucusunu Başlatın
Terminalde proje klasöründe şu komutu çalıştırın:
```bash
npx expo start
```

### Adım 3: Telefonda Açın
- **Android:** Expo Go uygulamasındaki "Scan QR Code" butonuna basıp terminaldeki QR kodu taratın.
- **iOS:** Telefonun kamerasını terminaldeki QR koda tutun ve Expo Go ile açın.

---

## 🛠️ Kullanılan Teknolojiler
- **React Native & Expo SDK 57**
- **expo-notifications** (`NotificationResponseReceivedListener`, background/foreground routing)
- **Custom Turkish Fuzzy Matching AI Engine** (Levenshtein distance & stem analyzer)
- **@react-native-async-storage/async-storage** (Oturum ve ders programı kalıcılığı)
- **@expo/vector-icons** (Mobil ikon seti)
