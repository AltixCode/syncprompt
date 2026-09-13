import * as Localization from 'expo-localization';

export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'pt'
  | 'ko'
  | 'it'
  | 'tr'
  | 'ar'
  | 'fa'
  | 'el';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en',
  'es',
  'fr',
  'de',
  'ru',
  'zh',
  'ja',
  'pt',
  'ko',
  'it',
  'tr',
  'ar',
  'fa',
  'el',
];

export const translations = {
  "en": {
    "proBadge": "PRO",
    "storeUnavailable": "Store Unavailable",
    "noPriorPurchases": "No previous purchase was found for this account.",
    "lifetimeAccessPlain": "Unlock Lifetime Access",
    "cancelled": "Purchase Cancelled",
    "unlocked": "SyncPrompt Pro Unlocked",
    "appName": "SyncPrompt",
    "prompterTitle": "Prompter",
    "paywallTitle": "SyncPrompt Pro",
    "back": "Back",
    "cancel": "Cancel",
    "error": "Error",
    "lifetimeAccess": "Unlock Lifetime Access — {price}",
    "restorePurchases": "Restore Purchases",
    "oneTimePayment": "One-time payment. Never recurring.",
    "termsOfUse": "Terms of Use",
    "privacyPolicy": "Privacy Policy",
    "antiSubTitle": "ANTI-SUBSCRIPTION PROMISE",
    "antiSubHeadline": "No Subscriptions. No Accounts. 100% On-Device Privacy. Own It Forever.",
    "purchaseFailed": "Purchase Failed",
    "purchaseFailedDesc": "The purchase could not be completed. Please try again.",
    "restoreFailed": "Nothing to Restore",
    "restoreFailedDesc": "No previous purchase was found for this account.",
    "restored": "Purchase Restored",
    "restoredDesc": "SyncPrompt Pro is unlocked on this device.",
    "heroBadge": "Voice-Tracked Prompter",
    "heroTitle": "Teleprompter That Follows You",
    "heroSubtitle": "Speech recognition runs on your device and matches what you say to your script, so the prompt keeps your pace instead of a fixed speed.",
    "yourScript": "Your script",
    "scriptPlaceholder": "Paste or type the script you want to read.",
    "useSample": "Use sample script",
    "wordCount": "{count} words",
    "wordCount_one": "1 word",
    "startPrompter": "Start prompter",
    "nothingToRead": "Nothing to read",
    "nothingToReadDesc": "Paste or type a script first.",
    "textSize": "TEXT SIZE",
    "mirrorText": "Mirror text",
    "mirrorHint": "For a beam-splitter rig",
    "archGuarantees": "HOW IT WORKS",
    "tracksVoiceTitle": "Follows your voice",
    "tracksVoiceDesc": "Matches spoken words to the script and scrolls to keep your line centred, even if you pause or ad-lib.",
    "onDeviceTitle": "On-device recognition",
    "onDeviceDesc": "Speech is recognised on your phone. No audio is uploaded and there is no account.",
    "permissionsTitle": "Permissions needed",
    "permissionsDesc": "SyncPrompt needs the camera, the microphone and speech recognition to record while following your script.",
    "grantPermissions": "Grant permissions",
    "permissionsDenied": "Permissions Denied",
    "permissionsDeniedDesc": "Camera, microphone and speech recognition are all required. Enable them in Settings to use the prompter.",
    "recording": "Recording",
    "tapToRecord": "Tap to record",
    "stopRecording": "Stop",
    "freeLimitReached": "Free recording limit reached",
    "freeLimitReachedDesc": "Free recordings stop at {seconds} seconds. Unlock Pro for unlimited takes.",
    "savedTitle": "Take saved",
    "savedDesc": "Your recording was saved to your photo library.",
    "saveFailed": "Save Failed",
    "saveFailedDesc": "The recording could not be saved to your photo library.",
    "recognitionUnavailable": "Speech recognition unavailable",
    "recognitionUnavailableDesc": "On-device speech recognition is not available here. The prompter will scroll at a steady pace instead.",
    "scrollingSteadily": "Steady scroll",
    "restartScript": "Restart script",
    "antiSubDesc": "Voice-tracking prompters charge $10–$20 every month. SyncPrompt is a single one-time purchase you keep forever on all your devices.",
    "feat1Title": "Unlimited recording length",
    "feat1Desc": "Record takes of any length instead of stopping at one minute.",
    "feat2Title": "Mirrored prompter",
    "feat2Desc": "Flip the text for beam-splitter rigs and external prompter glass.",
    "feat3Title": "Full-resolution capture",
    "feat3Desc": "Record at your camera's full quality while the script follows you.",
    "feat4Title": "100% private on-device",
    "feat4Desc": "Your script and your voice never leave the phone. No server, no account."
  }
} as const;

export type TranslationKey = keyof typeof translations['en'];

export function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode?.toLowerCase();
    if (code && (SUPPORTED_LANGUAGES as string[]).includes(code)) {
      return code as SupportedLanguage;
    }
  } catch {
    // fallback
  }
  return 'en';
}

let currentLanguage: SupportedLanguage = getDeviceLanguage();

export function setLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function isRTL(): boolean {
  return currentLanguage === 'ar' || currentLanguage === 'fa';
}

/**
 * CLDR plural category for `count` in the active language, e.g. "one" or
 * "other" in English, which also has "few"/"many" in Russian and Arabic.
 *
 * Falls back to an English-style one/other split where Intl.PluralRules is
 * unavailable, which is still better than always rendering the plural form.
 */
function pluralCategory(count: number): string {
  try {
    return new Intl.PluralRules(currentLanguage).select(count);
  } catch {
    return count === 1 ? 'one' : 'other';
  }
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const langDict = (translations as any)[currentLanguage] || translations.en;
  // A key may carry plural variants as suffixed siblings ("exportClips_one").
  // Only keys that actually define one are affected; everything else resolves
  // to the base key exactly as before.
  let resolved: string = key as string;
  if (params && typeof params.count === 'number') {
    const variant = `${key}_${pluralCategory(params.count)}`;
    if (langDict[variant] || (translations.en as any)[variant]) resolved = variant;
  }
  let text: string =
    langDict[resolved] || (translations.en as any)[resolved] ||
    langDict[key] || translations.en[key] || (key as string);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.split('{' + k + '}').join(String(v));
    });
  }
  return text;
}

export default t;
