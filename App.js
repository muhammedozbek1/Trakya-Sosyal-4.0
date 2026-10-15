import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';
import { useTheme } from './src/theme/ThemeContext';
import { storageService } from './src/services/storageService';
import {
  requestNotificationPermissions,
  sendTestNotification,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from './src/services/notificationService';
import { fontFamilies } from './src/theme/fonts';

// Ekranlar
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SocialScreen from './src/screens/SocialScreen';
import TransitScreen from './src/screens/TransitScreen';
import AcademicScreen from './src/screens/AcademicScreen';
import CommunitiesScreen from './src/screens/CommunitiesScreen';
import CommunityDetailScreen from './src/screens/CommunityDetailScreen';

// Font yükleme - SplashScreen'i gizlemeyi ertele
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { theme: colors } = useTheme();
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'social', 'transit', 'academic', 'communities', 'communityDetail'
  const [isLoading, setIsLoading] = useState(true);
  const [courseIdForDetail, setCourseIdForDetail] = useState(null);
  const [selectedCommunityEvent, setSelectedCommunityEvent] = useState(null);

  // Poppins fontlarını yükle - doğrudan import edilen font değişkenleriyle
  const [fontsLoaded, fontError] = useFonts({
    'Poppins_400Regular': Poppins_400Regular,
    'Poppins_500Medium': Poppins_500Medium,
    'Poppins_600SemiBold': Poppins_600SemiBold,
    'Poppins_700Bold': Poppins_700Bold,
  });

  // Fontlar yüklendiğinde splash screen'i gizle
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    if (fontError) {
      console.warn('Font yükleme hatası:', fontError);
      SplashScreen.hideAsync(); // Hata olsa bile splash screen'i gizle
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      initApp();
    }
  }, [fontsLoaded]);

  // 🔔 BİLDİRİME TIKLAMA DİNLEYİCİSİ (Notification Response Listener)
  // Öğrenci bildirime dokunduğunda doğrudan Akademi sekmesine ve dersin detay kartına yönlendirir
  useEffect(() => {
    const subscription = addNotificationResponseListener((courseId) => {
      if (courseId) {
        handleOpenCourseFromNotification(courseId);
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  const initApp = async () => {
    try {
      // Kayıtlı kullanıcı kontrolü
      const savedUser = await storageService.getUser();
      if (savedUser) {
        setUser(savedUser);
      }
      // Bildirim izinlerini talep et
      await requestNotificationPermissions();

      // Uygulama kapalıyken bildirime tıklanarak açıldıysa kontrol et
      const lastCourseId = await getLastNotificationResponse();
      if (lastCourseId) {
        handleOpenCourseFromNotification(lastCourseId);
      }
    } catch (e) {
      console.warn('Uygulama başlatma hatası:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCourseFromNotification = (courseId) => {
    setCurrentScreen('academic');
    setCourseIdForDetail(courseId);
  };

  const handleOpenCommunityDetail = (event) => {
    setSelectedCommunityEvent(event);
    setCurrentScreen('communityDetail');
  };

  const handleLeaveCommunity = () => {
    setSelectedCommunityEvent(null);
    setCurrentScreen('communities');
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    await storageService.setUser(userData);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Oturumunuz kapatılacak. Onaylıyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await storageService.removeUser();
          await storageService.removeRememberedUsername(); // "Beni Unutma" da temizle
          setUser(null);
        },
      },
    ]);
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleTriggerTestNotification = async () => {
    const res = await sendTestNotification(2, 'course-1');
    if (res) {
      Alert.alert(
        'Bildirim Tetiklendi ⏰',
        '2 saniye içinde telefonunuza ders hatırlatma bildirimi (30 dk önce uyarısı) gelecektir.\n\n👉 Bildirime dokunduğunuzda doğrudan ilgili dersin Amfi, Hoca ve Sıralama Detay Kartı açılacaktır!'
      );
    } else {
      Alert.alert(
        'Bildirim İzni Gerekli',
        'Bildirimleri alabilmek için lütfen cihaz ayarlarından uygulamaya bildirim izni verin.'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ExpoStatusBar style="light" />
        <Ionicons name="school" size={54} color="#FFFFFF" />
        <Text style={styles.loadingText}>Trakya Sosyal Yükleniyor...</Text>
      </View>
    );
  }

  // Giriş yapılmadıysa Giriş Ekranını göster
  if (!user) {
    return (
      <View style={styles.container}>
        <ExpoStatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoStatusBar style={currentScreen === 'home' ? 'light' : colors.statusBar} />

      {/* Ana Ekran İçeriği */}
      <View style={styles.contentArea}>
        {currentScreen === 'home' && (
          <HomeScreen
            user={user}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onTestNotification={handleTriggerTestNotification}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'social' && (
          <SocialScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'transit' && (
          <TransitScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'academic' && (
          <AcademicScreen
            onBack={() => setCurrentScreen('home')}
            initialCourseIdToOpen={courseIdForDetail}
            onClearInitialCourseId={() => setCourseIdForDetail(null)}
          />
        )}

        {currentScreen === 'communities' && (
          <CommunitiesScreen
            onBack={() => setCurrentScreen('home')}
            onOpenDetail={handleOpenCommunityDetail}
            user={user}
          />
        )}

        {currentScreen === 'communityDetail' && selectedCommunityEvent && (
          <CommunityDetailScreen
            event={selectedCommunityEvent}
            user={user}
            onBack={() => setCurrentScreen('communities')}
            onLeave={handleLeaveCommunity}
          />
        )}
      </View>

      {/* Alt Gezinme Çubuğu (Bottom Navigation Bar) */}
      {/* communityDetail (tam ekran sohbet) açıkken gizlenir */}
      {currentScreen !== 'communityDetail' && (
      <SafeAreaView style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {/* Ana Sayfa */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentScreen('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={currentScreen === 'home' ? colors.primaryLight : colors.textMuted}
            />
            <Text
              style={[
                styles.navBtnText,
                currentScreen === 'home' && styles.navBtnTextActive,
              ]}
            >
              Ana Sayfa
            </Text>
          </TouchableOpacity>

          {/* Sosyal (Kafeler) */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentScreen('social')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'social' ? 'cafe' : 'cafe-outline'}
              size={22}
              color={currentScreen === 'social' ? '#D97706' : colors.textMuted}
            />
            <Text
              style={[
                styles.navBtnText,
                currentScreen === 'social' && { color: '#D97706', fontWeight: '800' },
              ]}
            >
              Sosyal
            </Text>
          </TouchableOpacity>

          {/* Ulaşım (Otobüsler) */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentScreen('transit')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'transit' ? 'bus' : 'bus-outline'}
              size={22}
              color={currentScreen === 'transit' ? '#2563EB' : colors.textMuted}
            />
            <Text
              style={[
                styles.navBtnText,
                currentScreen === 'transit' && { color: '#2563EB', fontWeight: '800' },
              ]}
            >
              Ulaşım
            </Text>
          </TouchableOpacity>

          {/* Akademi (Ders Programı) */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentScreen('academic')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'academic' ? 'school' : 'school-outline'}
              size={22}
              color={currentScreen === 'academic' ? '#059669' : colors.textMuted}
            />
            <Text
              style={[
                styles.navBtnText,
                currentScreen === 'academic' && { color: '#059669', fontWeight: '800' },
              ]}
            >
              Akademi
            </Text>
          </TouchableOpacity>

          {/* Topluluklar (Etkinlikler) */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentScreen('communities')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'communities' || currentScreen === 'communityDetail' ? 'people' : 'people-outline'}
              size={22}
              color={currentScreen === 'communities' || currentScreen === 'communityDetail' ? '#7C3AED' : colors.textMuted}
            />
            <Text
              style={[
                styles.navBtnText,
                (currentScreen === 'communities' || currentScreen === 'communityDetail') && { color: '#7C3AED', fontWeight: '800' },
              ]}
            >
              Topluluk
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    fontFamily: fontFamilies.regular,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F2C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    marginTop: 16,
  },
  contentArea: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  navBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  navBtnTextActive: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
});
