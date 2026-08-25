import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { buildExpectedInvestmentTypeProfile } from '@/lib/investment-type';
import { summarizeDiagnosis } from '@/lib/onboarding-diagnosis';
import { useFlowStore } from '@/stores/use-flow-store';

export function Step3DataImport() {
  const runSample = useFlowStore((s) => s.runSample);
  const uploadCsv = useFlowStore((s) => s.uploadCsv);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const setStep = useFlowStore((s) => s.setStep);
  const summary = summarizeDiagnosis(diagnosisAnswers as Parameters<typeof summarizeDiagnosis>[0]);
  const expectedType = buildExpectedInvestmentTypeProfile(diagnosisAnswers);

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
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">거래내역 불러오기</Text>
        <Text className="text-[13px] leading-5 text-muted-foreground">
          진단 답변을 저장했습니다. 이제 예시 데이터나 CSV 거래내역을 불러와 스코어를 계산합니다.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-2 pt-2">
          <Text className="text-sm font-bold text-foreground">이번 분석의 개인화 기준</Text>
          <Text className="text-[13px] leading-5 text-foreground">{summary.headline}</Text>
          <Button size="sm" variant="ghost" onPress={() => setStep(2)}>
            <Text className="text-muted-foreground">진단 답변 수정하기</Text>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3 pt-2">
          <Text className="text-[11px] font-extrabold text-primary">예상 투자거울 타입</Text>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xl font-extrabold text-foreground">{expectedType.title}</Text>
              <Text className="text-xs text-muted-foreground">
                코드 {expectedType.code} · CSV 없이 만든 예상
              </Text>
            </View>
            <Text className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              공유 카드 후보
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {expectedType.axes.map((axis) => (
              <Text
                key={axis.axis}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                {axis.code} · {axis.label}
              </Text>
            ))}
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            {expectedType.comparisonCopy} 예상 카드는 점수·금액·수익률·종목명을 담지 않습니다.
          </Text>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            {expectedType.disclaimer}
          </Text>
        </CardContent>
      </Card>

      <View className="gap-2.5 rounded-2xl border border-border bg-card p-4">
        <Button onPress={runSample}>
          <Text>예시 데이터로 바로 체험하기</Text>
        </Button>
        <Button variant="outline" onPress={handleUpload}>
          <Icon as={Upload} size={16} className="text-foreground" />
          <Text>내 CSV 업로드</Text>
        </Button>
        <Text className="text-xs leading-5 text-muted-foreground">
          파일은 분석을 위한 메모리 처리 목업으로만 사용됩니다. 실제 서버 저장 여부는 출시 전 보안
          정책에 맞춰 별도 고지합니다.
        </Text>
      </View>
    </ScrollView>
  );
}
