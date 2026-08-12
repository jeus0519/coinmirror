import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { summarizeDiagnosis } from '@/lib/onboarding-diagnosis';
import { useFlowStore } from '@/stores/use-flow-store';

export function Step3DataImport() {
  const runSample = useFlowStore((s) => s.runSample);
  const uploadCsv = useFlowStore((s) => s.uploadCsv);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const setStep = useFlowStore((s) => s.setStep);
  const summary = summarizeDiagnosis(diagnosisAnswers as Parameters<typeof summarizeDiagnosis>[0]);

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
