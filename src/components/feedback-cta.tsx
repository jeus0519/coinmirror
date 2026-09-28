import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { trackCoinmirrorEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const FEEDBACK_SAFETY_COPY =
  '자유롭게 의견을 적어주세요. 단, 거래 종목, 금액, 수량, 수익률, 원본 파일명, PDF 비밀번호, 계좌·고객정보 등 개인 거래정보는 입력하지 말아 주세요.';

export function getFeedbackFormUrl() {
  const extra = Constants.expoConfig?.extra as { feedbackFormUrl?: unknown } | undefined;
  const extraUrl = typeof extra?.feedbackFormUrl === 'string' ? extra.feedbackFormUrl.trim() : '';
  const envUrl = process.env.EXPO_PUBLIC_FEEDBACK_FORM_URL?.trim() ?? '';

  return extraUrl || envUrl;
}

type FeedbackCtaTone = 'card' | 'inline' | 'ghost';

type FeedbackCtaProps = {
  screen: 'analysis' | 'goals' | 'info';
  title?: string;
  description?: string;
  buttonText?: string;
  tone?: FeedbackCtaTone;
  showSafetyCopy?: boolean;
  className?: string;
};

export function FeedbackCta({
  screen,
  title,
  description,
  buttonText = '30초 피드백 남기기',
  tone = 'inline',
  showSafetyCopy = true,
  className,
}: FeedbackCtaProps) {
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const feedbackFormUrl = getFeedbackFormUrl();

  async function handleFeedbackClick() {
    trackCoinmirrorEvent('feedback_click', {
      screen,
      has_form_url: Boolean(feedbackFormUrl),
    });

    if (!feedbackFormUrl) {
      setFeedbackNotice(
        '피드백 폼 URL이 아직 연결되지 않았어요. 지금은 피드백 클릭만 익명으로 기록합니다.'
      );
      return;
    }

    await Linking.openURL(feedbackFormUrl);
  }

  return (
    <View
      className={cn(
        tone === 'card'
          ? 'gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4'
          : tone === 'ghost'
            ? 'items-center gap-2 px-2'
            : 'gap-2',
        className
      )}
    >
      {(title || description) && (
        <View className="gap-1">
          {title && <Text className="text-sm font-extrabold text-foreground">{title}</Text>}
          {description && (
            <Text className="text-xs leading-5 text-muted-foreground">{description}</Text>
          )}
        </View>
      )}
      <Button variant={tone === 'ghost' ? 'ghost' : 'outline'} onPress={handleFeedbackClick}>
        <Text>{buttonText}</Text>
      </Button>
      {showSafetyCopy && (
        <Text className="text-[11px] leading-4 text-muted-foreground">{FEEDBACK_SAFETY_COPY}</Text>
      )}
      {feedbackNotice && (
        <View className="w-full rounded-2xl border border-primary/30 bg-background/80 p-3">
          <Text className="text-xs leading-5 text-foreground">{feedbackNotice}</Text>
        </View>
      )}
    </View>
  );
}
