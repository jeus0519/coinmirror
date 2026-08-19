import { Check } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { baseMetrics, KIND_LABEL } from '@/lib/mock-metrics';
import { useFlowStore } from '@/stores/use-flow-store';

const BOUNDARIES = [
  '매수 · 매도를 권하지 않습니다',
  '목표 가격 · 청산 가격 · 진입 가격을 제시하지 않습니다',
  '시세를 예측하거나 종목을 평가하지 않습니다',
  '거래소 API 키를 요구하지 않습니다',
  '원본 CSV를 서버에 저장하지 않습니다',
  '수익이나 원금을 보장하지 않습니다',
];

const FLOW_STEPS = [
  { n: 1, title: '내 투자 거울 설정', desc: '8문항에 답하거나 나중으로 건너뜁니다.' },
  { n: 2, title: '거래내역 불러오기', desc: '예시 데이터 또는 내 CSV를 올립니다.' },
  { n: 3, title: '예상·실제와 점수 확인', desc: 'F1~F10과 자기인식 차이를 봅니다.' },
  { n: 4, title: '프리셋 원칙 선택', desc: '다음 분석에서 자동 확인할 원칙을 하나 고릅니다.' },
];

export function Step1Start() {
  const setStep = useFlowStore((s) => s.setStep);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-10 p-4 pb-12">
      <View className="items-center gap-4 pt-4">
        <View className="rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5">
          <Text className="text-xs font-bold text-primary">
            투자 조언이 아닌, 내 거래의 사후 행동 요약
          </Text>
        </View>

        <Text className="text-center text-[26px] font-extrabold leading-9 tracking-tight text-foreground">
          당신의 매매 기록은,{'\n'}
          <Text className="text-[26px] font-extrabold text-primary">당신의 습관</Text>을 이미 알고
          있습니다.
        </Text>

        <Text className="text-center text-[15px] leading-6 text-muted-foreground">
          거래소에서 내려받은 거래내역 CSV 하나로 9가지 행동 점수와 종합점수를 사후 분석합니다.
          무엇을 사거나 팔라고 말하지 않습니다. 이미 지나간 내 거래가 어떤 모양이었는지만 그대로
          보여드립니다. 먼저 짧은 성향 진단으로 스코어 해석 기준을 개인화한 뒤 거래내역을
          불러옵니다.
        </Text>

        <View className="w-full gap-2.5">
          <Button onPress={() => setStep(2)}>
            <Text>투자 성향 진단 시작하기</Text>
          </Button>
          <Button variant="outline" onPress={() => setStep(2)}>
            <Text>설명 먼저 보고 시작하기</Text>
          </Button>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">
            Free 행동 점수 9종 + 종합점수
          </Text>
          <Text className="text-[13px] text-muted-foreground">
            모두 CSV만으로 계산 가능한 항목입니다. 표본이 부족하면 점수를 만들지 않고 &lsquo;측정
            중&rsquo;으로 남깁니다.
          </Text>
        </View>
        <View className="gap-2.5">
          {baseMetrics.map((m) => (
            <View key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-[11px] font-extrabold text-primary">
                {m.id} · {KIND_LABEL[m.kind]}
              </Text>
              <Text className="mb-1 mt-1 text-[15px] font-bold text-foreground">{m.name}</Text>
              <Text className="text-[13px] text-muted-foreground">{m.headline}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-3 rounded-2xl bg-foreground p-6">
        <Text className="text-lg font-extrabold text-background">coinmirror가 하지 않는 것</Text>
        <Text className="text-[13px] text-background/70">
          이 서비스는 투자 자문이 아니라 기록 · 회고 도구입니다. 아래는 지키기로 한 경계선입니다.
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

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">진행 방식</Text>
          <Text className="text-[13px] text-muted-foreground">
            초기 이용 흐름은 4단계로 이어집니다. 지금은 목업 데이터로 전체 흐름을 확인할 수
            있습니다.
          </Text>
        </View>
        <View className="gap-2.5">
          {FLOW_STEPS.map((s) => (
            <View
              key={s.n}
              className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <View className="h-6 w-6 items-center justify-center rounded-lg bg-secondary/10">
                <Text className="text-[13px] font-extrabold text-secondary">{s.n}</Text>
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
