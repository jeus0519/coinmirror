import { Check } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { trackCoinmirrorEvent } from '@/lib/analytics';
import { baseMetrics, displayMetricName, KIND_LABEL } from '@/lib/mock-metrics';
import { useFlowStore } from '@/stores/use-flow-store';

const BOUNDARIES = [
  '매수 · 매도를 권하지 않아요',
  '목표가 · 진입가를 찍어주지 않아요',
  '시세 예측을 하지 않아요',
  '거래소 API 키를 요구하지 않아요',
  '원본 파일과 PDF 비밀번호를 저장하지 않아요',
  '손익 결과를 약속하지 않아요',
];

const FLOW_STEPS = [
  { n: 1, title: '짧은 진단', desc: '내 기준을 먼저 잡아요.' },
  { n: 2, title: '자료 업로드', desc: 'PDF 또는 CSV를 골라요.' },
  { n: 3, title: '기록 확인', desc: '점수와 차이를 봐요.' },
  { n: 4, title: '원칙 선택', desc: '다음에 볼 기준을 정해요.' },
];

export function Step1Start() {
  const setStep = useFlowStore((s) => s.setStep);

  function handleStartClick(targetStep: 2 | 3, cta: 'diagnosis' | 'upload_first') {
    trackCoinmirrorEvent('start_click', { screen: 'landing', cta });
    setStep(targetStep);
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 px-4 pb-10 pt-6">
      <View className="mx-auto w-full max-w-3xl items-center gap-4 pt-2">
        <View className="rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1.5">
          <Text className="text-xs font-bold text-primary-foreground">
            무료 분석 · 파일은 내 브라우저에서만
          </Text>
        </View>

        <Text className="text-center text-[30px] font-extrabold leading-9 tracking-tight text-foreground">
          사라, 팔라 대신{`\n`}
          <Text className="text-[30px] font-extrabold text-primary-foreground">내가 어떻게 거래했는지 봅니다</Text>
        </Text>

        <Text className="text-center text-[15px] leading-6 text-muted-foreground">
          업비트 PDF/CSV 거래내역을 올리면 내 투자 습관을 짧게 확인해요. 회원가입 없이 무료로 확인하고, 원본 파일은 서버에 저장하지 않아요.
        </Text>

        <View className="w-full max-w-2xl gap-2.5">
          <Button onPress={() => handleStartClick(2, 'diagnosis')}>
            <Text>무료로 내 거래 습관 보기</Text>
          </Button>
          <Button variant="outline" onPress={() => handleStartClick(3, 'upload_first')}>
            <Text>PDF/CSV 바로 올리기</Text>
          </Button>
        </View>
      </View>

      <View className="mx-auto w-full max-w-5xl gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">이런 걸 봐요</Text>
          <Text className="text-[13px] text-muted-foreground">
            PDF/CSV 거래내역으로 계산합니다. 표본이 부족하면 솔직히 “측정 중”으로 둡니다.
          </Text>
        </View>
        <View className="gap-2.5">
          {baseMetrics.map((m) => (
            <View key={m.id} className="rounded-3xl border border-border bg-card p-4">
              <Text className="text-[11px] font-extrabold text-primary-foreground">
                {m.id} · {KIND_LABEL[m.kind]}
              </Text>
              <Text className="mb-1 mt-1 text-[15px] font-bold text-foreground">{displayMetricName(m)}</Text>
              <Text className="text-[13px] text-muted-foreground">{m.headline}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-auto w-full max-w-5xl gap-3 rounded-3xl bg-foreground p-6">
        <Text className="text-lg font-extrabold text-background">코인미러가 하지 않는 것</Text>
        <Text className="text-[13px] text-background/70">
          코인미러는 기록 회고 도구예요. 이 선은 지킵니다.
        </Text>
        <View className="gap-2.5">
          {BOUNDARIES.map((item) => (
            <View key={item} className="flex-row items-start gap-2">
              <Icon as={Check} size={14} className="mt-0.5 text-primary" />
              <Text className="flex-1 text-[13.5px] text-background">{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-auto w-full max-w-5xl gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">진행 방식</Text>
          <Text className="text-[13px] text-muted-foreground">
            짧게 답하고, 자료를 올리고, 기록을 봅니다.
          </Text>
        </View>
        <View className="gap-2.5">
          {FLOW_STEPS.map((s) => (
            <View
              key={s.n}
              className="flex-row items-start gap-3 rounded-3xl border border-border bg-card p-4"
            >
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Text className="text-[13px] font-extrabold text-primary-foreground">{s.n}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-[15px] font-bold text-foreground">{s.title}</Text>
                <Text className="text-[13px] text-muted-foreground">{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
