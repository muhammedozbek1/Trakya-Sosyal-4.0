import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { queryTransitAI } from '../utils/fuzzyTransitAI';
import { ETUS_LINES } from '../data/transitData';
import { fontFamilies } from '../theme/fonts';

export default function TransitScreen({ onBack }) {
  const { theme: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [queryInput, setQueryInput] = useState('');
  const [aiResult, setAiResult] = useState(() =>
    queryTransitAI("Karaağaç'tan Balkan Yerleşkesine nasıl giderim?")
  );
  const [hasSearched, setHasSearched] = useState(true);
  const [showAllLines, setShowAllLines] = useState(false);
  const [expandedLine, setExpandedLine] = useState(null);

  const quickPrompts = [
    { label: 'kragac balkan yoli', text: 'kragac balkan yoli' },
    { label: 'Pazartesi pazarından KYK', text: 'Pazartesi pazarından KYK yurduna otobüs var mı?' },
    { label: 'otogardan ayskdn', text: 'otogardan ayskdn hangi hat gider' },
    { label: 'Çarşı ➡️ Tıp Fakültesi', text: "Saraçlar çarşıdan Tıp Fakültesi Hastanesine nasıl giderim?" },
    { label: 'balkana nasıl gidilir', text: 'balkana nasıl gidilir' },
  ];

  const handleSearch = (customText) => {
    Keyboard.dismiss();
    const textToQuery = customText !== undefined ? customText : queryInput;
    if (!textToQuery.trim()) return;

    if (customText !== undefined) {
      setQueryInput(customText);
    }

    const result = queryTransitAI(textToQuery);
    setAiResult(result);
    setHasSearched(true);
  };

  const handleClear = () => {
    setQueryInput('');
    setAiResult(null);
    setHasSearched(false);
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
          <Text style={styles.navTitle}>Edirne Ulaşım (Mini AI Asistan)</Text>
          <Text style={styles.navSubtitle}>Doğal Dil & Akıllı Güzergah Bulucu</Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color="#2563EB" />
          <Text style={styles.aiBadgeText}>AI ETUS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient başlık alanı */}
        <LinearGradient
          colors={['#1E4DB7', '#3B82F6', '#DBEAFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.gradientTitle}>Trakya Ulaşım Ağı</Text>
          <Text style={styles.gradientSub}>Kampüs Ring ve Hatlar</Text>
        </LinearGradient>

        {/* Sade arama kartı */}
        <View style={styles.searchCard}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Durak veya hat ara..."
              placeholderTextColor={colors.textLight}
              value={queryInput}
              onChangeText={setQueryInput}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              multiline={false}
            />
            {queryInput.length > 0 ? (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Arama Butonu */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch()}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Yol Tarifi Bul (AI)</Text>
          </TouchableOpacity>

          {/* Hızlı Örnek Sorular */}
          <View style={styles.quickPromptsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
              {quickPrompts.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.promptPill}
                  onPress={() => handleSearch(p.text)}
                >
                  <Ionicons name="flash-outline" size={13} color="#2563EB" />
                  <Text style={styles.promptPillText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* AI YOL TARİFİ SONUÇ ALANI */}
        {hasSearched && aiResult ? (
          aiResult.success ? (
            <View style={styles.resultContainer}>
              {/* Tespit Edilen Güzergah ve Benzerlik Skoru */}
              <View style={styles.matchReportCard}>
                <View style={styles.matchHeader}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.matchReportTitle}>En uygun rota bulundu</Text>
                </View>

                <View style={styles.routePillsRow}>
                  {aiResult.origin ? (
                    <View style={styles.originPill}>
                      <Text style={styles.pillTypeLabel}>BAŞLANGIÇ</Text>
                      <Text style={styles.pillLocationName}>{aiResult.origin.displayName}</Text>
                      {aiResult.origin.score ? (
                        <Text style={styles.pillConfidence}>%{aiResult.origin.score} Eşleşme</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {aiResult.origin && aiResult.destination ? (
                    <View style={styles.arrowBetween}>
                      <Ionicons name="arrow-forward" size={18} color="#2563EB" />
                    </View>
                  ) : null}

                  {aiResult.destination ? (
                    <View style={styles.destPill}>
                      <Text style={styles.pillTypeLabel}>VARIŞ NOKTASI</Text>
                      <Text style={styles.pillLocationName}>{aiResult.destination.displayName}</Text>
                      {aiResult.destination.score ? (
                        <Text style={styles.pillConfidence}>%{aiResult.destination.score} Eşleşme</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Önerilen Hatlar ve Başlık Kartı */}
              <View style={styles.mainRouteCard}>
                <View style={styles.routeCardTop}>
                  <View style={styles.linesGroup}>
                    {aiResult.recommendedLines.map((line, lIdx) => (
                      <View key={lIdx} style={styles.bigLineBadge}>
                        <Text style={styles.bigLineBadgeText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.routeHeaderTitle}>{aiResult.title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={14} color="#2563EB" />
                      <Text style={styles.metaDuration}>{aiResult.duration}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Ionicons name="card-outline" size={14} color="#059669" />
                      <Text style={styles.metaFare}>{aiResult.fare}</Text>
                    </View>
                  </View>
                </View>

                {/* AI Özet Açıklaması */}
                <View style={styles.aiSummaryBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1E40AF" />
                  <Text style={styles.aiSummaryText}>{aiResult.summary}</Text>
                </View>

                {/* Adım Adım Yol Tarifi */}
                <View style={styles.stepsCard}>
                  <Text style={styles.stepsCardTitle}>Adım Adım Nasıl Gidilir?</Text>
                  {aiResult.steps?.map((step, sIdx) => (
                    <View key={sIdx} style={styles.stepRowItem}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepCircleText}>{sIdx + 1}</Text>
                      </View>
                      <Text style={styles.stepTextContent}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Sefer / Aktarma İpucu */}
                {aiResult.transferTip ? (
                  <View style={styles.tipBox}>
                    <Ionicons name="bulb-outline" size={18} color="#D97706" />
                    <Text style={styles.tipText}>{aiResult.transferTip}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            /* Eşleşme bulunamadığında / öneri kartı */
            <View style={styles.fallbackCard}>
              <Ionicons name="help-circle-outline" size={44} color="#F59E0B" />
              <Text style={styles.fallbackTitle}>Anlaşılamadı</Text>
              <Text style={styles.fallbackDesc}>{aiResult.message}</Text>
              {aiResult.suggestions ? (
                <View style={styles.suggestionList}>
                  {aiResult.suggestions.map((sug, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionBtn}
                      onPress={() => handleSearch(sug)}
                    >
                      <Ionicons name="arrow-forward-circle-outline" size={16} color="#2563EB" />
                      <Text style={styles.suggestionBtnText}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          )
        ) : null}

        {/* Kentkart Öğrenci Bilgi Şeridi */}
        <View style={styles.kentkartBar}>
          <View style={styles.kentkartLeft}>
            <Ionicons name="card" size={24} color={colors.brightBlue} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.kentkartTitle}>ETUS Öğrenci Biniş Ücreti</Text>
              <Text style={styles.kentkartSub}>Edirne Belediyesi Öğrenci İndirimli Tarifesi</Text>
            </View>
          </View>
          <View style={styles.kentkartPriceBadge}>
            <Text style={styles.kentkartPriceText}>16.50 ₺</Text>
          </View>
        </View>

        {/* OPSİYONEL: TÜM ETUS HATLARI VE DURAKLARI LİSTESİ */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            style={styles.accordionToggle}
            onPress={() => setShowAllLines(!showAllLines)}
            activeOpacity={0.8}
          >
            <View style={styles.accordionLeft}>
              <Ionicons name="list-circle-outline" size={22} color="#2563EB" />
              <Text style={styles.accordionTitle}>
                {showAllLines ? 'Tüm Hat Listesini Gizle' : 'Tüm ETUS Hatları & Duraklarını İncele'}
              </Text>
            </View>
            <Ionicons
              name={showAllLines ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#2563EB"
            />
          </TouchableOpacity>

          {showAllLines && (
            <View style={styles.linesListArea}>
              {ETUS_LINES.map((line) => {
                const isLineOpen = expandedLine === line.code;
                return (
                  <View key={line.code} style={styles.lineRowCard}>
                    <TouchableOpacity
                      style={styles.lineHeader}
                      onPress={() => setExpandedLine(isLineOpen ? null : line.code)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.miniCodeBadge, { backgroundColor: line.color }]}>
                        <Text style={styles.miniCodeText}>{line.code}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.lineNameBold}>{line.name}</Text>
                        <Text style={styles.lineFrequencyText}>
                          {line.frequency} • {line.workingHours}
                        </Text>
                      </View>
                      <Ionicons
                        name={isLineOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>

                    {isLineOpen && (
                      <View style={styles.stopsDropdown}>
                        <Text style={styles.stopsDropdownHeader}>
                          Duraklar ({line.stops.length}):
                        </Text>
                        {line.stops.map((stop, sIndex) => (
                          <View key={sIndex} style={styles.stopItemRow}>
                            <View
                              style={[
                                styles.stopSmallDot,
                                { borderColor: line.color },
                                (sIndex === 0 || sIndex === line.stops.length - 1) && {
                                  backgroundColor: line.color,
                                },
                              ]}
                            />
                            <Text style={styles.stopText}>{stop}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gradientHeader: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#1E4DB7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradientSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontFamily: fontFamilies.regular,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily: fontFamilies.regular,
  },
  clearBtn: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
    fontFamily: fontFamilies.bold,
  },
  quickPromptsSection: {
    marginTop: 12,
  },
  quickScroll: {
    flexDirection: 'row',
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  promptPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
  },
  resultContainer: {
    marginBottom: 16,
  },
  matchReportCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchReportTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
    marginLeft: 6,
    fontFamily: fontFamilies.medium,
  },
  routePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  originPill: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  destPill: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  pillTypeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
  },
  pillLocationName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  pillConfidence: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  arrowBetween: {
    paddingHorizontal: 8,
  },
  mainRouteCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  routeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  linesGroup: {
    flexDirection: 'row',
  },
  bigLineBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 6,
  },
  bigLineBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  routeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 4,
  },
  metaDot: {
    marginHorizontal: 6,
    color: colors.textLight,
  },
  metaFare: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  aiSummaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  stepsCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  stepsCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  stepRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTextContent: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  fallbackCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
  },
  fallbackDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  suggestionList: {
    width: '100%',
    marginTop: 14,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  suggestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 8,
  },
  kentkartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kentkartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kentkartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  kentkartSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  kentkartPriceBadge: {
    backgroundColor: '#0F2C59',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  kentkartPriceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  accordionContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 8,
  },
  linesListArea: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  lineRowCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  miniCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  lineNameBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  lineFrequencyText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  stopsDropdown: {
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stopsDropdownHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 8,
  },
  stopItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stopSmallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  stopText: {
    fontSize: 12,
    color: colors.text,
  },
});
