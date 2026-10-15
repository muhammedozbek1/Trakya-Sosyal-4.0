import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/fonts';
import { storageService } from '../services/storageService';
import {
  getCommunityModerators,
  getCommunityMembers,
  getMockChatMessages,
  getInitials,
} from '../data/communityDetails';

// expo-av bazı ortamlarda (örn. Expo Go) native modülü bulamayabiliyor ve
// statik import uygulamanın açılışta çökmesine yol açıyor. Bu yüzden koşullu
// yüklenir; bulunamazsa ses/video özellikleri mock (simülasyon) modda çalışır.
let Audio = null;
let VideoPlayer = null;
try {
  const expoAv = require('expo-av');
  Audio = expoAv.Audio || null;
  VideoPlayer = expoAv.Video || null;
} catch {
  console.warn('expo-av yüklenemedi, ses/video mock modda çalışacak.');
}
const AV_AVAILABLE = !!Audio && !!VideoPlayer;

const TABS = [
  { id: 'chat', label: 'Sohbet', icon: 'chatbubbles' },
  { id: 'location', label: 'Konum', icon: 'location' },
  { id: 'members', label: 'Üyeler', icon: 'shield-checkmark' },
];

function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

async function unloadSoundSafe(sound) {
  try {
    await sound?.unloadAsync();
  } catch {
    // yok say
  }
}

function openInMaps(location) {
  const query = encodeURIComponent(`${location} Edirne`);
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
}

export default function CommunityDetailScreen({ event, user, onBack, onLeave }) {
  const insets = useSafeAreaInsets();
  const { theme: colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('chat');
  const [membership, setMembership] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [overrides, setOverrides] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editError, setEditError] = useState('');
  const flatListRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recording, setRecording] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [activeSound, setActiveSound] = useState(null);
  const [mockTimer, setMockTimer] = useState(null);

  const communityColor = event?.communityColor || colors.primaryLight;

  // Rol kontrolü: sadece bu topluluğun admini yönetici yetkilerine sahip
  const isAdmin = user?.role === 'admin' && user?.managedCommunityId === event?.id;

  // Admin düzenlemeleri + mock veri birleşimi
  const displayEvent = { ...event, ...overrides };

  const loadData = async () => {
    const mem = await storageService.getCommunityMembership(event?.id);
    setMembership(mem);
    const stored = await storageService.getCommunityChatMessages(event?.id);
    setMessages([...getMockChatMessages(event), ...stored]);
    const allOverrides = await storageService.getCommunityOverrides();
    if (allOverrides[event?.id]) {
      setOverrides(allOverrides[event?.id]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ekran kapanınca / ses değişince önceki sesi durdur, mock zamanlayıcıyı temizle
  useEffect(() => {
    return () => {
      if (activeSound) {
        unloadSoundSafe(activeSound);
      }
      if (mockTimer) {
        clearTimeout(mockTimer);
      }
    };
  }, [activeSound, mockTimer]);

  // Kayıt süre sayacı
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setRecSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const scrollChatToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const buildBaseMessage = () => ({
    id: `user-${Date.now()}`,
    sender: membership?.fullName || user?.name || 'Sen',
    department: membership?.department || '',
    time: nowTime(),
    isOwn: true,
    isModerator: false,
    isAdmin: isAdmin,
  });

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    const msg = {
      ...buildBaseMessage(),
      kind: 'text',
      text,
    };
    setMessages((prev) => [...prev, msg]);
    setInputText('');
    await storageService.appendCommunityChatMessage(event?.id, msg);
    scrollChatToEnd();
  };

  // Fotoğraf / video seçimi (galeri)
  const handlePickMedia = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf veya video gönderebilmek için galeri izni vermen gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const kind = asset.type === 'video' ? 'video' : 'image';
      const msg = {
        ...buildBaseMessage(),
        kind,
        text: '',
        mediaUri: asset.uri,
        durationMs: kind === 'video' && asset.duration ? asset.duration * 1000 : 0,
      };
      setMessages((prev) => [...prev, msg]);
      await storageService.appendCommunityChatMessage(event?.id, msg);
      scrollChatToEnd();
    } catch (e) {
      console.warn('Medya seçilemedi:', e);
    }
  };

  // Ses kaydı başlat (native modül yoksa mock sayaçla simüle edilir)
  const handleStartRecording = async () => {
    if (!AV_AVAILABLE) {
      setRecording({ mock: true });
      setRecSeconds(0);
      setIsRecording(true);
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Ses kaydı gönderebilmek için mikrofon izni vermen gerekiyor.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setRecSeconds(0);
      setIsRecording(true);
    } catch (e) {
      console.warn('Kayıt başlatılamadı:', e);
      Alert.alert('Hata', 'Ses kaydı başlatılamadı, tekrar dene.');
    }
  };

  // Ses kaydını durdur ve gönder (send=false ise iptal)
  const handleStopRecording = async (send = true) => {
    if (!recording) {
      setIsRecording(false);
      return;
    }
    // Mock kayıt: gerçek dosya yok, süre sayacından simüle mesaj üretilir
    if (recording.mock || !AV_AVAILABLE) {
      const durationMs = Math.max(1000, recSeconds * 1000);
      setRecording(null);
      setIsRecording(false);
      setRecSeconds(0);
      if (send) {
        const msg = {
          ...buildBaseMessage(),
          kind: 'audio',
          text: '',
          mediaUri: null,
          mock: true,
          durationMs,
        };
        setMessages((prev) => [...prev, msg]);
        await storageService.appendCommunityChatMessage(event?.id, msg);
        scrollChatToEnd();
      }
      return;
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync().catch(() => null);
      const durationMs = status?.durationMillis || recSeconds * 1000;
      setRecording(null);
      setIsRecording(false);
      setRecSeconds(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (send && uri) {
        const msg = {
          ...buildBaseMessage(),
          kind: 'audio',
          text: '',
          mediaUri: uri,
          durationMs,
        };
        setMessages((prev) => [...prev, msg]);
        await storageService.appendCommunityChatMessage(event?.id, msg);
        scrollChatToEnd();
      }
    } catch (e) {
      console.warn('Kayıt durdurulamadı:', e);
      setRecording(null);
      setIsRecording(false);
      setRecSeconds(0);
    }
  };

  // Ses mesajını oynat / duraklat (native modül yoksa mock oynatma simüle edilir)
  const handleTogglePlay = async (msg) => {
    if (!AV_AVAILABLE || msg.mock || !msg.mediaUri) {
      if (mockTimer) {
        clearTimeout(mockTimer);
        setMockTimer(null);
      }
      if (playingId === msg.id) {
        setPlayingId(null);
        return;
      }
      setPlayingId(msg.id);
      const timer = setTimeout(() => {
        setPlayingId(null);
        setMockTimer(null);
      }, Math.min(msg.durationMs || 3000, 60000));
      setMockTimer(timer);
      return;
    }
    try {
      if (playingId === msg.id) {
        await unloadSoundSafe(activeSound);
        setActiveSound(null);
        setPlayingId(null);
        return;
      }
      await unloadSoundSafe(activeSound);
      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.mediaUri },
        { shouldPlay: true }
      );
      setActiveSound(sound);
      setPlayingId(msg.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          unloadSoundSafe(sound);
          setPlayingId(null);
          setActiveSound(null);
        }
      });
    } catch (e) {
      console.warn('Ses oynatılamadı:', e);
    }
  };

  const openEditModal = () => {
    setEditLocation(displayEvent?.location || '');
    setEditDate(displayEvent?.date || '');
    setEditTime(displayEvent?.time || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!editLocation.trim()) {
      setEditError('Lütfen buluşma mekanını gir.');
      return;
    }
    if (!editDate.trim() || !editTime.trim()) {
      setEditError('Lütfen tarih ve saat bilgisini gir.');
      return;
    }
    const saved = await storageService.saveCommunityOverride(event?.id, {
      location: editLocation.trim(),
      date: editDate.trim(),
      time: editTime.trim(),
    });
    if (saved) {
      setOverrides(saved);
      setIsEditModalOpen(false);
      Alert.alert('Kaydedildi', 'Buluşma konumu güncellendi.');
    } else {
      setEditError('Kaydedilemedi, tekrar dene.');
    }
  };

  const handleLeave = () => {
    Alert.alert('Topluluktan Ayrıl', 'Bu topluluktan ayrılmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: async () => {
          await storageService.removeCommunityMembership(event?.id);
          if (onLeave) onLeave(event?.id);
        },
      },
    ]);
  };

  // Ses dalgası çubukları (mesaj id'sinden deterministik yükseklikler)
  const renderWaveform = (seed, active) => {
    const bars = [];
    let hash = 0;
    const str = String(seed || '');
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 9973;
    }
    for (let i = 0; i < 18; i++) {
      const h = 6 + ((hash + i * 13) % 14);
      bars.push(
        <View
          key={i}
          style={[
            styles.waveBar,
            {
              height: h,
              backgroundColor: active ? '#FFFFFF' : `${communityColor}55`,
            },
          ]}
        />
      );
    }
    return <View style={styles.waveBars}>{bars}</View>;
  };

  const renderBubbleContent = (item, isOwn) => {
    const kind = item.kind || 'text';
    if (kind === 'image' && item.mediaUri) {
      return (
        <View>
          <Image
            source={{ uri: item.mediaUri }}
            style={styles.mediaImage}
            contentFit="cover"
          />
          <Text style={isOwn ? styles.ownBubbleTime : styles.otherBubbleTime}>{item.time}</Text>
        </View>
      );
    }
    if (kind === 'video') {
      return (
        <View>
          {VideoPlayer ? (
            <VideoPlayer
              source={{ uri: item.mediaUri }}
              style={styles.mediaVideo}
              useNativeControls
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mediaVideoFallback}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
              <Text style={styles.mediaVideoFallbackText}>
                {item.durationMs ? formatClock(item.durationMs) : 'Video'}
              </Text>
            </View>
          )}
          <Text style={isOwn ? styles.ownBubbleTime : styles.otherBubbleTime}>{item.time}</Text>
        </View>
      );
    }
    if (kind === 'audio') {
      const playing = playingId === item.id;
      return (
        <View>
          <View style={styles.audioRow}>
            <TouchableOpacity
              style={[
                styles.playBtn,
                { backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : `${communityColor}15` },
              ]}
              onPress={() => handleTogglePlay(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={16}
                color={isOwn ? '#FFFFFF' : communityColor}
              />
            </TouchableOpacity>
            {renderWaveform(item.id, isOwn)}
            <Text style={isOwn ? styles.audioTimeOwn : styles.audioTimeOther}>
              {formatClock(item.durationMs)}
            </Text>
          </View>
          <Text style={isOwn ? styles.ownBubbleTime : styles.otherBubbleTime}>{item.time}</Text>
        </View>
      );
    }
    return (
      <View>
        <Text style={isOwn ? styles.ownBubbleText : styles.otherBubbleText}>{item.text}</Text>
        <Text style={isOwn ? styles.ownBubbleTime : styles.otherBubbleTime}>{item.time}</Text>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.isOwn) {
      return (
        <View style={styles.ownBubbleRow}>
          <LinearGradient
            colors={[communityColor, `${communityColor}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ownBubble}
          >
            {item.isAdmin ? (
              <View style={styles.ownAdminBadge}>
                <Text style={styles.ownAdminBadgeText}>{"🛡️ Admin"}</Text>
              </View>
            ) : null}
            {renderBubbleContent(item, true)}
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={styles.otherBubbleRow}>
        <View style={[styles.msgAvatar, { backgroundColor: `${communityColor}15` }]}>
          <Text style={[styles.msgAvatarText, { color: communityColor }]}>
            {getInitials(item.sender)}
          </Text>
        </View>
        <View style={styles.otherBubble}>
          <View style={styles.msgSenderRow}>
            <Text style={styles.msgSender} numberOfLines={1}>{item.sender}</Text>
            {item.isModerator ? (
              <View style={[styles.miniModBadge, { backgroundColor: `${communityColor}15` }]}>
                <Text style={[styles.miniModBadgeText, { color: communityColor }]}>MOD</Text>
              </View>
            ) : null}
          </View>
          {renderBubbleContent(item, false)}
        </View>
      </View>
    );
  };

  const renderMemberRow = (member) => (
    <View key={member.id} style={styles.memberRow}>
      <View style={[styles.memberAvatar, { backgroundColor: `${member.color}15` }]}>
        <Text style={[styles.memberAvatarText, { color: member.color }]}>
          {getInitials(member.name)}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberDept} numberOfLines={1}>{member.department}</Text>
      </View>
      {member.isModerator ? (
        <View style={[styles.modBadge, { backgroundColor: `${member.color}15` }]}>
          <Ionicons name="shield-checkmark" size={12} color={member.color} />
          <Text style={[styles.modBadgeText, { color: member.color }]}>{member.role}</Text>
        </View>
      ) : null}
    </View>
  );

  const moderators = getCommunityModerators(event);
  const members = getCommunityMembers(event);

  return (
    <View style={styles.safeArea}>
      <StatusBar style={colors.statusBar} translucent />
      {/* Sade üst header: geri butonu + topluluk ismi */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.navTitle} numberOfLines={1}>{event?.communityName}</Text>
        </View>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Ionicons name="exit-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Yönetici paneli - sadece bu topluluğun admini görür */}
      {isAdmin ? (
        <View style={styles.adminPanel}>
          <View style={styles.adminPanelHeader}>
            <Ionicons name="settings" size={18} color="#7C3AED" />
            <Text style={styles.adminPanelTitle}>{"⚙️ Yönetici Paneli"}</Text>
            <View style={styles.adminRoleBadge}>
              <Text style={styles.adminRoleBadgeText}>{"🛡️ Admin"}</Text>
            </View>
          </View>
          <Text style={styles.adminPanelSub}>
            Bu topluluğun yöneticisisin. Buluşma konumunu düzenleyebilirsin.
          </Text>
          <TouchableOpacity
            style={styles.adminEditBtn}
            onPress={openEditModal}
            activeOpacity={0.85}
          >
            <Ionicons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.adminEditBtnText}>{"📍 Buluşma Konumu Ekle / Düzenle"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Segmentli sekmeler */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && { backgroundColor: communityColor }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={isActive ? '#FFFFFF' : colors.textMuted}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.id === 'chat' ? '💬 ' : tab.id === 'location' ? '📍 ' : '🛡️ '}
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sekme içerikleri */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.tabContent}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
          <View style={[styles.chatInputBar, { paddingBottom: 10 + insets.bottom }]}>
            {isRecording ? (
              <View style={styles.recBar}>
                <View style={styles.recDot} />
                <Text style={styles.recTimer}>{formatClock(recSeconds * 1000)}</Text>
                <Text style={styles.recHint}>{"Kaydediliyor..."}</Text>
                <TouchableOpacity
                  style={styles.recCancelBtn}
                  onPress={() => handleStopRecording(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recSendBtn, { backgroundColor: communityColor }]}
                  onPress={() => handleStopRecording(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handlePickMedia}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={22} color={communityColor} />
                </TouchableOpacity>
                <View style={styles.chatInputGlass}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Mesajını yaz..."
                    placeholderTextColor={colors.textLight}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.micBtn}
                    onPress={handleStartRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={18} color={communityColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: communityColor }]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {activeTab === 'location' && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.locationContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Harita simülasyon kartı */}
          <LinearGradient
            colors={['#0F2C59', '#1E4DB7', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mapCard}
          >
            <View style={styles.mapGrid} />
            <View style={styles.mapPinCircle}>
              <Ionicons name="location" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.mapCardTitle}>{displayEvent?.location}</Text>
            <Text style={styles.mapCardSub}>Edirne • Trakya Üniversitesi çevresi</Text>
            <TouchableOpacity
              style={styles.openMapBtn}
              onPress={() => openInMaps(displayEvent?.location)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={16} color={communityColor} />
              <Text style={[styles.openMapBtnText, { color: communityColor }]}>
                Harita Uygulamasında Aç
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Konum detay kartı */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${communityColor}15` }]}>
                <Ionicons name="business-outline" size={18} color={communityColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detailLabel}>MEKAN</Text>
                <Text style={styles.detailValue}>{displayEvent?.location}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${communityColor}15` }]}>
                <Ionicons name="calendar-outline" size={18} color={communityColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detailLabel}>TARİH</Text>
                <Text style={styles.detailValue}>{displayEvent?.date}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.detailIcon, { backgroundColor: `${communityColor}15` }]}>
                <Ionicons name="time-outline" size={18} color={communityColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detailLabel}>SAAT</Text>
                <Text style={styles.detailValue}>{displayEvent?.time}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'members' && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.membersContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Moderatörler</Text>
          <View style={styles.membersCard}>
            {moderators.map((m) => renderMemberRow(m))}
          </View>
          <Text style={styles.sectionTitle}>Üyeler ({members.length})</Text>
          <View style={styles.membersCard}>
            {members.map((m) => renderMemberRow(m))}
          </View>
        </ScrollView>
      )}

      {/* Admin konum düzenleme modalı */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalCard}>
            <LinearGradient
              colors={[communityColor, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editModalHeader}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.editModalTitle}>{"📍 Buluşma Konumu Düzenle"}</Text>
                <Text style={styles.editModalSub}>{event?.communityName}</Text>
              </View>
              <TouchableOpacity
                style={styles.editModalClose}
                onPress={() => setIsEditModalOpen(false)}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.editModalBody}>
              {editError ? (
                <View style={styles.editErrorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.editErrorText}>{editError}</Text>
                </View>
              ) : null}

              <Text style={styles.editLabel}>Buluşma Mekanı</Text>
              <View style={styles.editInputWrapper}>
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.editInput}
                  placeholder="Örn: Ayşekadın - Kafka Cafe"
                  placeholderTextColor={colors.textLight}
                  value={editLocation}
                  onChangeText={(v) => {
                    setEditLocation(v);
                    if (editError) setEditError('');
                  }}
                />
              </View>

              <Text style={styles.editLabel}>Tarih</Text>
              <View style={styles.editInputWrapper}>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.editInput}
                  placeholder="Örn: 14 Ekim Çarşamba"
                  placeholderTextColor={colors.textLight}
                  value={editDate}
                  onChangeText={(v) => {
                    setEditDate(v);
                    if (editError) setEditError('');
                  }}
                />
              </View>

              <Text style={styles.editLabel}>Saat</Text>
              <View style={styles.editInputWrapper}>
                <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.editInput}
                  placeholder="Örn: 16:00 - 18:00"
                  placeholderTextColor={colors.textLight}
                  value={editTime}
                  onChangeText={(v) => {
                    setEditTime(v);
                    if (editError) setEditError('');
                  }}
                />
              </View>

              <TouchableOpacity
                style={[styles.editSaveBtn, { backgroundColor: communityColor }]}
                onPress={handleSaveLocation}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.editSaveText}>Kaydet</Text>
              </TouchableOpacity>
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
    backgroundColor: colors.chatBg, // Soft buz mavisi / gece modu zemini
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
  leaveBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adminPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  adminPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminPanelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
    marginLeft: 6,
    flex: 1,
    fontFamily: fontFamilies.bold,
  },
  adminRoleBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  adminPanelSub: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 4,
    lineHeight: 15,
    fontFamily: fontFamilies.regular,
  },
  adminEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  adminEditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  ownAdminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ownAdminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 44, 89, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalCard: {
    width: '100%',
    backgroundColor: colors.glassCard,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  editModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  editModalSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  editModalClose: {
    padding: 6,
    marginLeft: 6,
  },
  editModalBody: {
    padding: 20,
  },
  editErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  editErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    fontFamily: fontFamilies.semiBold,
  },
  editInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  editInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
    fontFamily: fontFamilies.regular,
  },
  editSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 4,
  },
  editSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: fontFamilies.bold,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 5,
    fontFamily: fontFamilies.bold,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  chatList: {
    padding: 16,
    paddingBottom: 8,
  },
  ownBubbleRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  ownBubble: {
    maxWidth: '80%',
    borderRadius: 22,
    borderBottomRightRadius: 6,
    padding: 11,
    paddingHorizontal: 14,
    shadowColor: '#1E4DB7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  ownBubbleText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    lineHeight: 19,
    fontFamily: fontFamilies.regular,
  },
  ownBubbleTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
  otherBubble: {
    maxWidth: '78%',
    backgroundColor: colors.card,
    borderRadius: 22,
    borderBottomLeftRadius: 6,
    padding: 11,
    paddingHorizontal: 14,
    borderWidth: 0,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  msgSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  msgSender: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamilies.bold,
    flex: 1,
  },
  miniModBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 5,
  },
  miniModBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
  otherBubbleText: {
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 19,
    fontFamily: fontFamilies.regular,
  },
  otherBubbleTime: {
    fontSize: 10,
    color: '#C3CAD4',
    marginTop: 4,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  chatInputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  chatInputGlass: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 0,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    maxHeight: 90,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  recTimer: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    fontFamily: fontFamilies.bold,
  },
  recHint: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
    fontFamily: fontFamilies.regular,
  },
  recCancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  recSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  mediaImage: {
    width: 190,
    height: 140,
    borderRadius: 14,
  },
  mediaVideo: {
    width: 200,
    height: 140,
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  mediaVideoFallback: {
    width: 200,
    height: 140,
    borderRadius: 14,
    backgroundColor: '#0F2C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaVideoFallbackText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    fontFamily: fontFamilies.bold,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 170,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    height: 22,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  audioTimeOwn: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fontFamilies.regular,
  },
  audioTimeOther: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fontFamilies.regular,
  },
  locationContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  mapCard: {
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 22,
  },
  mapPinCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: fontFamilies.bold,
  },
  mapCardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
    fontFamily: fontFamilies.regular,
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  openMapBtnText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
    fontFamily: fontFamilies.bold,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
    fontFamily: fontFamilies.bold,
  },
  membersContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
    fontFamily: fontFamilies.bold,
  },
  membersCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: fontFamilies.bold,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  memberDept: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontFamily: fontFamilies.regular,
  },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
    fontFamily: fontFamilies.bold,
  },
});