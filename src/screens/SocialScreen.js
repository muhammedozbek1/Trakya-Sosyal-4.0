import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import { CAFES_DATA, CATEGORIES } from '../data/cafesData';
import { storageService } from '../services/storageService';
import { fontFamilies } from '../theme/fonts';

// Haversine: iki koordinat arası metre cinsinden kuş uçuşu mesafe
function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function SocialScreen({ onBack }) {
  const { theme: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [savedDeals, setSavedDeals] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({}); // { [cafeId]: boolean }
  const [userCoords, setUserCoords] = useState(null);
  const [sortedByDistance, setSortedByDistance] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadSavedDeals();
  }, []);

  const loadSavedDeals = async () => {
    const saved = await storageService.getSavedDeals();
    setSavedDeals(saved);
  };

  const handleToggleFavorite = async (dealId) => {
    const updated = await storageService.toggleSavedDeal(dealId);
    setSavedDeals(updated);
  };

  const toggleMenu = (cafeId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [cafeId]: !prev[cafeId],
    }));
  };

  const handleOpenMap = (cafe) => {
    const query = encodeURIComponent(`${cafe.name} ${cafe.area} Edirne`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
  };

  const handleFindNearest = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'En yakın kafeyi bulabilmem için konum izni vermen gerekiyor. İstersen cihaz ayarlarından konumu açıp tekrar dene.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setSortedByDistance(true);
    } catch (e) {
      console.warn('Konum alınamadı:', e);
      Alert.alert(
        'Konum Alınamadı',
        'GPS konumun şu an okunamadı. Konum servisinin açık olduğundan emin olup tekrar dene.'
      );
    } finally {
      setLocating(false);
    }
  };

  const clearDistanceSort = () => {
    setSortedByDistance(false);
    setUserCoords(null);
  };

  const filteredCafes = useMemo(() => {
    const list = CAFES_DATA.filter((cafe) => {
      const matchesCategory =
        selectedCategory === 'all' || cafe.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        query === '' ||
        cafe.name.toLowerCase().includes(query) ||
        cafe.area.toLowerCase().includes(query) ||
        (cafe.fullAddress && cafe.fullAddress.toLowerCase().includes(query)) ||
        cafe.dealTitle.toLowerCase().includes(query) ||
        cafe.dealDescription.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    }).map((cafe) => {
      if (userCoords && cafe.coordinates) {
        const meters = haversineMeters(
          userCoords.latitude,
          userCoords.longitude,
          cafe.coordinates.latitude,
          cafe.coordinates.longitude
        );
        return { ...cafe, computedMeters: meters, computedLabel: formatDistance(meters) };
      }
      return cafe;
    });
    // Konum bazlı akıllı sıralama: en yakından en uzağa
    if (sortedByDistance && userCoords) {
      list.sort((a, b) => (a.computedMeters ?? Infinity) - (b.computedMeters ?? Infinity));
    }
    return list;
  }, [selectedCategory, searchQuery, userCoords, sortedByDistance]);

  return (
    <View style={styles.safeArea}>
      <StatusBar style={colors.statusBar} translucent />
      {/* Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.navTitle}>Edirne Kafeleri & Kampanyalar</Text>
          <Text style={styles.navSubtitle}>Açık Adresler, Menü Fiyatları & Kuponlar</Text>
        </View>
        <View style={styles.badgeTop}>
          <Text style={styles.badgeTopText}>{filteredCafes.length} Mekan</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Arama Çubuğu */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kafe adı, cadde veya semt (Karaağaç, Ayşekadın...) ara"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Kategori Filtreleri */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bilgi Şeridi */}
        <View style={styles.announcementBanner}>
          <Ionicons name="gift" size={20} color="#D97706" />
          <Text style={styles.bannerText}>
            Kafelerde açık adresleri görüntüleyebilir, menü fiyatlarını inceleyebilir ve öğrenci indirim kuponlarını kullanabilirsiniz.
          </Text>
        </View>

        {/* En Yakın Kafeyi Bul */}
        <TouchableOpacity
          style={styles.nearestBtn}
          onPress={handleFindNearest}
          activeOpacity={0.88}
          disabled={locating}
        >
          <LinearGradient
            colors={['#1E4DB7', '#0F2C59']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nearestBtnGradient}
          >
            <View style={styles.nearestBtnGlass}>
              {locating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="navigate-circle" size={26} color="#FFFFFF" />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.nearestBtnTitle}>
                  {locating ? 'Konumun alınıyor...' : '📍 Bana En Yakın Kafeyi Bul'}
                </Text>
                <Text style={styles.nearestBtnSub}>
                  {sortedByDistance
                    ? 'Liste konumuna göre sıralı • dokunarak yenile'
                    : 'GPS ile mesafeye göre akıllı sıralama'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {sortedByDistance ? (
          <TouchableOpacity
            style={styles.clearSortRow}
            onPress={clearDistanceSort}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.clearSortText}>Konum sıralamasını temizle</Text>
          </TouchableOpacity>
        ) : null}

        {/* Kafe Listesi */}
        {filteredCafes.map((cafe, index) => {
          const isSaved = savedDeals.includes(cafe.id);
          const isMenuOpen = !!expandedMenus[cafe.id];
          const hasMenu = cafe.menuPrices && cafe.menuPrices.length > 0;
          const isNearest = sortedByDistance && index === 0;

          return (
            <View key={cafe.id} style={styles.cafeCard}>
              {/* Üst Bilgi */}
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.areaRow}>
                    <Ionicons name="location" size={14} color="#D97706" />
                    <Text style={styles.areaText}>{cafe.area}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {cafe.rating} ({cafe.reviewsCount})
                    </Text>
                  </View>
                  <Text style={styles.cafeName}>{cafe.name}</Text>
                  {isNearest ? (
                    <View style={styles.nearestBadge}>
                      <Ionicons name="trophy" size={11} color="#FFFFFF" />
                      <Text style={styles.nearestBadgeText}>En Yakın / Tavsiye Edilen</Text>
                    </View>
                  ) : null}
                </View>

                {/* Favori Butonu */}
                <TouchableOpacity
                  style={styles.favButton}
                  onPress={() => handleToggleFavorite(cafe.id)}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isSaved ? colors.danger : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* AÇIK ADRES VE HARİTA BİLGİSİ */}
              <View style={styles.addressBox}>
                <View style={styles.addressLeft}>
                  <Ionicons name="navigate-circle" size={18} color="#2563EB" />
                  <View style={{ marginLeft: 6, flex: 1 }}>
                    <Text style={styles.addressLabel}>AÇIK ADRES / KONUM</Text>
                    <Text style={styles.addressText}>{cafe.fullAddress || cafe.address}</Text>
                    <Text style={styles.distanceText}>
                      {cafe.computedLabel ? `📍 ${cafe.computedLabel} uzakta` : `📍 ${cafe.distance}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => handleOpenMap(cafe)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color="#2563EB" />
                  <Text style={styles.mapBtnText}>Haritada Aç</Text>
                </TouchableOpacity>
              </View>

              {/* Kampanya Kutusu */}
              <View style={styles.dealContainer}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{cafe.discount}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.dealTitle}>{cafe.dealTitle}</Text>
                  <Text style={styles.dealDesc} numberOfLines={2}>
                    {cafe.dealDescription}
                  </Text>
                </View>
              </View>

              {/* OPSİYONEL MENÜ FİYATLARI BÖLÜMÜ */}
              {hasMenu ? (
                <View style={styles.menuSection}>
                  <TouchableOpacity
                    style={styles.menuHeaderRow}
                    onPress={() => toggleMenu(cafe.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.menuHeaderLeft}>
                      <Ionicons name="restaurant-outline" size={16} color="#059669" />
                      <Text style={styles.menuHeaderTitle}>
                        Öğrenci Menü Fiyatları ({cafe.menuPrices.length} Ürün)
                      </Text>
                    </View>
                    <View style={styles.menuHeaderRight}>
                      <Text style={styles.menuToggleText}>{isMenuOpen ? 'Gizle' : 'Fiyatları Gör'}</Text>
                      <Ionicons
                        name={isMenuOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#059669"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Genişletilmiş Menü Fiyat Listesi */}
                  {isMenuOpen && (
                    <View style={styles.menuList}>
                      {cafe.menuPrices.map((item, mIdx) => (
                        <View key={mIdx} style={styles.menuItemRow}>
                          <Text style={styles.menuItemName}>{item.item}</Text>
                          <View style={styles.menuPriceWrapper}>
                            <Text style={styles.regularPrice}>{item.price}</Text>
                            <View style={styles.studentPriceBadge}>
                              <Text style={styles.studentPriceText}>{item.studentPrice}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                      <Text style={styles.menuDisclaimer}>
                        * Fiyatlar Trakya Üniversitesi öğrencilerine özeldir.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Etiketler (Wi-Fi, Priz vb.) */}
              <View style={styles.tagsRow}>
                {cafe.studyFriendly && (
                  <View style={styles.tagItem}>
                    <Ionicons name="book-outline" size={12} color="#059669" />
                    <Text style={styles.tagText}>Ders Çalışmaya Uygun</Text>
                  </View>
                )}
                {cafe.hasWifi && (
                  <View style={styles.tagItem}>
                    <Ionicons name="wifi-outline" size={12} color="#2563EB" />
                    <Text style={styles.tagText}>Ücretsiz Wi-Fi</Text>
                  </View>
                )}
                {cafe.hasPriz && (
                  <View style={styles.tagItem}>
                    <Ionicons name="flash-outline" size={12} color="#D97706" />
                    <Text style={styles.tagText}>Priz Mevcut</Text>
                  </View>
                )}
              </View>

              {/* Kart Altı - Çalışma Saati ve Kupon Butonu */}
              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <Ionicons name="time-outline" size={14} color={colors.textLight} />
                  <Text style={styles.openHoursText}>{cafe.openHours}</Text>
                </View>
                <TouchableOpacity
                  style={styles.getCouponBtn}
                  onPress={() => {
                    setActiveCoupon(cafe);
                    setCopiedCode(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="ticket-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.getCouponBtnText}>Kodu Göster</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredCafes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Mekan Bulunamadı</Text>
            <Text style={styles.emptyDesc}>
              Arama kriterlerinizi değiştirerek tekrar deneyin.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Kupon Modalı */}
      <Modal
        visible={activeCoupon !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCoupon(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveCoupon(null)}
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.modalLogoBox}>
                <Ionicons name="cafe" size={32} color="#D97706" />
              </View>
              <Text style={styles.modalCafeName}>{activeCoupon?.name}</Text>
              <Text style={styles.modalAreaText}>{activeCoupon?.area} • Edirne</Text>
              <Text style={styles.modalAddressSmall} numberOfLines={2}>
                📍 {activeCoupon?.fullAddress}
              </Text>
            </View>

            {/* İndirim Kartı */}
            <View style={styles.couponCodeBox}>
              <Text style={styles.couponCodeLabel}>ÖĞRENCİ İNDİRİM KODU</Text>
              <Text style={styles.couponCodeText}>{activeCoupon?.couponCode}</Text>
              <Text style={styles.couponDiscountText}>{activeCoupon?.discount}</Text>
            </View>

            <Text style={styles.couponInstruction}>
              {activeCoupon?.dealDescription}
            </Text>

            <View style={styles.qrSimulationBox}>
              <Ionicons name="qr-code-outline" size={72} color={colors.primary} />
              <Text style={styles.qrHint}>Kasada gösterilmek üzere aktif edildi</Text>
            </View>

            <TouchableOpacity
              style={[styles.copyBtn, copiedCode && styles.copyBtnSuccess]}
              onPress={() => {
                setCopiedCode(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={copiedCode ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.copyBtnText}>
                {copiedCode ? 'Kod Kopyalandı & Hazır!' : 'Kupon Kodunu Kopyala'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fontFamilies.regular,
  },
  badgeTop: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: fontFamilies.bold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    fontFamily: fontFamilies.regular,
  },
  categoryContainer: {
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fontFamilies.semiBold,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: fontFamilies.medium,
  },
  nearestBtn: {
    borderRadius: 18,
    marginBottom: 6,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  nearestBtnGradient: {
    borderRadius: 18,
  },
  nearestBtnGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  nearestBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  nearestBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  clearSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  clearSortText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  nearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  nearestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
  },
  cafeCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  areaText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: colors.textLight,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
  },
  cafeName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  favButton: {
    padding: 6,
  },
  addressBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    fontFamily: fontFamilies.bold,
  },
  addressText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
    fontFamily: fontFamilies.semiBold,
  },
  distanceText: {
    fontSize: 11,
    color: colors.brightBlue,
    marginTop: 3,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  mapBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brightBlue,
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
  },
  dealContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: fontFamilies.bold,
  },
  dealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: fontFamilies.bold,
  },
  dealDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  menuSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  menuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  menuHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginRight: 4,
    fontFamily: fontFamilies.bold,
  },
  menuList: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4',
  },
  menuItemName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  menuPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regularPrice: {
    fontSize: 11,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 6,
    fontFamily: fontFamilies.regular,
  },
  studentPriceBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  studentPriceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
  menuDisclaimer: {
    fontSize: 10,
    color: '#059669',
    fontStyle: 'italic',
    marginTop: 6,
    fontFamily: fontFamilies.regular,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: fontFamilies.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openHoursText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontFamily: fontFamilies.regular,
  },
  getCouponBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  getCouponBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    fontFamily: fontFamilies.bold,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: fontFamilies.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalCafeName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  modalAreaText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  modalAddressSmall: {
    fontSize: 11,
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
    fontFamily: fontFamilies.regular,
  },
  couponCodeBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  couponCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1,
    fontFamily: fontFamilies.bold,
  },
  couponCodeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#D97706',
    marginVertical: 4,
    letterSpacing: 2,
    fontFamily: fontFamilies.bold,
  },
  couponDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: fontFamilies.bold,
  },
  couponInstruction: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    fontFamily: fontFamilies.regular,
  },
  qrSimulationBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  copyBtn: {
    backgroundColor: '#D97706',
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnSuccess: {
    backgroundColor: colors.success,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: fontFamilies.bold,
  },
});
