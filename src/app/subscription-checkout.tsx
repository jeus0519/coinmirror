import { ArrowLeft, Bell, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { trackCoinmirrorEvent } from '@/lib/analytics';

const PLAN_ITEMS = [
  '이번 분석을 기준선으로 저장',
  '다음 업로드 때 변화량 자동 비교',
  '월간 투자습관 리포트 안내',
  '목표 저장과 달성 여부 체크',
] as const;

export default function SubscriptionCheckoutPage() {
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const waitlistFormUrl = process.env.EXPO_PUBLIC_WAITLIST_FORM_URL?.trim();

  async function handleWaitlistInterestClick() {
    trackCoinmirrorEvent('waitlist_interest_click', {
      screen: 'subscription_waitlist',
      has_form_url: Boolean(waitlistFormUrl),
    });

    if (!waitlistFormUrl) {
      setSubmissionNotice('출시 알림 폼 URL이 아직 연결되지 않았어요. 지금은 관심 클릭만 익명으로 기록합니다.');
      return;
    }

    await Linking.openURL(waitlistFormUrl);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
      <View className="gap-3">
        <Button size="sm" variant="ghost" className="self-start px-0" onPress={() => router.back()}>
          <Icon as={ArrowLeft} size={16} className="text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">구독 혜택으로 돌아가기</Text>
        </Button>
        <View className="gap-2">
          <Text className="text-[11px] font-extrabold text-primary">구독관리 출시 알림</Text>
          <Text className="text-2xl font-extrabold leading-8 text-foreground">
            무료 분석은 먼저 열고,{`\n`}구독관리는 준비되면 알려드려요
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            핵심 진단은 무료로 먼저 사용하도록 열어두고, 월간 리포트·목표 추적·다음 업로드
            비교 기능은 출시 알림으로 관심 신호를 모읍니다.
          </Text>
        </View>
      </View>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="gap-4 pt-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-[11px] font-extrabold text-primary">준비 중인 구독관리</Text>
              <Text className="text-xl font-extrabold text-foreground">월간 변화 관리 알림</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                한 번의 결과로 끝내지 않고, 다음 업로드와 비교하며 내 거래 습관 변화를 회고하는
                기능을 준비 중이에요.
              </Text>
            </View>
            <View className="rounded-2xl bg-background p-3">
              <Icon as={Bell} size={20} className="text-primary" />
            </View>
          </View>

          <View className="gap-2 rounded-2xl bg-background/90 p-3">
            {PLAN_ITEMS.map((item) => (
              <View key={item} className="flex-row items-start gap-2">
                <Icon as={CheckCircle2} size={14} className="mt-0.5 text-primary" />
                <Text className="flex-1 text-xs leading-5 text-foreground">{item}</Text>
              </View>
            ))}
          </View>

          <Button onPress={handleWaitlistInterestClick}>
            <Icon as={Bell} size={16} className="text-primary-foreground" />
            <Text>출시 알림 관심 표시하기</Text>
          </Button>
          {submissionNotice && (
            <View className="rounded-2xl border border-primary/30 bg-background/90 p-3">
              <Text className="text-xs leading-5 text-foreground">{submissionNotice}</Text>
            </View>
          )}
          <Text className="text-[11px] leading-5 text-muted-foreground">
            이메일은 출시 알림과 월간 리포트 안내에만 사용합니다. 원본 PDF/CSV, PDF 비밀번호,
            개별 체결 원문은 저장하지 않아요.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3 pt-2">
          <View className="flex-row items-start gap-3">
            <View className="rounded-2xl bg-muted p-2.5">
              <Icon as={ShieldCheck} size={18} className="text-primary" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-base font-extrabold text-foreground">무료 공개 단계의 원칙</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                가격표와 구매 버튼은 사내 겸업·이해충돌 검토가 끝나기 전까지 노출하지 않습니다.
                지금은 무료 사용 경험과 선택형 알림 등록만 검증해요.
              </Text>
            </View>
          </View>
          <Button variant="outline" onPress={() => router.back()}>
            <Text>혜택 다시 보기</Text>
          </Button>
        </CardContent>
      </Card>

      <Text className="text-[11px] leading-5 text-muted-foreground">
        실제 결제나 과금은 발생하지 않습니다. 본 기능은 투자 조언이 아니라 과거 거래 기록을
        회고하고 목표를 관리하는 구독관리 준비 기능입니다.
      </Text>
    </ScrollView>
  );
}
