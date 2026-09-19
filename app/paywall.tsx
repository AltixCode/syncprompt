import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MonitorPlay, ArrowRight, X } from "lucide-react-native";
import { usePaywall } from "../src/hooks/usePaywall";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "../src/config/legal";
import { t } from "../src/i18n";
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';

export default function PaywallScreen() {
  const theme = useTheme();
  const tabletColumn = useTabletColumn(640);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(() => router.back());

  const bullets = [
    t("featAdsTitle"),
    t("feat1Title"),
    t("feat2Title"),
    t("feat3Title"),
    t("feat4Title"),
  ];

  return (
    <View className="flex-1 px-6" style={{ backgroundColor: theme.background, paddingTop: insets.top + 8 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("cancel")}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="self-end rounded-full p-2"
        style={{ backgroundColor: theme.card }}
      >
        <X size={18} color={theme.textMuted} />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ ...tabletColumn }}>
          <MonitorPlay size={40} color={theme.primary} />
          <Text className="mt-4 text-3xl font-extrabold leading-tight" style={{ color: theme.text }}>
            {t("paywallTitle")}
          </Text>
          <Text className="mt-3 text-base leading-relaxed" style={{ color: theme.textSecondary }}>
            {t("antiSubDesc")}
          </Text>

          <View className="my-6" style={{ height: 1, backgroundColor: theme.cardBorder }} />

          <View className="mb-6">
            {bullets.map((b) => (
              <View key={b} className="mb-3.5 flex-row items-start">
                <Text className="mr-2 text-base font-bold" style={{ color: theme.primary }}>—</Text>
                <Text className="flex-1 text-base leading-relaxed" style={{ color: theme.text }}>{b}</Text>
              </View>
            ))}
          </View>

          {errorMsg ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-center text-xs" style={{ color: theme.danger }}
            >
              {errorMsg}
            </Text>
          ) : null}
        </ScrollView>

        <View
          className="pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            accessibilityState={{ disabled: loading, busy: loading }}
            className={`min-h-[56px] flex-row items-center justify-center rounded-lg p-4 ${
              loading ? "bg-blue-900" : "bg-blue-600 active:bg-blue-500"
            }`}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Text className="mr-2 text-base font-extrabold" style={{ color: theme.onPrimary }}>
                  {ctaLabel}
                </Text>
                <ArrowRight size={18} color={theme.onPrimary} strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>

          <Text className="mt-3 text-center text-xs" style={{ color: theme.textMuted }}>
            {t("oneTimePayment")}
          </Text>

          <View className="mt-4 flex-row items-center justify-center gap-5">
            <TouchableOpacity
              onPress={handleRestore}
              disabled={loading}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textSecondary }}>
                {t("restorePurchases")}
              </Text>
            </TouchableOpacity>
            <Text className="text-xs" style={{ color: theme.textMuted }}>•</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
              accessibilityRole="link"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textMuted }}>
                {t("termsOfUse")}
              </Text>
            </TouchableOpacity>
            <Text className="text-xs" style={{ color: theme.textMuted }}>•</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-xs underline" style={{ color: theme.textMuted }}>
                {t("privacyPolicy")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
