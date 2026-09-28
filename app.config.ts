import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json') as { expo: ExpoConfig };

const COINMIRROR_GA_MEASUREMENT_ID = 'G-RW7FRXJVER';

const config: ExpoConfig = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra ?? {}),
    feedbackFormUrl: process.env.EXPO_PUBLIC_FEEDBACK_FORM_URL?.trim() ?? '',
    waitlistFormUrl: process.env.EXPO_PUBLIC_WAITLIST_FORM_URL?.trim() ?? '',
    gaMeasurementId:
      process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID?.trim() || COINMIRROR_GA_MEASUREMENT_ID,
  },
};

export default config;
