import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/fonts';
import { storageService } from '../services/storageService';

export default function LoginScreen({ onLoginSuccess }) {
  const { theme: colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Domain sabiti
  const EMAIL_DOMAIN = '@trakya.edu.tr';

  // Uygulama açıldığında hatırlanan kullanıcı adını yükle
  useEffect(() => {
    loadRememberedUsername();
  }, []);

  const loadRememberedUsername = async () => {
    try {
      const remembered = await storageService.getRememberedUsername();
      if (remembered) {
        setUsername(remembered);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('Hatırlanan kullanıcı adı yüklenemedi:', e);
    }
  };

  const validateUsername = (username) => {
    const trimmed = username.trim().toLowerCase();
    // Sadece alfanumerik, nokta, alt çizgi, tire izin ver
    return /^[a-z0-9._-]+$/.test(trimmed) && trimmed.length >= 2;
  };

  const getFullEmail = (username) => {
    return `${username.trim().toLowerCase()}${EMAIL_DOMAIN}`;
  };

  const handleLogin = async () => {
    setErrorMsg('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setErrorMsg('Lütfen kullanıcı adınızı giriniz.');
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      setErrorMsg('Geçersiz kullanıcı adı! Sadece harf, rakam, nokta, alt çizgi ve tire kullanabilirsiniz.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Lütfen en az 4 karakterli şifrenizi giriniz.');
      return;
    }

    // Tam e-posta adresini oluştur
    const fullEmail = getFullEmail(trimmedUsername);

    // "Beni Unutma" işaretliyse kullanıcı adını kaydet, değilse sil
    try {
      if (rememberMe) {
        await storageService.setRememberedUsername(trimmedUsername);
      } else {
        await storageService.removeRememberedUsername();
      }
    } catch (e) {
      console.warn('Remember me işlemi başarısız:', e);
    }

    // Başarılı giriş
    // Özel test hesabı: admin → topluluk yöneticisi rolü alır
    const isAdminLogin = trimmedUsername === 'admin';
    const user = {
      name: studentName.trim() || (isAdminLogin ? 'Topluluk Yöneticisi' : 'Trakya Öğrencisi'),
      email: fullEmail,
      studentId: '2210206014',
      faculty: 'Mühendislik Fakültesi',
      department: 'Bilgisayar Mühendisliği',
      loggedInAt: new Date().toISOString(),
      role: isAdminLogin ? 'admin' : 'student',
      managedCommunityId: isAdminLogin ? '1' : null, // Admin: Trakya Yazılım Kulübü (id:1) yöneticisi
    };

    onLoginSuccess(user);
  };

  const handleQuickDemoLogin = async () => {
    setUsername('ogrenci');
    setPassword('trakya2026');
    setStudentName('Emre Yılmaz');
    setErrorMsg('');
    setRememberMe(true);

    // Demo için de remember me kaydet
    try {
      await storageService.setRememberedUsername('ogrenci');
    } catch (e) {
      console.warn('Demo remember me kaydedilemedi:', e);
    }

    const demoUser = {
      name: 'Emre Yılmaz',
      email: 'ogrenci@trakya.edu.tr',
      studentId: '2210206014',
      faculty: 'Mühendislik Fakültesi',
      department: 'Bilgisayar Mühendisliği',
      loggedInAt: new Date().toISOString(),
      role: 'student',
      managedCommunityId: null,
    };

    onLoginSuccess(demoUser);
  };

  const handleAdminDemoLogin = async () => {
    setUsername('admin');
    setPassword('trakya2026');
    setStudentName('Topluluk Yöneticisi');
    setErrorMsg('');
    setRememberMe(true);

    try {
      await storageService.setRememberedUsername('admin');
    } catch (e) {
      console.warn('Admin remember me kaydedilemedi:', e);
    }

    const adminUser = {
      name: 'Topluluk Yöneticisi',
      email: 'admin@trakya.edu.tr',
      studentId: '0000000000',
      faculty: 'Mühendislik Fakültesi',
      department: 'Bilgisayar Mühendisliği',
      loggedInAt: new Date().toISOString(),
      role: 'admin',
      managedCommunityId: '1', // Trakya Yazılım Kulübü yöneticisi
    };

    onLoginSuccess(adminUser);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo ve Başlık */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TRAKYA SOSYAL</Text>
          <Text style={styles.brandSubtitle}>Edirne Öğrenci Yaşam & Kampüs Rehberi</Text>
          <View style={styles.universityTag}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primaryLight} />
            <Text style={styles.universityTagText}>Trakya Üniversitesi Öğrenci Girişi</Text>
          </View>
        </View>

        {/* Form Kartı */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>
          <Text style={styles.cardDesc}>
            Kullanıcı adınızı girin, domain otomatik eklenecek.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Ad Soyad (İsteğe bağlı) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Emre Yılmaz"
                placeholderTextColor={colors.textLight}
                value={studentName}
                onChangeText={setStudentName}
              />
            </View>
          </View>

          {/* Üniversite E-Postası - Sabit Domain */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Üniversite E-Postası</Text>
            <View style={styles.inputWrapperWithDomain}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithDomain]}
                placeholder="kullaniciadi"
                placeholderTextColor={colors.textLight}
                value={username}
                onChangeText={(val) => {
                  // Sadece küçük harf, rakam, nokta, alt çizgi, tire izin ver
                  const sanitized = val.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                  setUsername(sanitized);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
              />
              <View style={styles.domainLabelContainer}>
                <Text style={styles.domainLabel}>{EMAIL_DOMAIN}</Text>
              </View>
            </View>
            <Text style={styles.inputHint}>* Sadece kullanıcı adınızı yazın (örn: mnurozbek)</Text>
          </View>

          {/* Şifre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Beni Unutma Checkbox */}
          <View style={styles.rememberMeContainer}>
            <TouchableOpacity style={styles.rememberMeTouch} onPress={toggleRememberMe} activeOpacity={0.8}>
              <View style={[
                styles.rememberMeBox,
                rememberMe && styles.rememberMeBoxChecked
              ]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Beni Unutma</Text>
            </TouchableOpacity>
          </View>

          {/* Giriş Butonu */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Giriş Yap</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Hızlı Demo Girişi */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>VEYA HIZLI TEST İÇİN</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleQuickDemoLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="flash-outline" size={18} color={colors.primaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.demoBtnText}>Örnek Öğrenci ile Hızlı Giriş</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoBtn, styles.adminBtn]}
            onPress={handleAdminDemoLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text style={[styles.demoBtnText, styles.adminBtnText]}>Admin Olarak Dene</Text>
          </TouchableOpacity>
        </View>

        {/* Bilgilendirme */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerText}>
            Bu uygulama Edirne'de yaşayan Trakya Üniversitesi öğrencilerine özel sosyal, ulaşım ve akademik rehberdir.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2C59',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E4DB7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: fontFamilies.bold,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
    marginTop: 4,
    fontFamily: fontFamilies.regular,
  },
  universityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  universityTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: fontFamilies.bold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamilies.bold,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: fontFamilies.regular,
  },
  boldText: {
    fontWeight: '700',
    color: colors.primaryLight,
    fontFamily: fontFamilies.bold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    fontFamily: fontFamilies.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  inputWrapperWithDomain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
  },
  inputWithDomain: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    paddingRight: 8,
  },
  domainLabelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    backgroundColor: colors.background,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  domainLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontFamily: fontFamilies.regular,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  inputHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: fontFamilies.regular,
  },
  rememberMeContainer: {
    marginBottom: 8,
    marginTop: -8,
  },
  rememberMeTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rememberMeBoxChecked: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fontFamilies.regular,
  },
  submitBtn: {
    backgroundColor: colors.primaryLight,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    paddingHorizontal: 10,
    fontFamily: fontFamilies.semiBold,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySoft,
  },
  demoBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  adminBtn: {
    marginTop: 10,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  adminBtnText: {
    color: '#7C3AED',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#93C5FD',
    fontSize: 11,
    textAlign: 'center',
    marginLeft: 6,
    flex: 1,
    fontFamily: fontFamilies.regular,
  },
});