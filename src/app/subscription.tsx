import { ArrowLeft, CheckCircle2, FileText, Flag, LineChart } from 'lucide-react-native';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const BENEFITS = [
  {
    icon: LineChart,
    eyebrow: '1. 더 깊이 보기',
    title: '기준선 저장',
    body: '방금 확인한 청산 승률, 수익·손실 보유기간, 거래 빈도를 기준선으로 남겨 다음 업로드 때 변화량을 자동 비교해요.',
    bullets: ['다음 업로드 때 변화량 자동 비교', '손실 보유기간이 줄었는지 추적', '반복되는 행동 패턴 TOP 3 정리'],
  },
  {
    icon: FileText,
    eyebrow: '2. 월간 리포트',
    title: '월간 투자습관 리포트',
    body: '한 번의 점수보다 중요한 건 같은 패턴이 반복되는지예요. 매월 PDF 리포트로 거래 습관 변화를 회고할 수 있게 정리해요.',
    bullets: ['월별 핵심 지표 요약', '전월 대비 개선·악화 포인트', '공유 가능한 PDF 리포트'],
  },
  {
    icon: Flag,
    eyebrow: '3. 목표 관리',
    title: '목표 저장과 다음 분석 체크',
    body: '예: “손실 보유기간 30% 줄이기”처럼 거래를 지시하지 않는 행동 목표를 저장하고, 다음 분석 때 달라졌는지 확인해요.',
    bullets: ['내 약점 기반 추천 목표', '목표 달성 여부 자동 체크', '다음 달 회고용 체크리스트'],
  },
] as const;

export default function SubscriptionPage() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
      <View className="gap-3">
        <Button size="sm" variant="ghost" className="self-start px-0" onPress={() => router.back()}>
          <Icon as={ArrowLeft} size={16} className="text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">무료 결과 계속 보기</Text>
        </Button>
        <View className="gap-2">
          <Text className="text-[11px] font-extrabold text-primary">코인미러 구독관리</Text>
          <Text className="text-2xl font-extrabold leading-8 text-foreground">
            한 번 본 분석을,{`\n`}다음 달 변화로 이어가요
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            코인미러 구독은 매수·매도 추천이 아니라, 과거 거래 기록을 기준으로 내 행동 패턴이
            반복되는지 관리하는 회고 도구예요.
          </Text>
        </View>
      </View>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="gap-3 pt-2">
          <Text className="text-base font-extrabold text-foreground">
            구독하면 무료 분석이 이렇게 확장돼요
          </Text>
          <Text className="text-sm leading-6 text-foreground">
            무료 결과는 이번 업로드의 현재 모습을 보여줘요. 구독관리에서는 이 결과를 기준선으로
            저장하고, 다음 업로드 때 승률·손실 보유기간·거래 빈도 변화까지 비교합니다.
          </Text>
          <Button onPress={() => router.push('/subscription-checkout')}>
            <Text>구독 신청하기</Text>
          </Button>
        </CardContent>
      </Card>

      <View className="gap-3">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title}>
            <CardContent className="gap-3 pt-2">
              <View className="flex-row items-start gap-3">
                <View className="rounded-2xl bg-primary/10 p-2.5">
                  <Icon as={benefit.icon} size={18} className="text-primary" />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[11px] font-extrabold text-primary">{benefit.eyebrow}</Text>
                  <Text className="text-lg font-extrabold text-foreground">{benefit.title}</Text>
                  <Text className="text-sm leading-6 text-muted-foreground">{benefit.body}</Text>
                </View>
              </View>
              <View className="gap-2 rounded-2xl bg-muted p-3">
                {benefit.bullets.map((bullet) => (
                  <View key={bullet} className="flex-row items-start gap-2">
                    <Icon as={CheckCircle2} size={14} className="mt-0.5 text-primary" />
                    <Text className="flex-1 text-xs leading-5 text-foreground">{bullet}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      <Card>
        <CardContent className="gap-3 pt-2">
          <Text className="text-base font-extrabold text-foreground">무료와 구독관리의 차이</Text>
          <View className="gap-2">
            <Text className="text-sm leading-6 text-foreground">
              무료: 이번 PDF/CSV의 투자거울 타입, 청산 승률, 수익·손실 보유기간, 기본 행동 점수를
              확인해요.
            </Text>
            <Text className="text-sm leading-6 text-foreground">
              구독관리: 이번 분석을 저장하고 다음 업로드와 비교해, 월간 투자습관 리포트와 목표
              달성 여부를 확인해요.
            </Text>
          </View>
          <Button className="mt-1" onPress={() => router.back()}>
            <Text>내 분석 결과로 돌아가기</Text>
          </Button>
          <Button variant="outline" onPress={() => router.push('/subscription-checkout')}>
            <Text>구독 신청하기</Text>
          </Button>
        </CardContent>
      </Card>

      <Text className="text-[11px] leading-5 text-muted-foreground">
        투자 조언이 아니라 과거 거래 기록을 회고하는 기능입니다. 특정 자산의 매수·매도 추천,
        가격 예측, 수익 보장을 제공하지 않아요.
      </Text>
    </ScrollView>
  );
}
