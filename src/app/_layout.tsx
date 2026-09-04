import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { buildAnalyticsConfig, installGoogleTag } from '@/lib/analytics';
import { NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const config = buildAnalyticsConfig({
      measurementId: process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID,
      isProduction: process.env.NODE_ENV === 'production',
      platform: Platform.OS,
    });

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const analyticsWindow = window as typeof window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.gtag = analyticsWindow.gtag ?? ((...args: unknown[]) => analyticsWindow.dataLayer?.push(args));

    installGoogleTag(config, document, analyticsWindow.gtag);
  }, []);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme === 'dark' ? 'dark' : 'light']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="subscription" options={{ headerShown: false }} />
        <Stack.Screen name="subscription-checkout" options={{ headerShown: false }} />
        <Stack.Screen
          name="entry/new"
          options={{ headerShown: true, title: '거래 기록', presentation: 'modal' }}
        />
        <Stack.Screen name="entry/[id]" options={{ headerShown: true, title: '기록 상세' }} />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
