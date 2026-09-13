import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as MediaLibrary from 'expo-media-library/legacy';
import { Circle, Square, RotateCcw } from 'lucide-react-native';
import { useScriptStore, FREE_RECORD_SECONDS } from '../src/store/useScriptStore';
import { advanceCursor, tokenize } from '../src/engine/scriptTracker';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';
import { PaywallModal } from '../src/components/PaywallModal';

const LINE_HEIGHT_RATIO = 1.5;

export default function PrompterScreen() {
  const theme = useTheme();
  const { script, tokens, cursor, fontSize, mirrored, isPro, setCursor, resetCursor, recordLimitSeconds } =
    useScriptStore();

  const [camPermission, requestCam] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [speechReady, setSpeechReady] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const cursorRef = useRef(0);

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const granted = camPermission?.granted && micPermission?.granted;

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  // Speech results arrive continuously while recording. Each one carries the
  // whole transcript so far, so the tracker is given the transcript and decides
  // how far the cursor may move -- it never trusts the recogniser's own idea of
  // position, which revises itself as more audio arrives.
  useSpeechRecognitionEvent('result', (event) => {
    const spoken = event.results?.[0]?.transcript;
    if (!spoken) return;
    const next = advanceCursor(tokens, tokenize(spoken), cursorRef.current);
    if (next !== cursorRef.current) {
      cursorRef.current = next;
      setCursor(next);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    // Losing recognition mid-take must not end the recording: the camera keeps
    // rolling and the prompter simply stops following.
    setSpeechReady(false);
  });

  useEffect(() => {
    // Scroll so the current line sits at the reading position rather than the
    // top, which is where a presenter's eyes actually rest.
    const line = Math.floor(cursor / 8);
    scrollRef.current?.scrollTo({ y: Math.max(0, line * lineHeight - lineHeight * 2), animated: true });
  }, [cursor, lineHeight]);

  useEffect(() => {
    if (!recording) return;
    const limit = recordLimitSeconds();
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= limit) {
          // Stopping on the tick that crosses the limit, rather than letting
          // the take run and refusing to save it afterwards.
          void stop(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const ensurePermissions = async () => {
    const cam = camPermission?.granted ? camPermission : await requestCam();
    const mic = micPermission?.granted ? micPermission : await requestMic();
    const speech = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setSpeechReady(speech.granted);
    if (!cam.granted || !mic.granted) {
      Alert.alert(t('permissionsDenied'), t('permissionsDeniedDesc'));
      return false;
    }
    return true;
  };

  const start = async () => {
    if (!(await ensurePermissions())) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetCursor();
    cursorRef.current = 0;
    setElapsed(0);
    setRecording(true);

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        // On-device only: the pitch is that neither the script nor the voice
        // leaves the phone, and network recognition would break that.
        requiresOnDeviceRecognition: true,
      });
    } catch {
      setSpeechReady(false);
    }

    try {
      const video = await cameraRef.current?.recordAsync();
      if (video?.uri) {
        const { status } = await MediaLibrary.requestPermissionsAsync(true);
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          Alert.alert(t('savedTitle'), t('savedDesc'));
        } else {
          Alert.alert(t('saveFailed'), t('saveFailedDesc'));
        }
      }
    } catch {
      Alert.alert(t('saveFailed'), t('saveFailedDesc'));
    }
  };

  const stop = async (hitLimit = false) => {
    setRecording(false);
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* already stopped */ }
    cameraRef.current?.stopRecording();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (hitLimit && !isPro) {
      Alert.alert(
        t('freeLimitReached'),
        t('freeLimitReachedDesc', { seconds: FREE_RECORD_SECONDS }),
        [{ text: t('cancel'), style: 'cancel' }, { text: t('lifetimeAccessPlain'), onPress: () => setPaywallVisible(true) }],
      );
    }
  };

  if (!granted) {
    return (
      <SafeAreaView className="flex-1 px-6 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <Text className="text-xl font-bold text-center mb-2" style={{ color: theme.text }}>{t('permissionsTitle')}</Text>
        <Text className="text-sm text-center mb-6 leading-relaxed" style={{ color: theme.textSecondary }}>
          {t('permissionsDesc')}
        </Text>
        <TouchableOpacity
          onPress={ensurePermissions}
          accessibilityRole="button"
          className="px-6 py-3.5 rounded-2xl"
          style={{ backgroundColor: theme.primary }}
        >
          <Text className="font-bold text-base" style={{ color: theme.onPrimary }}>{t('grantPermissions')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const words = script.split(/\s+/).filter(Boolean);

  return (
    <View className="flex-1" style={{ backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mode="video" videoQuality="1080p">
        {/* The script sits directly under the lens so the presenter's eye-line
            stays close to camera rather than drifting down the screen. */}
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-1 mx-4 mt-2 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <ScrollView
              ref={scrollRef}
              scrollEnabled={!recording}
              contentContainerStyle={{ padding: 20, paddingBottom: 240 }}
              style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
            >
              <Text style={{ fontSize, lineHeight, color: '#FFFFFF' }}>
                {words.map((word, i) => (
                  <Text
                    key={i}
                    style={{
                      // Words already spoken dim, so the eye lands on the next
                      // one without hunting for a highlight.
                      color: i < cursor ? 'rgba(255,255,255,0.35)' : '#FFFFFF',
                      fontWeight: i === cursor ? '800' : '400',
                    }}
                  >
                    {word}{' '}
                  </Text>
                ))}
              </Text>
            </ScrollView>
          </View>

          {speechReady === false ? (
            <Text className="text-center text-xs mb-1" style={{ color: '#FCD34D' }}>
              {t('recognitionUnavailable')}
            </Text>
          ) : null}

          <View className="flex-row items-center justify-center py-4">
            <TouchableOpacity
              onPress={() => { resetCursor(); cursorRef.current = 0; }}
              accessibilityRole="button"
              accessibilityLabel={t('restartScript')}
              className="p-3 rounded-full mr-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <RotateCcw size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (recording ? stop() : start())}
              accessibilityRole="button"
              accessibilityLabel={recording ? t('stopRecording') : t('tapToRecord')}
              className="items-center justify-center rounded-full"
              style={{ width: 76, height: 76, backgroundColor: recording ? '#FFFFFF' : '#EF4444' }}
            >
              {recording ? <Square size={26} color="#EF4444" /> : <Circle size={30} color="#FFFFFF" fill="#FFFFFF" />}
            </TouchableOpacity>

            <View className="ml-8 items-center" style={{ width: 46 }}>
              {recording ? (
                <Text className="text-xs font-mono font-bold" style={{ color: '#FFFFFF' }}>
                  {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                </Text>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </CameraView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
