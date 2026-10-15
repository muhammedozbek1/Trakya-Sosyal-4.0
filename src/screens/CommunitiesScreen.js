import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Linking,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamilies } from '../theme/fonts';
import { storageService } from '../services/storageService';
import {
  COMMUNITIES_DATA,
  COMMUNITY_CATEGORIES,
  getCategoryColor,
  getCommunityAbout,
} from '../data/communitiesData';
import { searchDepartments } from '../data/departments';

export default function CommunitiesScreen({ onBack, onOpenDetail, user }) {
  const insets = useSafeAreaInsets();
  const { theme: colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [view, setView] = useState('joined'); // 'joined' | 'discover' | 'calendar'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [joinModalEvent, setJoinModalEvent] = useState(null);
  const [infoModalEvent, setInfoModalEvent] = useState(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [modalError, setModalError] = useState('');
  const [deptFocused, setDeptFocused] = useState(false);
  const deptInputRef = useRef(null);

  // Bölüm otomatik önerileri (odaklı + en az 1 harf + birebir eşleşme yoksa)
  const deptSuggestions = useMemo(() => {
    if (!deptFocused) return [];
    return searchDepartments(department, 6);
  }, [department, deptFocused]);

  const handleSelectDepartment = (name) => {
    setDepartment(name);
    setDeptFocused(false);
    deptInputRef.current?.blur();
    if (modalError) setModalError('');
  };

  const loadMemberships = async () => {
    const all = await storageService.getCommunityMemberships();
    setJoinedEvents(Object.keys(all));
    // Admin konum düzenlemelerini de yükle (listede güncel görünsün)
    const allOverrides = await storageService.getCommunityOverrides();
    setOverrides(allOverrides);
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  const filteredEvents = useMemo(() => {
    const merged = COMMUNITIES_DATA.map((e) => ({ ...e, ...(overrides[e.id] || {}) }));
    if (selectedCategory === 'all') return merged;
    return merged.filter((e) => e.category === selectedCategory);
  }, [selectedCategory, overrides]);

  // Katılınan topluluklar (ana görünüm)
  const joinedList = useMemo(() => {
    const merged = COMMUNITIES_DATA.map((e) => ({ ...e, ...(overrides[e.id] || {}) }));
    return merged.filter((e) => joinedEvents.includes(e.id));
  }, [joinedEvents, overrides]);

  // Tüm etkinlikler takvim sıralı (veri sırası korunur)
  const calendarList = useMemo(() => {
    return COMMUNITIES_DATA.map((e) => ({ ...e, ...(overrides[e.id] || {}) }));
  }, [overrides]);

  const handleJoinPress = (event) => {
    if (joinedEvents.includes(event.id)) {
      // Zaten üye → direkt iç sayfaya git
      if (onOpenDetail) onOpenDetail(event);
      return;
    }
    // Cam efektli katılım modalını aç, isim alanını hazır kullanıcı adıyla doldur
    setFullName(user?.name || '');
    setDepartment('');
    setModalError('');
    setJoinModalEvent(event);
  };

  const handleConfirmJoin = async () => {
    const name = fullName.trim();
    const dept = department.trim();
    if (name.length < 3) {
      setModalError('Lütfen ad soyad bilgini gir.');
      return;
    }
    if (dept.length < 3) {
      setModalError('Lütfen bölüm ve sınıf bilgini gir. (Örn: Yazılım Mühendisliği - 3. Sınıf)');
      return;
    }
    await storageService.saveCommunityMembership(joinModalEvent.id, {
      fullName: name,
      department: dept,
    });
    const joinedEvent = joinModalEvent;
    setJoinModalEvent(null);
    await loadMemberships();
    if (onOpenDetail) onOpenDetail(joinedEvent);
  };

  // Bilgi modalından hızlı üyelik (form doldurmadan)
  const handleQuickJoin = async () => {
    const ev = infoModalEvent;
    if (!ev) return;
    if (joinedEvents.includes(ev.id)) {
      setInfoModalEvent(null);
      if (onOpenDetail) onOpenDetail(ev);
      return;
    }
    await storageService.saveCommunityMembership(ev.id, {
      fullName: user?.name || 'Trakya Öğrencisi',
      department: user?.department || user?.faculty || 'Trakya Üniversitesi Öğrencisi',
    });
    await loadMemberships();
    setInfoModalEvent(null);
    Alert.alert(
      'Aramıza Hoş Geldin! 🎉',
      `${ev.communityName} topluluğuna başarıyla üye oldun. Sohbet ve etkinlikler seni bekliyor!`
    );
  };

  const handleOpenMap = (event) => {
    const query = encodeURIComponent(`${event.location} Edirne`);
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

  const renderEventCard = ({ item }) => {
    const isJoined = joinedEvents.includes(item.id);
    const communityColor = item.communityColor || colors.primaryLight;

    return (
      <View style={styles.eventCard}>
        {/* Üst gradient şerit */}
        <LinearGradient
          colors={[communityColor, `${communityColor}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopStrip}
        />

        {/* Topluluk başlığı */}
        <View style={styles.communityRow}>
          <View style={[styles.communityLogo, { backgroundColor: `${communityColor}15` }]}>
            <Ionicons name={item.communityIcon || 'people'} size={24} color={communityColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.communityName} numberOfLines={1}>
              {item.communityName}
            </Text>
            <Text style={styles.communityShort}>{item.communityShortName}</Text>
          </View>
          {item.badge ? (
            <View style={[styles.badgePill, { backgroundColor: `${communityColor}15` }]}>
              <Text style={[styles.badgeText, { color: communityColor }]}>{item.badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Etkinlik adı & detayı */}
        <Text style={styles.eventTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.eventDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Mekan bilgisi */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={15} color={communityColor} />
          <Text style={styles.infoText} numberOfLines={1}>
            📍 {item.location}
          </Text>
        </View>

        {/* Tarih & saat */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={15} color={communityColor} />
          <Text style={styles.infoText} numberOfLines={1}>
            🕒 {item.date} • {item.time}
          </Text>
        </View>

        {/* Katılımcı sayısı */}
        <View style={styles.attendeesRow}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.attendeesText}>
            {item.attendeesCount} kişi katılıyor
            {isJoined ? ' • Sen de katılıyorsun 🎉' : ''}
          </Text>
        </View>

        {/* Butonlar */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setInfoModalEvent(item)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[communityColor, `${communityColor}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.infoBtnGradient}
            >
              <Ionicons name="information-circle" size={15} color="#FFFFFF" />
              <Text style={styles.infoBtnText}>Topluluk Hakkında Bilgi Al</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              { backgroundColor: isJoined ? colors.success : communityColor },
            ]}
            onPress={() => handleJoinPress(item)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isJoined ? 'arrow-forward-circle' : 'add-circle-outline'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.joinBtnText}>
              {isJoined ? 'İç Sayfaya Git' : 'Topluluğa Katıl'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[colors.primarySoft, colors.card]}
        style={styles.emptyIconCircle}
      >
        <Ionicons name="search-outline" size={40} color={colors.textLight} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Etkinlik Bulunamadı</Text>
      <Text style={styles.emptyDesc}>
        Bu kategoride henüz etkinlik yok. Farklı bir kategori seçerek tekrar dene.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Hero banner - mavi gradient + cam hissi */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroGlass}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="people" size={26} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroTitle}>Topluluklar & Etkinlikler 🎉</Text>
            <Text style={styles.heroSub}>
              {"Trakya'daki öğrenci topluluklarının buluşmalarını keşfet, katıl, sosyalleş!"}
            </Text>
          </View>
        </View>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{COMMUNITIES_DATA.length}</Text>
            <Text style={styles.heroStatLabel}>Etkinlik</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>
              {COMMUNITIES_DATA.reduce((s, e) => s + (e.attendeesCount || 0), 0)}
            </Text>
            <Text style={styles.heroStatLabel}>Katılımcı</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{joinedEvents.length}</Text>
            <Text style={styles.heroStatLabel}>Katıldıkların</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Kategori filtreleri - yatay kaydırılabilir çipler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {COMMUNITY_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const catColor = getCategoryColor(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                isSelected && { backgroundColor: catColor, borderColor: catColor },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={isSelected ? '#FFFFFF' : catColor}
              />
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

      {/* Sonuç başlığı */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>
          {selectedCategory === 'all'
            ? 'Tüm Etkinlikler'
            : COMMUNITY_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
        </Text>
        <Text style={styles.resultCount}>{filteredEvents.length} etkinlik</Text>
      </View>
    </View>
  );

  // Alt görünüm başlığı (keşif / takvim ekranlarından Katıldıklarım'a dönüş)
  const renderViewBar = (title, subtitle) => (
    <View style={styles.viewBar}>
      <TouchableOpacity
        style={styles.viewBackBtn}
        onPress={() => setView('joined')}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={18} color={colors.primaryLight} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.viewBarTitle}>{title}</Text>
        {subtitle ? <Text style={styles.viewBarSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  // Katılınan topluluk kartı (hızlı erişim: Chat'e Git)
  const renderJoinedCard = ({ item }) => {
    const communityColor = item.communityColor || colors.primaryLight;
    return (
      <View style={styles.eventCard}>
        <LinearGradient
          colors={[communityColor, `${communityColor}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardTopStrip}
        />
        <View style={styles.communityRow}>
          <View style={[styles.communityLogo, { backgroundColor: `${communityColor}15` }]}>
            <Ionicons name={item.communityIcon || 'people'} size={24} color={communityColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.communityName} numberOfLines={1}>
              {item.communityName}
            </Text>
            <Text style={styles.communityShort}>{item.communityShortName}</Text>
          </View>
          <View style={[styles.badgePill, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.badgeText, { color: '#059669' }]}>Üyesin</Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={15} color={communityColor} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={15} color={communityColor} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.date} • {item.time}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setInfoModalEvent(item)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[communityColor, `${communityColor}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.infoBtnGradient}
            >
              <Ionicons name="information-circle" size={15} color="#FFFFFF" />
              <Text style={styles.infoBtnText}>Topluluk Hakkında Bilgi Al</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: communityColor }]}
            onPress={() => onOpenDetail && onOpenDetail(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
            <Text style={styles.joinBtnText}>{"Chat'e Git"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Katılım yoksa yönlendirici boş durum
  const renderJoinedEmpty = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[colors.primarySoft, colors.card]}
        style={styles.emptyIconCircle}
      >
        <Ionicons name="people-outline" size={40} color={colors.primaryLight} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{"Henüz bir topluluğa katılmadın"}</Text>
      <Text style={styles.emptyDesc}>
        {"Aşağıdaki butonlardan yeni toplulukları keşfet!"}
      </Text>
      <TouchableOpacity
        style={styles.emptyCtaBtn}
        onPress={() => setView('discover')}
        activeOpacity={0.85}
      >
        <Ionicons name="compass-outline" size={16} color="#FFFFFF" />
        <Text style={styles.emptyCtaText}>{"Toplulukları Keşfet"}</Text>
      </TouchableOpacity>
    </View>
  );

  // Takvim satırı: tüm toplulukların buluşma programı
  const renderCalendarRow = ({ item }) => {
    const communityColor = item.communityColor || colors.primaryLight;
    return (
      <View style={styles.calCard}>
        <View style={[styles.calDateBox, { backgroundColor: `${communityColor}15` }]}>
          <Ionicons name="calendar" size={20} color={communityColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.calDateText}>{item.date}</Text>
          <Text style={styles.calTimeText}>{item.time}</Text>
          <Text style={styles.calTitleText} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.calLocText} numberOfLines={1}>
            {item.communityShortName} • {item.location}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.calMapBtn}
          onPress={() => handleOpenMap(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={16} color={communityColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style={colors.statusBar} translucent />
      {/* Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.navTitle}>Topluluklar & Etkinlikler</Text>
          <Text style={styles.navSubtitle}>Buluşmalar, Atölyeler & Sosyal Etkinlikler</Text>
        </View>
        <View style={styles.badgeTop}>
          <Text style={styles.badgeTopText}>
            {view === 'joined'
              ? `${joinedList.length} Topluluk`
              : view === 'calendar'
                ? `${calendarList.length} Buluşma`
                : `${filteredEvents.length} Etkinlik`}
          </Text>
        </View>
      </View>

      {view === 'joined' && (
        <FlatList
          data={joinedList}
          keyExtractor={(item) => item.id}
          renderItem={renderJoinedCard}
          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{"Katıldığın Topluluklar"}</Text>
              <Text style={styles.resultCount}>{joinedList.length} topluluk</Text>
            </View>
          }
          ListEmptyComponent={renderJoinedEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {view === 'discover' && (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          ListHeaderComponent={
            <View>
              {renderViewBar('Topluluk Keşfet', 'Katılabileceğin tüm topluluklar')}
              {renderHeader()}
            </View>
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={7}
          initialNumToRender={5}
        />
      )}

      {view === 'calendar' && (
        <FlatList
          data={calendarList}
          keyExtractor={(item) => item.id}
          renderItem={renderCalendarRow}
          ListHeaderComponent={renderViewBar('Buluşma Takvimi', 'Kafeler, saatler ve mekanlar')}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Alt aksiyon barı: yan yana 2 esnek buton */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtnJoin}
          onPress={() => setView('discover')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={view === 'discover' ? [colors.primaryLight, colors.primary] : ['#3B82F6', '#1E4DB7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionBtnGradient}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnJoinText}>{"Yeni Topluluğa Katıl"}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtnCal, view === 'calendar' && styles.actionBtnCalActive]}
          onPress={() => setView('calendar')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={view === 'calendar' ? '#FFFFFF' : colors.primaryLight}
          />
          <Text
            style={[
              styles.actionBtnCalText,
              view === 'calendar' && styles.actionBtnCalTextActive,
            ]}
          >
            {"Tüm Etkinlikler"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cam efektli katılım modalı */}
      <Modal
        visible={joinModalEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[
                joinModalEvent?.communityColor || colors.primaryLight,
                colors.primary,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalLogoBox}>
                <Ionicons
                  name={joinModalEvent?.communityIcon || 'people'}
                  size={26}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalCommunityName} numberOfLines={1}>
                  {joinModalEvent?.communityName}
                </Text>
                <Text style={styles.modalEventTitle} numberOfLines={1}>
                  {joinModalEvent?.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setJoinModalEvent(null)}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalInfo}>
                Topluluğa katılmak için bilgilerini gir. Kaydın bu cihazda saklanır.
              </Text>

              {modalError ? (
                <View style={styles.modalErrorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              ) : null}

              <Text style={styles.modalLabel}>Ad Soyad</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Örn: Emre Yılmaz"
                  placeholderTextColor={colors.textLight}
                  value={fullName}
                  onChangeText={(v) => {
                    setFullName(v);
                    if (modalError) setModalError('');
                  }}
                />
              </View>

              <Text style={styles.modalLabel}>Bölüm / Sınıf</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="school-outline" size={18} color={colors.textMuted} />
                <TextInput
                  ref={deptInputRef}
                  style={styles.modalInput}
                  placeholder="Örn: Yazılım Mühendisliği - 3. Sınıf"
                  placeholderTextColor={colors.textLight}
                  value={department}
                  onChangeText={(v) => {
                    setDepartment(v);
                    if (modalError) setModalError('');
                  }}
                  onFocus={() => setDeptFocused(true)}
                  onBlur={() => setTimeout(() => setDeptFocused(false), 150)}
                />
              </View>

              {deptSuggestions.length > 0 ? (
                <View style={styles.suggestionBox}>
                  {deptSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectDepartment(item.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="school" size={16} color={colors.primaryLight} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.suggestionName}>{item.name}</Text>
                        <Text style={styles.suggestionFaculty}>{item.faculty}</Text>
                      </View>
                      <Ionicons name="arrow-up-left" size={14} color={colors.textLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: joinModalEvent?.communityColor || colors.primaryLight },
                ]}
                onPress={handleConfirmJoin}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalConfirmText}>Kaydol ve Katıl</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bilgilendirme modalı: topluluk hakkında + üyelik CTA */}
      <Modal
        visible={infoModalEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[
                infoModalEvent?.communityColor || colors.primaryLight,
                colors.primary,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalLogoBox}>
                <Ionicons
                  name={infoModalEvent?.communityIcon || 'people'}
                  size={26}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalCommunityName} numberOfLines={1}>
                  {infoModalEvent?.communityName}
                </Text>
                <Text style={styles.modalEventTitle} numberOfLines={1}>
                  {infoModalEvent?.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setInfoModalEvent(null)}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.infoAboutBox}>
                <Ionicons
                  name="bulb-outline"
                  size={18}
                  color={infoModalEvent?.communityColor || colors.primaryLight}
                />
                <Text style={styles.infoAboutText}>
                  {infoModalEvent ? getCommunityAbout(infoModalEvent) : ''}
                </Text>
              </View>

              <Text style={styles.infoQuestion}>
                {infoModalEvent && joinedEvents.includes(infoModalEvent.id)
                  ? 'Zaten bu topluluğun üyesisin 🎉'
                  : 'Bu topluluğa üye olmak ister misin?'}
              </Text>

              <View style={styles.infoBtnRow}>
                <TouchableOpacity
                  style={styles.infoDeclineBtn}
                  onPress={() => setInfoModalEvent(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.infoDeclineText}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.infoJoinBtn}
                  onPress={handleQuickJoin}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.infoJoinText}>
                    {infoModalEvent && joinedEvents.includes(infoModalEvent.id)
                      ? 'Topluluk Sayfasına Git'
                      : 'Evet, Üye Ol'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    fontFamily: fontFamilies.bold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heroGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    lineHeight: 16,
    fontFamily: fontFamilies.regular,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryContainer: {
    paddingBottom: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fontFamilies.semiBold,
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  resultCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  viewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  viewBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  viewBarSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  calCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  calDateBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  calTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    marginTop: 1,
    fontFamily: fontFamilies.bold,
  },
  calTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    fontFamily: fontFamilies.bold,
  },
  calLocText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  calMapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtnJoin: {
    flex: 1,
    marginRight: 6,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnJoinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  actionBtnCal: {
    flex: 1,
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  actionBtnCalActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  actionBtnCalText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  actionBtnCalTextActive: {
    color: '#FFFFFF',
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTopStrip: {
    height: 5,
    width: '100%',
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  communityLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  communityShort: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamilies.bold,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  eventDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    paddingHorizontal: 16,
    marginTop: 3,
    fontFamily: fontFamilies.regular,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  attendeesText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 5,
    fontFamily: fontFamilies.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
    fontFamily: fontFamilies.bold,
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  infoBtn: {
    flex: 1.2,
    marginRight: 8,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  infoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
    fontFamily: fontFamilies.bold,
  },
  infoAboutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  infoAboutText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginLeft: 8,
    fontFamily: fontFamilies.regular,
  },
  infoQuestion: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: fontFamilies.bold,
  },
  infoBtnRow: {
    flexDirection: 'row',
  },
  infoDeclineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 6,
  },
  infoDeclineText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  infoJoinBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    marginLeft: 6,
  },
  infoJoinText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 44, 89, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.glassCard,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  modalCommunityName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  modalEventTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  modalCloseBtn: {
    padding: 6,
    marginLeft: 6,
  },
  modalBody: {
    padding: 20,
  },
  modalInfo: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
    fontFamily: fontFamilies.regular,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    fontFamily: fontFamilies.semiBold,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  modalInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
    fontFamily: fontFamilies.regular,
  },
  suggestionBox: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: -8,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#1E4DB7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  suggestionFaculty: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 4,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: fontFamilies.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 24,
    fontFamily: fontFamilies.regular,
  },
});