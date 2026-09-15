import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sparkles, Mic, ShieldCheck, ClipboardPaste, Type } from 'lucide-react-native';
import { useScriptStore } from '../src/store/useScriptStore';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

const SAMPLE = `Welcome back to the channel. Today we are building something I have wanted for a long time.

Most teleprompters scroll at a fixed speed. If you pause to think, or you ad-lib a sentence, the script keeps going without you and you lose your place.

This one listens. It matches what you actually say against the script, and it keeps your current line centred no matter how fast or slow you go.

Let me show you what that looks like.`;

export default function HomeScreen() {
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const theme = useTheme();
  const router = useRouter();
  const { script, tokens, fontSize, mirrored, setScript, setFontSize, toggleMirrored } = useScriptStore();
  const [focused, setFocused] = useState(false);

  const start = () => {
    if (!tokens.length) {
      Alert.alert(t('nothingToRead'), t('nothingToReadDesc'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/prompter');
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-4 mb-5">
          <View className="inline-flex self-start border px-3 py-1 rounded-full mb-3 flex-row items-center"
            style={{ backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }}>
            <Sparkles size={12} color={theme.primary} />
            <Text className="text-xs font-semibold ml-1.5" style={{ color: theme.primary }}>{t('heroBadge')}</Text>
          </View>
          <Text className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text }}>{t('heroTitle')}</Text>
          <Text className="text-sm mt-1.5 leading-relaxed" style={{ color: theme.textSecondary }}>{t('heroSubtitle')}</Text>
        </View>

        <View className="border rounded-3xl p-4 mb-4"
          style={{ backgroundColor: theme.card, borderColor: focused ? theme.primary : theme.cardBorder }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-base" style={{ color: theme.text }}>{t('yourScript')}</Text>
            <Text className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
              {t('wordCount', { count: tokens.length })}
            </Text>
          </View>
          <TextInput
            multiline
            value={script}
            onChangeText={setScript}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('scriptPlaceholder')}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel={t('yourScript')}
            style={{ color: theme.text, minHeight: 160, textAlignVertical: 'top' }}
            className="text-base leading-relaxed"
          />
          {!script ? (
            <TouchableOpacity
              onPress={() => setScript(SAMPLE)}
              accessibilityRole="button"
              className="flex-row items-center mt-3 self-start px-3 py-2 rounded-xl"
              style={{ backgroundColor: theme.controlSurface }}
            >
              <ClipboardPaste size={14} color={theme.textSecondary} />
              <Text className="text-xs font-bold ml-1.5" style={{ color: theme.textSecondary }}>{t('useSample')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="border rounded-2xl p-4 mb-4" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="flex-row items-center mb-3">
            <Type size={15} color={theme.textSecondary} />
            <Text className="text-xs font-semibold tracking-widest ml-2" style={{ color: theme.textMuted }}>{t('textSize')}</Text>
          </View>
          <View className="flex-row items-center">
            {[22, 30, 40, 52].map((size) => {
              const on = fontSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  onPress={() => { Haptics.selectionAsync(); setFontSize(size); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${size}`}
                  className="flex-1 mx-1 py-2.5 rounded-xl border items-center"
                  style={{
                    backgroundColor: on ? theme.primaryLight : theme.background,
                    borderColor: on ? theme.primary : theme.cardBorder,
                  }}
                >
                  <Text style={{ color: on ? theme.primary : theme.textSecondary, fontSize: 13 }} className="font-bold">
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-row items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: theme.cardBorder }}>
            <View className="flex-1 mr-3">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('mirrorText')}</Text>
              <Text className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{t('mirrorHint')}</Text>
            </View>
            <Switch value={mirrored} onValueChange={toggleMirrored} accessibilityLabel={t('mirrorText')} />
          </View>
        </View>

        <TouchableOpacity
          onPress={start}
          accessibilityRole="button"
          className="p-4 rounded-2xl flex-row items-center justify-center mb-6"
          style={{ backgroundColor: tokens.length ? theme.primary : theme.controlSurface }}
        >
          <Mic size={18} color={tokens.length ? theme.onPrimary : theme.textMuted} />
          <Text className="font-bold text-base ml-2 mr-2" style={{ color: tokens.length ? theme.onPrimary : theme.textMuted }}>
            {t('startPrompter')}
          </Text>
          <ForwardArrow size={18} color={tokens.length ? theme.onPrimary : theme.textMuted} />
        </TouchableOpacity>

        <Text className="text-xs font-semibold tracking-widest mb-3" style={{ color: theme.textMuted }}>{t('archGuarantees')}</Text>
        <View className="border p-4 rounded-2xl flex-row items-start mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: theme.primaryLight }}>
            <Mic size={18} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{t('tracksVoiceTitle')}</Text>
            <Text className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{t('tracksVoiceDesc')}</Text>
          </View>
        </View>
        <View className="border p-4 rounded-2xl flex-row items-start" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: theme.successLight }}>
            <ShieldCheck size={18} color={theme.success} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{t('onDeviceTitle')}</Text>
            <Text className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{t('onDeviceDesc')}</Text>
          </View>
        </View>
        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />
    </SafeAreaView>
  );
}
