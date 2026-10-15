import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Expo Go'da push notification tam olarak çalışmaz (development build gerekir)
// Bu flag ile Expo Go'da bildirim özelliklerini güvenle atlarız
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Android'de Expo Go ve bazı development build'lerde EventEmitter / native modül hataları oluşuyor
// Platform.OS === 'android' iken tüm native bildirim çağrılarını try-catch ile sarmala
const IS_ANDROID = Platform.OS === 'android';

// Bildirim gösterim ayarı (Uygulama ön plandayken de göster) - Android/Expo Go'da güvenli
if (!IS_ANDROID && !IS_EXPO_GO) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('NotificationHandler ayarlanamadı:', error);
  }
}

/**
 * Bildirim sisteminin devre dışı bırakılıp bırakılmadığını kontrol et
 * - Web: native bildirim yok, Browser API kullanılır
 * - Android: Expo Go'da ve native modül hatalarını önlemek için devre dışı
 * - iOS: Expo Go'da devre dışı, development build'de çalışır
 */
function isNotificationsDisabled() {
  if (Platform.OS === 'web') return false; // Web'de native bildirim değil, Browser Notification API kullanılır
  
  // Android'de her zaman devre dışı (EventEmitter/native modül hatalarını önlemek için)
  if (IS_ANDROID) {
    console.log('📱 Android platformu - bildirimler güvenlik nedeniyle devre dışı (development build + native config gerekir)');
    return true;
  }
  
  // iOS'ta sadece Expo Go'da devre dışı
  return IS_EXPO_GO;
}

/**
 * Güvenli async wrapper - Android'de herhangi bir native modül hatasını yakalar
 */
async function safeAsync(operation, fallback = null, context = '') {
  try {
    if (isNotificationsDisabled()) {
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.warn(`[NotificationService] ${context} hatası (güvenli yakalandı):`, error);
    return fallback;
  }
}

/**
 * Bildirim izinlerini iste ve kontrol et
 */
export async function requestNotificationPermissions() {
  if (isNotificationsDisabled()) {
    return false;
  }

  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      const perm = await window.Notification.requestPermission();
      return perm === 'granted';
    }
    return true;
  }

  return safeAsync(async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android kanal oluşturma - try-catch içinde zaten ama ekstra koruma
    if (IS_ANDROID) {
      try {
        await Notifications.setNotificationChannelAsync('dersler', {
          name: 'Ders Hatırlatıcıları',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0F2C59',
        });
      } catch (channelError) {
        console.warn('Android kanal oluşturulamadı:', channelError);
      }
    }

    return true;
  }, false, 'requestNotificationPermissions');
}

/**
 * Hızlı Test Bildirimi Gönder
 */
export async function sendTestNotification(delaySeconds = 2, targetCourseId = 'course-1') {
  if (isNotificationsDisabled()) {
    console.log('📱 Bildirimler devre dışı - test bildirimi simüle edildi');
    return false;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  if (Platform.OS === 'web') {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      setTimeout(() => {
        const notif = new window.Notification('⏰ Trakya Sosyal - Derse 30 Dakika Kaldı!', {
          body: 'Algoritmalar ve Programlama dersiniz 30 dk sonra Amfi-2\'de başlayacak. Detaylar için tıkla!',
          icon: '/favicon.png',
        });
        notif.onclick = () => {
          if (window.__onNotificationCourseClick) {
            window.__onNotificationCourseClick(targetCourseId);
          }
        };
      }, delaySeconds * 1000);
      return true;
    }
    return false;
  }

  return safeAsync(async () => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Derse 30 Dakika Kaldı: Algoritmalar ve Programlama',
        body: 'Dersiniz 09:30 saatinde Amfi-2\'de başlayacak. Detaylı ders kartı için tıkla!',
        data: { courseId: targetCourseId, type: 'before_class' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, delaySeconds),
      },
    });
    return id;
  }, null, 'sendTestNotification');
}

/**
 * Ders için 30 dakika önce ve ders başlangıç bildirimlerini zamanla
 */
export async function scheduleClassNotification(course) {
  if (Platform.OS === 'web') return;
  if (isNotificationsDisabled()) return;

  return safeAsync(async () => {
    // 1. Derse 30 dakika kala bildirimi
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Derse 30 Dakika Kaldı: ${course.name}`,
        body: `${course.name} dersiniz saat ${course.startTime}'de ${course.location || 'Derslik'}'te başlayacak. Detaylar için tıkla!`,
        sound: true,
        data: { courseId: course.id, type: 'before_class' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    // 2. Ders başlama bildirimi
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 Ders Başladı: ${course.name}`,
        body: `${course.name} dersi şimdi başladı! Lütfen telefonu sessize al. Detaylar için dokun.`,
        sound: true,
        data: { courseId: course.id, type: 'start_class' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 25,
      },
    });
  }, undefined, 'scheduleClassNotification');
}

/**
 * Kullanıcı bildirime tıkladığında tetiklenecek dinleyici
 */
export function addNotificationResponseListener(callback) {
  if (Platform.OS === 'web') {
    window.__onNotificationCourseClick = callback;
    return {
      remove: () => {
        window.__onNotificationCourseClick = null;
      },
    };
  }

  if (isNotificationsDisabled()) {
    return { remove: () => {} };
  }

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.courseId && callback) {
        callback(data.courseId);
      }
    });
    return subscription;
  } catch (err) {
    console.warn('[NotificationService] addNotificationResponseListener hatası:', err);
    return { remove: () => {} };
  }
}

/**
 * Uygulama kapalıyken bildirime tıklanarak açıldıysa son bildirim verisini al
 */
export async function getLastNotificationResponse() {
  if (Platform.OS === 'web') return null;
  if (isNotificationsDisabled()) return null;

  return safeAsync(async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification?.request?.content?.data?.courseId || null;
  }, null, 'getLastNotificationResponse');
}

/**
 * Expo Push Token al - Sadece iOS development build'de çalışır
 */
export async function getExpoPushTokenAsync() {
  if (isNotificationsDisabled()) {
    return null;
  }

  return safeAsync(async () => {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }, null, 'getExpoPushTokenAsync');
}