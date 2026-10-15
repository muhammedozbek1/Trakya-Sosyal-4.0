import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { DAYS, INITIAL_COURSES } from '../data/sampleSchedule';
import { MOTIVATION_QUOTES, FRIENDLY_COURSE_TIPS } from '../data/motivationQuotes';
import { storageService } from '../services/storageService';
import {
  sendTestNotification,
  scheduleClassNotification,
} from '../services/notificationService';
import {
  processScheduleImageOCR,
  SAMPLE_TRAKYA_SCHEDULES,
} from '../utils/scheduleOCRParser';

export default function AcademicScreen({
  onBack,
  initialCourseIdToOpen,
  onClearInitialCourseId,
}) {
  const insets = useSafeAreaInsets();
  const { theme: colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedDay, setSelectedDay] = useState('Pazartesi');
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState(null);
  const [testStatus, setTestStatus] = useState('');

  // 📸 OCR / Fotoğraftan Aktarma State'leri
  const [isOCRActionSheetOpen, setIsOCRActionSheetOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState(null);
  const [scannedCoursesPreview, setScannedCoursesPreview] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Motivasyon köşesi - Akademi sekmesine girildiğinde rastgele veya sırayla seçilir
  // KESİNLİKLE bildirim olarak gönderilmez, sadece bu ekranda gösterilir.
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATION_QUOTES.length)
  );

  // Yeni ders form state
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:30');
  const [newEndTime, setNewEndTime] = useState('11:15');
  const [newDay, setNewDay] = useState('Pazartesi');
  const [notifyBefore, setNotifyBefore] = useState(true);
  const [notifyStart, setNotifyStart] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  // Bildirimden bir courseId ile gelinmişse detay kartını otomatik aç
  useEffect(() => {
    if (initialCourseIdToOpen && courses.length > 0) {
      const target = courses.find((c) => c.id === initialCourseIdToOpen);
      if (target) {
        setSelectedDay(target.day);
        setSelectedDetailCourse(target);
      }
      if (onClearInitialCourseId) {
        onClearInitialCourseId();
      }
    }
  }, [initialCourseIdToOpen, courses]);

  const loadCourses = async () => {
    const saved = await storageService.getCourses();
    if (saved && saved.length > 0) {
      setCourses(saved);
    }
  };

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
  };

  // 📸 1. Galeriden veya Kameradan Görsel Seçme
  const handlePickImage = async (useCamera = false) => {
    setIsOCRActionSheetOpen(false);

    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          useCamera
            ? 'Ders programı fotoğrafı çekebilmek için kamera izni vermeniz gerekmektedir.'
            : 'Ders programı görselini seçebilmek için galeri izni vermeniz gerekmektedir.'
        );
        return;
      }

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setScannedImageUri(uri);
        startOCRProcessing(uri, 0);
      }
    } catch (err) {
      console.warn('Görsel seçme hatası:', err);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir sorun oluştu.');
    }
  };

  // 📸 2. Örnek Trakya OBS Şablonu ile Test
  const handleUseSampleTemplate = (templateIdx) => {
    setIsOCRActionSheetOpen(false);
    setScannedImageUri(null);
    startOCRProcessing(null, templateIdx);
  };

  // 📸 3. OCR Analiz İşlemini Başlat
  const startOCRProcessing = async (imageUri, templateIdx) => {
    setIsScanning(true);
    try {
      const res = await processScheduleImageOCR(imageUri, templateIdx);
      if (res && res.courses) {
        setScannedCoursesPreview(res.courses);
        setIsScanning(false);
        setIsConfirmModalOpen(true);
      } else {
        setIsScanning(false);
        Alert.alert('Ayrıştırma Hatası', 'Görselden ders verisi okunamadı.');
      }
    } catch (e) {
      setIsScanning(false);
      Alert.alert('Hata', 'Ders programı analiz edilirken bir hata oluştu.');
    }
  };

  // 📸 4. Taranan Dersler Önizlemesinden Ders Çıkar
  const handleRemovePreviewCourse = (index) => {
    setScannedCoursesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // 📸 5. Onayla ve Tümünü Programa Ekle
  const handleConfirmAndAddAll = async () => {
    if (scannedCoursesPreview.length === 0) {
      Alert.alert('Uyarı', 'Listede onaylanacak ders bulunmuyor.');
      return;
    }

    // Mevcut programla birleştir
    const updated = [...courses, ...scannedCoursesPreview];
    setCourses(updated);
    await storageService.saveCourses(updated);

    // Her ders için arka plan bildirimlerini kur
    for (const c of scannedCoursesPreview) {
      await scheduleClassNotification(c);
    }

    setIsConfirmModalOpen(false);
    setScannedImageUri(null);

    Alert.alert(
      'Ders Programı Başarıyla Aktarıldı! 🎉',
      `${scannedCoursesPreview.length} adet ders haftalık takviminize işlendi.\n• Her ders için dersten 30 dk önce ve başlangıçta bildirim gönderilecek!`
    );
  };

  const handleTestNotification = async (courseId) => {
    setTestStatus('Bildirim gönderiliyor...');
    const targetId = courseId || (courses.length > 0 ? courses[0].id : 'course-1');
    const ok = await sendTestNotification(2, targetId);
    if (ok) {
      setTestStatus('Bildirim iletildi! Tıklayınca bu dersin Detay Kartı açılacak.');
      setTimeout(() => setTestStatus(''), 4500);
    } else {
      setTestStatus('Bildirim izni verilmedi veya desteklenmiyor.');
      setTimeout(() => setTestStatus(''), 4000);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ders adını giriniz.');
      return;
    }

    const newCourse = {
      id: 'course-' + Date.now(),
      name: newCourseName.trim(),
      code: newCourseCode.trim() || 'DERS-101',
      instructor: newInstructor.trim() || 'Öğretim Üyesi',
      day: newDay,
      startTime: newStartTime.trim() || '09:00',
      endTime: newEndTime.trim() || '11:00',
      location: newLocation.trim() || 'Merkezi Derslikler',
      notifyHalfHourBefore: notifyBefore,
      notifyOnStart: notifyStart,
      color: '#1E4DB7',
    };

    const updated = [...courses, newCourse];
    setCourses(updated);
    await storageService.saveCourses(updated);

    if (notifyBefore || notifyStart) {
      await scheduleClassNotification(newCourse);
    }

    setNewCourseName('');
    setNewCourseCode('');
    setNewInstructor('');
    setNewLocation('');
    setIsAddModalOpen(false);

    Alert.alert(
      'Ders Eklendi! 🎉',
      `"${newCourse.name}" dersi tanımlandı.\n• 30 dk önce ve başlangıçta telefonunuza bildirim gönderilecek!`
    );
  };

  const handleDeleteCourse = async (courseId) => {
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    await storageService.saveCourses(updated);
    if (selectedDetailCourse?.id === courseId) {
      setSelectedDetailCourse(null);
    }
  };

  // Belirli bir günün ders sıralamasını hesaplama fonksiyonu (Örn: "Günün 1/4. dersi")
  const getCourseOrderInfo = (course) => {
    if (!course) return '';
    const dayList = courses
      .filter((c) => c.day === course.day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const index = dayList.findIndex((c) => c.id === course.id);
    if (index !== -1) {
      return `Günün ${index + 1}/${dayList.length}. dersi`;
    }
    return 'Günün programı';
  };

  // Her kartta sadece tek bir tatlı / sempatik uyarı gösterme fonksiyonu
  const getCourseTip = (course) => {
    if (!course) return FRIENDLY_COURSE_TIPS[0];
    let hash = 0;
    const str = course.id || course.name || '';
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i)) % FRIENDLY_COURSE_TIPS.length;
    }
    return FRIENDLY_COURSE_TIPS[hash];
  };

  const dayCourses = courses.filter((c) => c.day === selectedDay);
  const activeQuote = MOTIVATION_QUOTES[currentQuoteIndex];

  return (
    <View style={styles.safeArea}>
      <StatusBar style={colors.statusBar} translucent />
      {/* Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.navTitle}>Ders Programı & Bildirimler</Text>
          <Text style={styles.navSubtitle}>30 Dk Önce & Başlama Alarmları</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Ders Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 🌟 1. MOTİVASYON KÖŞESİ (GÜNÜN SÖZÜ) */}
        {/* ⚠️ KRİTİK KURAL: Bu sözler kesinlikle bildirim olarak gönderilmez, sadece bu ekranda gösterilir. */}
        <View style={styles.motivationCard}>
          <View style={styles.motivationHeader}>
            <View style={styles.motivationTag}>
              <Ionicons name="sparkles" size={14} color="#D97706" />
              <Text style={styles.motivationTagText}>Günün Akademik Motivasyonu</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshQuoteBtn}
              onPress={handleNextQuote}
              title="Yeni Söz"
            >
              <Ionicons name="refresh" size={16} color="#B45309" />
            </TouchableOpacity>
          </View>

          <Text style={styles.quoteText}>"{activeQuote?.quote}"</Text>
          <Text style={styles.quoteAuthor}>— {activeQuote?.author}</Text>
        </View>

        {/* 📸 2. FOTOĞRAFTAN DERS PROGRAMI YÜKLEME BUTONU (OCR / AI PARSING) */}
        <TouchableOpacity
          style={styles.ocrImportCard}
          onPress={() => setIsOCRActionSheetOpen(true)}
          activeOpacity={0.88}
        >
          <View style={styles.ocrIconBox}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.ocrTagRow}>
              <Text style={styles.ocrCardTitle}>Fotoğraftan Ders Programı Yükle 📸</Text>
              <View style={styles.ocrBadge}>
                <Ionicons name="sparkles" size={12} color="#D97706" />
                <Text style={styles.ocrBadgeText}>AI OCR</Text>
              </View>
            </View>
            <Text style={styles.ocrCardSub}>
              OBS ekran görüntünü veya fotoğrafını çek; dersler, saatler ve amfiler otomatik çıkarılsın.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2563EB" />
        </TouchableOpacity>

        {/* 🔔 3. BİLDİRİM MOTORU BANNER & ANLIK TEST */}
        <View style={styles.notificationBanner}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bellBadge}>
              <Ionicons name="notifications" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bannerTitle}>Otomatik Hatırlatıcı Motoru Aktif</Text>
              <Text style={styles.bannerSubtitle}>
                Ders bildirimi geldiğinde tıkladığında doğrudan ilgili dersin detay kartı açılır.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTestNotification(courses[0]?.id)}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.testBtnText}>Telefonda Şimdi Bildirim Test Et (Tıkla & Gör)</Text>
          </TouchableOpacity>

          {testStatus ? <Text style={styles.testStatusText}>{testStatus}</Text> : null}
        </View>

        {/* Gün Seçici */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            const count = courses.filter((c) => c.day === day).length;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                  {day}
                </Text>
                <View
                  style={[
                    styles.dayCountBadge,
                    isSelected && { backgroundColor: '#FFFFFF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCountText,
                      isSelected && { color: '#059669', fontWeight: '800' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Seçilen Günün Dersleri */}
        <View style={styles.courseListHeader}>
          <Text style={styles.dayHeading}>{selectedDay} Günü Dersleri</Text>
          <Text style={styles.dayHeadingCount}>{dayCourses.length} Ders</Text>
        </View>

        {dayCourses.map((course) => {
          const orderText = getCourseOrderInfo(course);
          return (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => setSelectedDetailCourse(course)}
              activeOpacity={0.9}
            >
              <View style={styles.courseTopRow}>
                <View style={[styles.courseColorBar, { backgroundColor: course.color || '#059669' }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.codeRow}>
                    <View style={styles.badgeGroup}>
                      <Text style={styles.courseCode}>{course.code}</Text>
                      <View style={styles.orderPillSmall}>
                        <Text style={styles.orderPillSmallText}>{orderText}</Text>
                      </View>
                    </View>
                    <Text style={styles.timeTag}>
                      {course.startTime} - {course.endTime}
                    </Text>
                  </View>

                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.instructorText}>{course.instructor}</Text>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.locationText}>{course.location}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteCourse(course.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Hızlı Detay ve Bildirim Barı */}
              <View style={styles.cardFooterBar}>
                <View style={styles.footerNotifyStatus}>
                  <Ionicons
                    name="alarm"
                    size={14}
                    color={course.notifyHalfHourBefore ? '#2563EB' : colors.textLight}
                  />
                  <Text style={styles.footerNotifyText}>
                    {course.notifyHalfHourBefore ? '30 Dk Bildirimi Açık' : 'Bildirim Kapalı'}
                  </Text>
                </View>
                <View style={styles.detailLink}>
                  <Text style={styles.detailLinkText}>Detay Kartı Aç</Text>
                  <Ionicons name="chevron-forward" size={14} color="#059669" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {dayCourses.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyCardTitle}>{selectedDay} günü kayıtlı ders yok</Text>
            <Text style={styles.emptyCardSub}>
              Yukarıdaki "Fotoğraftan Ders Programı Yükle" veya "Ders Ekle" butonuna basarak programını doldurabilirsin.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 🎯 4. DERS DETAY KARTI (MODAL) */}
      <Modal
        visible={selectedDetailCourse !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedDetailCourse(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailCard}>
            <TouchableOpacity
              style={styles.detailCloseBtn}
              onPress={() => setSelectedDetailCourse(null)}
            >
              <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.detailHeaderBox}>
              <View style={styles.orderBadge}>
                <Ionicons name="calendar" size={14} color="#FFFFFF" />
                <Text style={styles.orderBadgeText}>
                  {selectedDetailCourse ? getCourseOrderInfo(selectedDetailCourse) : ''}
                </Text>
              </View>
              <View style={styles.dayTagBadge}>
                <Text style={styles.dayTagText}>{selectedDetailCourse?.day}</Text>
              </View>
            </View>

            <Text style={styles.detailCourseCode}>{selectedDetailCourse?.code}</Text>
            <Text style={styles.detailCourseName}>{selectedDetailCourse?.name}</Text>

            <View style={styles.detailInfoGrid}>
              <View style={styles.gridItem}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="location" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.gridLabel}>DERSLİK / AMFİ</Text>
                  <Text style={styles.gridValue}>{selectedDetailCourse?.location}</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="person" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.gridLabel}>ÖĞRETİM ELEMANI / HOCA</Text>
                  <Text style={styles.gridValue}>{selectedDetailCourse?.instructor}</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.gridLabel}>BAŞLANGIÇ & BİTİŞ</Text>
                  <Text style={styles.gridValue}>
                    {selectedDetailCourse?.startTime} - {selectedDetailCourse?.endTime}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailNotifyStatusRow}>
              <View style={styles.notifyStatusPill}>
                <Ionicons
                  name={selectedDetailCourse?.notifyHalfHourBefore ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={selectedDetailCourse?.notifyHalfHourBefore ? '#059669' : '#94A3B8'}
                />
                <Text style={styles.notifyStatusText}>30 Dk Önce Alarm</Text>
              </View>

              <View style={styles.notifyStatusPill}>
                <Ionicons
                  name={selectedDetailCourse?.notifyOnStart ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={selectedDetailCourse?.notifyOnStart ? '#059669' : '#94A3B8'}
                />
                <Text style={styles.notifyStatusText}>Başlama Uyarısı</Text>
              </View>
            </View>

            {/* 💬 TATLI / SEMPATİK UYARI (HER KARTTA SADECE BİR SÖZ) */}
            <View style={styles.friendlyTipsBox}>
              <View style={styles.tipItemRow}>
                <Ionicons name="sparkles" size={16} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.tipItemText}>
                  {getCourseTip(selectedDetailCourse)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailPrimaryBtn}
              onPress={() => setSelectedDetailCourse(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.detailPrimaryBtnText}>Tamam, Derse Hazırım! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📸 5. FOTOĞRAF SEÇİM MENÜSÜ MODALI (ACTION SHEET) */}
      <Modal
        visible={isOCRActionSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOCRActionSheetOpen(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetCard}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Fotoğraftan Ders Programı Yükle</Text>
            <Text style={styles.actionSheetSub}>
              Yüklenen görseldeki ders saatleri, amfiler ve ders adları yapay zeka ile otomatik tespit edilir.
            </Text>

            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="images" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetOptionTitle}>Galeriden Ekran Görüntüsü Seç 🖼️</Text>
                <Text style={styles.sheetOptionSub}>OBS veya telefonundaki ders programı görüntüsü</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="camera" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetOptionTitle}>Kamerayı Aç ve Fotoğraf Çek 📷</Text>
                <Text style={styles.sheetOptionSub}>Bilgisayar ekranındaki veya kağıttaki programı çek</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>

            {/* Hızlı Örnek Şablonlar ile Test */}
            <View style={styles.templateDividerBox}>
              <Text style={styles.templateDividerText}>VEYA ÖRNEK TRAKYA OBS ŞABLONUYLA DENE</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => handleUseSampleTemplate(0)}
              activeOpacity={0.8}
            >
              <View style={[styles.sheetIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={22} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetOptionTitle}>Trakya Mühendislik OBS Programı 📄</Text>
                <Text style={styles.sheetOptionSub}>6 ders, amfiler ve hoca bilgisiyle anında test</Text>
              </View>
              <Ionicons name="flash-outline" size={18} color="#D97706" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setIsOCRActionSheetOpen(false)}
            >
              <Text style={styles.sheetCloseText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ⏳ 6. OCR TARAMA VE AYRIŞTIRMA YÜKLENİYOR MODALI */}
      <Modal visible={isScanning} transparent animationType="fade">
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningCard}>
            {scannedImageUri ? (
              <Image source={{ uri: scannedImageUri }} style={styles.thumbnailPreview} />
            ) : (
              <View style={styles.scanningDocIcon}>
                <Ionicons name="scan-circle" size={64} color="#2563EB" />
              </View>
            )}
            <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 14 }} />
            <Text style={styles.scanningTitle}>Ders Programı Analiz Ediliyor...</Text>
            <Text style={styles.scanningSub}>
              Tablo çizgileri taranıyor, günler, amfiler ve saatler otomatik ayrıştırılıyor 🔍
            </Text>
          </View>
        </View>
      </Modal>

      {/* ✅ 7. TARANAN DERSLER ÖNİZLEME & ONAYLAMA EKRANI (CONFIRM SCREEN) */}
      <Modal
        visible={isConfirmModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsConfirmModalOpen(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.confirmBadge}>
                  <Ionicons name="checkmark-done-circle" size={16} color="#059669" />
                  <Text style={styles.confirmBadgeText}>OCR Taraması Tamamlandı</Text>
                </View>
                <Text style={styles.confirmTitle}>
                  Taranan Dersler Önizlemesi ({scannedCoursesPreview.length} Ders)
                </Text>
                <Text style={styles.confirmSub}>
                  Aşağıdaki dersleri inceleyebilir, istemediklerinizi silebilirsiniz.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsConfirmModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.previewListScroll}>
              {scannedCoursesPreview.map((item, idx) => (
                <View key={item.id || idx} style={styles.previewItemCard}>
                  <View style={styles.previewItemHeader}>
                    <View style={styles.previewDayPill}>
                      <Text style={styles.previewDayText}>{item.day}</Text>
                    </View>
                    <Text style={styles.previewTimeText}>
                      ⏰ {item.startTime} - {item.endTime}
                    </Text>
                    <TouchableOpacity
                      style={styles.previewRemoveBtn}
                      onPress={() => handleRemovePreviewCourse(idx)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.previewCourseName}>{item.name}</Text>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewCodeBadge}>{item.code}</Text>
                    <Text style={styles.previewLocationText}>📍 {item.location}</Text>
                  </View>
                  <Text style={styles.previewInstructorText}>👨‍🏫 {item.instructor}</Text>
                </View>
              ))}

              {scannedCoursesPreview.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted }}>Tüm dersler listeden çıkarıldı.</Text>
                </View>
              )}
            </ScrollView>

            {/* Onay Butonları */}
            <View style={styles.confirmActionRow}>
              <TouchableOpacity
                style={styles.confirmAddBtn}
                onPress={handleConfirmAndAddAll}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.confirmAddBtnText}>
                  Tümünü Onayla ve Programa Ekle ({scannedCoursesPreview.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DERS EKLE MODALI (MANUEL) */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Yeni Ders Tanımla (Manuel)</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ders Adı *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Örn: Mobil Programlama"
                  placeholderTextColor={colors.textLight}
                  value={newCourseName}
                  onChangeText={setNewCourseName}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Ders Kodu</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="BM-302"
                    placeholderTextColor={colors.textLight}
                    value={newCourseCode}
                    onChangeText={setNewCourseCode}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                  <Text style={styles.inputLabel}>Öğretim Üyesi</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Doç. Dr. ..."
                    placeholderTextColor={colors.textLight}
                    value={newInstructor}
                    onChangeText={setNewInstructor}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ders Günü</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {DAYS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.modalDayChip, newDay === d && styles.modalDayChipActive]}
                      onPress={() => setNewDay(d)}
                    >
                      <Text
                        style={[
                          styles.modalDayChipText,
                          newDay === d && styles.modalDayChipTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Başlangıç Saati</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="09:30"
                    placeholderTextColor={colors.textLight}
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Bitiş Saati</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="11:15"
                    placeholderTextColor={colors.textLight}
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Derslik / Amfi</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Örn: Mühendislik Fakültesi Amfi-2"
                  placeholderTextColor={colors.textLight}
                  value={newLocation}
                  onChangeText={setNewLocation}
                />
              </View>

              <View style={styles.switchBox}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>30 Dakika Önce Bildir</Text>
                    <Text style={styles.switchDesc}>Ders başlamadan yarım saat önce uyarı gönderir</Text>
                  </View>
                  <Switch
                    value={notifyBefore}
                    onValueChange={setNotifyBefore}
                    trackColor={{ true: '#2563EB', false: '#CBD5E1' }}
                  />
                </View>

                <View style={[styles.switchRow, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>Ders Başlayınca Bildir</Text>
                    <Text style={styles.switchDesc}>Ders başladığında sessize al uyarısı gönderir</Text>
                  </View>
                  <Switch
                    value={notifyStart}
                    onValueChange={setNotifyStart}
                    trackColor={{ true: '#059669', false: '#CBD5E1' }}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveCourseBtn}
              onPress={handleAddCourse}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveCourseBtnText}>Dersi Kaydet & Bildirimleri Kur</Text>
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
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  addBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  motivationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  motivationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  motivationTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 4,
  },
  refreshQuoteBtn: {
    padding: 4,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 6,
    textAlign: 'right',
  },

  /* OCR IMPORT CARD */
  ocrImportCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  ocrIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ocrCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  ocrBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 2,
  },
  ocrCardSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 3,
    lineHeight: 15,
  },

  notificationBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bellBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  testBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  testStatusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  daySelector: {
    paddingBottom: 14,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCountBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  dayCountText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  courseListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  dayHeadingCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  courseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseColorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    minHeight: 60,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderPillSmall: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  orderPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  timeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  instructorText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  deleteBtn: {
    padding: 6,
  },
  cardFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  footerNotifyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerNotifyText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginRight: 2,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  /* DETAY KARTI STİLLERİ */
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  detailHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2C59',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 8,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  dayTagBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dayTagText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  detailCourseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  detailCourseName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginTop: 2,
    marginBottom: 14,
  },
  detailInfoGrid: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  detailNotifyStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  notifyStatusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  notifyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  friendlyTipsBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipItemText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  detailPrimaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* 📸 ACTION SHEET STİLLERİ */
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  actionSheetSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  sheetOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  sheetOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  templateDividerBox: {
    marginVertical: 10,
    alignItems: 'center',
  },
  templateDividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  sheetCloseBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  sheetCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },

  /* ⏳ SCANNING MODAL STİLLERİ */
  scanningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scanningCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  thumbnailPreview: {
    width: 140,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    resizeMode: 'cover',
  },
  scanningDocIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  scanningSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },

  /* ✅ CONFIRM SCREEN STİLLERİ */
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  confirmModalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  confirmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  confirmBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 4,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  confirmSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewListScroll: {
    maxHeight: 380,
    marginVertical: 10,
  },
  previewItemCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewDayPill: {
    backgroundColor: '#0F2C59',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewDayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  previewTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  previewRemoveBtn: {
    padding: 4,
  },
  previewCourseName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  previewCodeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  previewLocationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  previewInstructorText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  confirmActionRow: {
    marginTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  confirmAddBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },

  /* FORM MODALI (MANUEL) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: colors.text,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  modalDayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  modalDayChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  modalDayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modalDayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  saveCourseBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveCourseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
});
