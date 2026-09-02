import { ArrowLeft, CheckCircle2, FileText, Flag, LineChart } from 'lucide-react-native';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const COMPARE_ROWS = [
  {
    item: '이번 업로드 분석',
    free: '투자거울 타입과 기본 행동 점수 확인',
    pro: '분석 이력 누적과 이전 회차 비교',
  },
  {
    item: '기준선 저장',
    free: '이번 결과만 확인',
    pro: '다음 업로드 때 승률·보유기간 변화 비교',
  },
  {
    item: '월간 리포트',
    free: '제공 안 함',
    pro: '앱 안 월간 투자습관 리포트 미리보기',
  },
  {
    item: '목표 관리',
    free: '목표 후보만 확인',
    pro: '목표 저장과 달성 여부 추적',
  },
  {
    item: '데이터 보관',
    free: '원본과 비밀번호 저장 안 함',
    pro: '원본 없이 분석 요약만 저장',
  },
] as const;

const BENEFITS = [
  {
    icon: LineChart,
    eyebrow: '1. 더 깊이 보기',
    title: '기준선 저장',
    body: '방금 확인한 청산 승률, 수익·손실 보유기간, 거래 빈도를 기준선으로 남겨 다음 업로드 때 변화량을 자동 비교해요.',
    bullets: ['다음 업로드 때 변화량 자동 비교', '손실 보유기간이 줄었는지 추적', '반복되는 행동 패턴 TOP 3 정리'],
    previewTitle: '기준선 비교 미리보기',
    previewRows: ['이번 분석 · 청산 승률 33.6%', '이번 분석 · 손실 보유기간 13.5일', '다음 업로드 · 변화 비교 예정'],
  },
  {
    icon: FileText,
    eyebrow: '2. 월간 리포트',
    title: '월간 투자습관 리포트',
    body: '한 번의 점수보다 중요한 건 같은 패턴이 반복되는지예요. 이 달에 저장한 분석 요약으로 중복 제외와 목표 회고까지 앱 안에서 먼저 보여줘요.',
    bullets: ['이번 달 저장한 분석 요약', '신규 반영 체결과 중복 제외 표시', '원가 연결 보정과 목표 회고'],
    previewTitle: '월간 요약 리포트 미리보기',
    previewRows: ['이번 달 저장한 분석 · 2개', '신규 반영 체결 3건 · 중복 제외 1건', '원가 연결 보정 1건 · 목표 회고 포함', '원본 PDF와 비밀번호는 저장하지 않음'],
  },
  {
    icon: Flag,
    eyebrow: '3. 목표 관리',
    title: '목표 저장과 다음 분석 체크',
    body: '예: “손실 보유기간 30% 줄이기”처럼 거래를 지시하지 않는 행동 목표를 저장하고, 다음 분석 때 달라졌는지 확인해요.',
    bullets: ['내 약점 기반 추천 목표', '목표 달성 여부 자동 체크', '다음 달 회고용 체크리스트'],
    previewTitle: '목표 후보 미리보기',
    previewRows: ['목표 후보 · 손실 보유기간 줄이기', '사용자가 직접 저장 여부 결정', '다음 분석 때 달성 여부 확인'],
  },
] as const;

function PreviewMock({ title, rows }: { title: string; rows: readonly string[] }) {
  return (
    <View className="gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <Text className="text-[11px] font-extrabold text-primary">{title}</Text>
      {rows.map((row, index) => (
        <View key={row} className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className={'flex-1 text-xs leading-5 ' + (index === rows.length - 1 ? 'font-bold text-foreground' : 'text-muted-foreground')}>
            {row}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function SubscriptionPage() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
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

      <Card>
        <CardContent className="gap-3 pt-2">
          <Text className="text-base font-extrabold text-foreground">무료 vs 구독관리</Text>
          <View className="gap-2">
            {COMPARE_ROWS.map((row) => (
              <View key={row.item} className="gap-2 rounded-2xl border border-border bg-background p-3">
                <Text className="text-xs font-extrabold text-foreground">{row.item}</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 gap-1 rounded-xl bg-muted p-2.5">
                    <Text className="text-[10px] font-bold text-muted-foreground">무료</Text>
                    <Text className="text-[11px] leading-4 text-foreground">{row.free}</Text>
                  </View>
                  <View className="flex-1 gap-1 rounded-xl bg-primary/10 p-2.5">
                    <Text className="text-[10px] font-bold text-primary">구독관리</Text>
                    <Text className="text-[11px] font-semibold leading-4 text-foreground">
                      {row.pro}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
              <PreviewMock title={benefit.previewTitle} rows={benefit.previewRows} />
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

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="gap-3 pt-2">
          <Text className="text-base font-extrabold text-foreground">
            이번 분석을 다음 달 기준선으로 남겨둘까요?
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            결제 전환 전 단계에서 플랜과 보관 방식을 한 번 더 확인할 수 있어요.
          </Text>
          <Button onPress={() => router.push('/subscription-checkout')}>
            <Text>구독 신청하기</Text>
          </Button>
        </CardContent>
      </Card>

      <Text className="text-[11px] leading-5 text-muted-foreground">
        투자 조언이 아니라 과거 거래 기록을 회고하는 기능입니다. 특정 자산의 매수·매도 추천,
        가격 예측, 수익 보장을 제공하지 않아요.
      </Text>

      {/* 하단 보조 액션: 구매 CTA와 분리해 전환 흐름을 방해하지 않도록 최하단에 둔다. */}
      <Button size="sm" variant="ghost" className="self-center" onPress={() => router.back()}>
        <Icon as={ArrowLeft} size={16} className="text-muted-foreground" />
        <Text className="text-xs text-muted-foreground">내 분석 결과로 돌아가기</Text>
      </Button>
    </ScrollView>
  );
}
