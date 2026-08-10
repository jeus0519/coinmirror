import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Check, Upload } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { baseMetrics, KIND_LABEL } from '@/lib/mock-metrics';
import { useFlowStore } from '@/stores/use-flow-store';

const METRIC_TEASERS: Record<string, string> = {
  M1: '일평균 체결 횟수, 당일 왕복 비율, 실현손익 대비 누적 수수료 비중',
  M2: '평균 익절률과 손절률, 이익·손실 포지션의 평균 보유시간 차이',
  M3: '직전 본인 체결가보다 7% 이상 높은 가격에서 이뤄진 재매수 비율',
  M4: '보유 평단 대비 -10% 이하 구간에서 발생한 추가 매수 비율과 금액',
  M5: '손실을 확정한 뒤 2시간 안에 이뤄진 매수 비율과 그때의 베팅 배율',
  M6: '00~06시 거래 비중과 야간·주간 청산 손익률 격차',
};

const BOUNDARIES = [
  '매수 · 매도를 권하지 않습니다',
  '목표 가격 · 청산 가격 · 진입 가격을 제시하지 않습니다',
  '시세를 예측하거나 종목을 평가하지 않습니다',
  '거래소 API 키를 요구하지 않습니다',
  '원본 CSV를 서버에 저장하지 않습니다',
  '수익이나 원금을 보장하지 않습니다',
];

const FLOW_STEPS = [
  { n: 1, title: '거래내역 불러오기', desc: '예시 데이터 또는 내 CSV를 올립니다.' },
  { n: 2, title: '스코어 · 분석 확인', desc: '6개 지표와 근거 거래를 봅니다.' },
  { n: 3, title: '내 원칙 세우고 대조', desc: '직접 정한 기준선 대비 진행 현황을 봅니다.' },
];

export function Step1Start() {
  const runSample = useFlowStore((s) => s.runSample);
  const uploadCsv = useFlowStore((s) => s.uploadCsv);

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!file?.name?.toLowerCase().endsWith('.csv')) {
      Alert.alert('CSV 파일이 아니에요', '업비트 원화마켓 거래내역 CSV 파일을 선택해 주세요.');
      return;
    }
    uploadCsv(file.name);
  }

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
          거래소에서 내려받은 거래내역 CSV 하나로 6가지 행동 패턴을 사후 분석합니다. 무엇을 사거나
          팔라고 말하지 않습니다. 이미 지나간 내 거래가 어떤 모양이었는지만 그대로 보여드립니다.
        </Text>

        <View className="w-full gap-2.5">
          <Button onPress={runSample}>
            <Text>예시 데이터로 바로 체험하기</Text>
          </Button>
          <Button variant="outline" onPress={handleUpload}>
            <Icon as={Upload} size={16} className="text-foreground" />
            <Text>내 CSV 업로드</Text>
          </Button>
          <Button variant="ghost" onPress={() => router.push('/entry/new')}>
            <Text className="text-muted-foreground">직접 입력하기</Text>
          </Button>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">6가지 행동 지표</Text>
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
              <Text className="text-[13px] text-muted-foreground">{METRIC_TEASERS[m.id]}</Text>
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
            4단계로 이어집니다. 지금은 데모라 모든 단계를 바로 확인할 수 있습니다.
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
