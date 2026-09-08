export type AnalyticsPlatform = 'web' | 'ios' | 'android' | 'windows' | 'macos' | 'native' | string;

export type AnalyticsConfig =
  | { enabled: true; measurementId: string }
  | { enabled: false; measurementId: string | null };

export type AnalyticsEventName =
  | 'page_view'
  | 'start_click'
  | 'diagnosis_complete'
  | 'upload_attempt'
  | 'parse_success'
  | 'parse_failed'
  | 'result_view'
  | 'subscription_preview_click'
  | 'subscription_benefits_view'
  | 'subscription_interest_click'
  | 'reanalysis_reminder_click'
  | 'reanalysis_return'
  | 'comparison_result_view'
  | 'ai_coaching_request_click'
  | 'waitlist_interest_click'
  | 'feedback_click'
  | 'delete_local_data_click';

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export type Gtag = (
  command: 'js' | 'config' | 'event',
  target: string | Date,
  params?: Record<string, string | number | boolean>
) => void;

type GoogleTagDocument = {
  createElement: (tagName: 'script') => { async?: boolean; src?: string };
  head?: { appendChild: (script: { async?: boolean; src?: string }) => unknown };
};

const SENSITIVE_KEY_PATTERNS = [
  /file\s*name/i,
  /filename/i,
  /password/i,
  /passwd/i,
  /email/i,
  /mail/i,
  /raw/i,
  /trade.*text/i,
  /symbol/i,
  /ticker/i,
  /market/i,
  /amount/i,
  /price/i,
  /quantity/i,
  /volume/i,
  /account/i,
  /customer/i,
  /user/i,
  /order/i,
  /uuid/i,
  /^token$/i,
  /^r$/i,
  /duplicate.*count/i,
  /execution.*count/i,
  /address/i,
  /wallet/i,
];

export function buildAnalyticsConfig({
  measurementId,
  isProduction,
  platform,
}: {
  measurementId?: string | null;
  isProduction: boolean;
  platform: AnalyticsPlatform;
}): AnalyticsConfig {
  const normalizedMeasurementId = measurementId?.trim() ?? '';
  if (!normalizedMeasurementId || !isProduction || platform !== 'web') {
    return { enabled: false, measurementId: normalizedMeasurementId || null };
  }

  return { enabled: true, measurementId: normalizedMeasurementId };
}

function isSensitiveAnalyticsKey(key: string) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function sanitizeAnalyticsPayload(payload: AnalyticsPayload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      if (isSensitiveAnalyticsKey(key)) return false;
      return ['string', 'number', 'boolean'].includes(typeof value);
    })
  ) as Record<string, string | number | boolean>;
}

export function buildAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  return {
    name,
    params: sanitizeAnalyticsPayload(payload),
  };
}

export function getGoogleTagScriptSrc(measurementId: string) {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
}

export function installGoogleTag(config: AnalyticsConfig, doc?: unknown, gtag?: Gtag) {
  if (!config.enabled || !doc || !gtag) return;

  const documentLike = doc as GoogleTagDocument;
  if (!documentLike.head) return;

  const script = documentLike.createElement('script');
  script.async = true;
  script.src = getGoogleTagScriptSrc(config.measurementId);
  documentLike.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', config.measurementId, { send_page_view: true });
}

export function trackAnalyticsEvent(
  config: AnalyticsConfig,
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
  gtag?: Gtag
) {
  if (!config.enabled || !gtag) return;

  const event = buildAnalyticsEvent(name, payload);
  gtag('event', event.name, event.params);
}

export function trackCoinmirrorEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  const gtag = (globalThis as { gtag?: Gtag }).gtag;
  trackAnalyticsEvent(
    buildAnalyticsConfig({
      measurementId: process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID,
      isProduction: process.env.NODE_ENV === 'production',
      platform: typeof window === 'undefined' ? 'native' : 'web',
    }),
    name,
    payload,
    gtag
  );
}
