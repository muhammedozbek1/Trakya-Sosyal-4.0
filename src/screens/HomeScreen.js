import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/fonts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Gradient yüksekliği: ekran yüksekliğinin ~35% + safe area
const GRADIENT_HEIGHT = SCREEN_HEIGHT * 0.35 + (Platform.OS === 'android' ? 24 : 44);

export default function HomeScreen({ user, onNavigate, onLogout }) {
  const { theme: colors, mode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" translucent />
      {/* Gradient Arka Plan - Üst kısım (çentiğin arkasına kadar uzanır) */}
      <LinearGradient
        colors={[
          colors.primary,           // #0F2C59 - Koyu mavi (en üst)
          colors.primaryLight,      // #1E4DB7 - Canlı mavi (orta)
          '#3B82F6',                // Daha açık mavi
          colors.background,        // #F8FAFC - Beyaz/arka plan rengine geçiş
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.gradientBackground}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Üst Header - Gradient üzerinde beyaz yazılar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Merhaba,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Trakya Öğrencisi'}</Text>
          </View>
          <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} title="Tema Değiştir">
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} title="Çıkış Yap">
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Ana Menü Başlığı - Gradient üzerinde beyaz/hafif şeffaf yazılar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kampüs Modülleri</Text>
          <Text style={styles.sectionSubtitle}>Gitmek istediğin modülü seç</Text>
        </View>

        {/* 1. SOSYAL MODÜLÜ BUTONU */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.socialCard]}
          onPress={() => onNavigate('social')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cafe" size={32} color="#D97706" />
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>Öğrenci İndirimleri</Text>
            </View>
          </View>

          <Text style={styles.moduleTitle}>☕ Sosyal & Kafeler</Text>
          <Text style={styles.moduleDesc}>
            Edirne kafeleri açık adresleri, harita konumu, güncel öğrenci menü fiyatları ve %25 indirim kuponları.
          </Text>

          <View style={styles.moduleFooter}>
            <View style={styles.featurePills}>
              <Text style={styles.pillText}>• Açık Adres & Harita</Text>
              <Text style={styles.pillText}>• Öğrenci Menü Fiyatları</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. ULAŞIM MODÜLÜ BUTONU */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.transitCard]}
          onPress={() => onNavigate('transit')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.moduleIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bus" size={32} color="#2563EB" />
            </View>
            <View style={[styles.tagBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.tagBadgeText, { color: '#2563EB' }]}>Akıllı Asistan 🤖</Text>
            </View>
          </View>

          <Text style={styles.moduleTitle}>🚌 Akıllı Ulaşım</Text>
          <Text style={styles.moduleDesc}>
            Durak listelerinde kaybolma! Doğal dille sor ("kragac balkan yoli" gibi hatalı yazsan bile anlar), anında en uygun ETUS otobüs tarifini al.
          </Text>

          <View style={styles.moduleFooter}>
            <View style={styles.featurePills}>
              <Text style={styles.pillText}>• Doğal Dil & Fuzzy Eşleştirme</Text>
              <Text style={styles.pillText}>• 1A, 3A, 7A Hatları & Kentkart</Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* 3. AKADEMİ MODÜLÜ BUTONU */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.academicCard]}
          onPress={() => onNavigate('academic')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.moduleIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="school" size={32} color="#059669" />
            </View>
            <View style={[styles.tagBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.tagBadgeText, { color: '#059669' }]}>30 Dk Önce Bildirim</Text>
            </View>
          </View>

          <Text style={styles.moduleTitle}>📚 Akademi & Ders Programı</Text>
          <Text style={styles.moduleDesc}>
            Ders programını tanımla! Her ders için 30 dakika önce ve ders başlangıç anında telefonuna anlık sesli bildirim gelsin.
          </Text>

          <View style={styles.moduleFooter}>
            <View style={styles.featurePills}>
              <Text style={styles.pillText}>• Otomatik Alarm & Bildirim</Text>
              <Text style={styles.pillText}>• Haftalık Program</Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: '#059669' }]}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. TOPLULUKLAR MODÜLÜ BUTONU */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.communityCard]}
          onPress={() => onNavigate('communities')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.moduleIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people" size={32} color="#7C3AED" />
            </View>
            <View style={[styles.tagBadge, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[styles.tagBadgeText, { color: '#7C3AED' }]}>Buluşmalar & Atölyeler</Text>
            </View>
          </View>

          <Text style={styles.moduleTitle}>🎉 Topluluklar & Etkinlikler</Text>
          <Text style={styles.moduleDesc}>
            Trakya'daki öğrenci topluluklarının buluşmalarını keşfet! Yazılım, kültür, spor ve müzik etkinliklerine katıl.
          </Text>

          <View style={styles.moduleFooter}>
            <View style={styles.featurePills}>
              <Text style={styles.pillText}>• Kategori Filtreleri</Text>
              <Text style={styles.pillText}>• Harita & Katılım</Text>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: '#7C3AED' }]}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Edirne Kampüs İpuçları Kartı */}
        <View style={styles.infoBox}>
          <Ionicons name="bulb-outline" size={22} color={colors.accent} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Günün Edirne İpucu</Text>
            <Text style={styles.infoBoxDesc}>
              Balkan Yerleşkesi'nden Karaağaç'a gitmek için en pratik yol 7A numaralı ETUS otobüsüdür. Tarihi Meriç Köprüsü manzarasını kaçırmayın!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    zIndex: 0,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 40,
    zIndex: 1, // Gradient'in üzerinde olsun
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fontFamilies.regular,
  },
  userNameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginLeft: 8,
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: fontFamilies.regular,
  },
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  socialCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#D97706',
  },
  transitCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#2563EB',
  },
  academicCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#059669',
  },
  communityCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#7C3AED',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  moduleTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    fontFamily: fontFamilies.bold,
  },
  moduleDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 16,
    fontFamily: fontFamilies.regular,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  featurePills: {
    flexDirection: 'column',
  },
  pillText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: fontFamilies.bold,
  },
  infoBoxDesc: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 17,
    fontFamily: fontFamilies.regular,
  },
});