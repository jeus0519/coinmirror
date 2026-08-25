import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { analyzeCsvInput } from '@/lib/csv/analyze-csv';
import { buildExpectedInvestmentTypeProfile } from '@/lib/investment-type';
import { summarizeDiagnosis } from '@/lib/onboarding-diagnosis';
import { buildInvestmentTypeShareCard } from '@/lib/share-card';
import { useFlowStore } from '@/stores/use-flow-store';

type PickedAsset = DocumentPicker.DocumentPickerAsset & {
  file?: { arrayBuffer: () => Promise<ArrayBuffer> };
};

async function readPickedAsset(asset: PickedAsset) {
  if (asset.file?.arrayBuffer) return asset.file.arrayBuffer();
  const response = await fetch(asset.uri);
  return response.arrayBuffer();
}

export function Step3DataImport() {
  const runSample = useFlowStore((s) => s.runSample);
  const csvAnalysis = useFlowStore((s) => s.csvAnalysis);
  const setCsvAnalysisPreview = useFlowStore((s) => s.setCsvAnalysisPreview);
  const clearCsvAnalysis = useFlowStore((s) => s.clearCsvAnalysis);
  const confirmCsvAnalysis = useFlowStore((s) => s.confirmCsvAnalysis);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const setStep = useFlowStore((s) => s.setStep);
  const summary = summarizeDiagnosis(diagnosisAnswers as Parameters<typeof summarizeDiagnosis>[0]);
  const expectedType = buildExpectedInvestmentTypeProfile(diagnosisAnswers);
  const expectedShareCard = buildInvestmentTypeShareCard(expectedType, 'expected');

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    if (result.canceled) return;
    const file = result.assets[0] as PickedAsset;
    if (!file?.name?.toLowerCase().endsWith('.csv')) {
      Alert.alert('CSV 파일이 아니에요', '업비트 원화마켓 거래내역 CSV 파일을 선택해 주세요.');
      return;
    }
    try {
      const bytes = await readPickedAsset(file);
      setCsvAnalysisPreview(analyzeCsvInput(bytes, diagnosisAnswers));
    } catch {
      Alert.alert(
        'CSV를 읽지 못했어요',
        '파일을 다시 선택해 주세요. 원본은 서버로 전송하지 않습니다.'
      );
    }
  }

  function handleContinueCsv() {
    if (!csvAnalysis?.parse.executions.length) {
      Alert.alert('점수를 만들 수 없어요', '필수 컬럼과 정상 행을 확인한 뒤 다시 올려 주세요.');
      return;
    }
    confirmCsvAnalysis();
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
          <View className="gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
            <Text className="text-xs font-extrabold text-primary">
              캡처용 공유 카드 · 예상 타입
            </Text>
            <Text className="text-lg font-extrabold text-foreground">
              {expectedShareCard.title}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {expectedShareCard.label} · {expectedShareCard.code}
            </Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              {expectedShareCard.axisLine}
            </Text>
            <Text className="text-[11px] leading-4 text-muted-foreground">
              {expectedShareCard.description} {expectedShareCard.compliance} ·{' '}
              {expectedShareCard.watermark}
            </Text>
          </View>
        </CardContent>
      </Card>

      {csvAnalysis && (
        <Card>
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-extrabold text-foreground">CSV 파싱 미리보기</Text>
            <View className="flex-row flex-wrap gap-2">
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                어댑터 {csvAnalysis.preview.adapterLabel}
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                정상 {csvAnalysis.preview.normalRowCount}행
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                오류 {csvAnalysis.preview.errorRowCount}행
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                건너뜀 {csvAnalysis.preview.skippedRowCount}행
              </Text>
            </View>
            <Text className="text-xs leading-5 text-muted-foreground">
              기간 {csvAnalysis.preview.periodLabel} · 종목 {csvAnalysis.preview.symbolCount}개
            </Text>
            <View className="gap-1 rounded-2xl bg-muted p-3">
              <Text className="text-xs font-bold text-foreground">인식된 컬럼 매핑</Text>
              {Object.entries(csvAnalysis.preview.columnMapping).map(([field, header]) => (
                <Text key={field} className="text-[11px] text-muted-foreground">
                  {field}: {header}
                </Text>
              ))}
            </View>
            {csvAnalysis.preview.errors.length > 0 && (
              <View className="gap-1 rounded-2xl bg-destructive/10 p-3">
                <Text className="text-xs font-bold text-destructive">오류 행 상위 항목</Text>
                {csvAnalysis.preview.errors.map((error) => (
                  <Text
                    key={`${error.rowNumber}-${error.reason}`}
                    className="text-[11px] text-muted-foreground"
                  >
                    {error.rowNumber}행 · {error.reason}
                  </Text>
                ))}
              </View>
            )}
            <View className="flex-row gap-2">
              <Button className="flex-1" onPress={handleContinueCsv}>
                <Text>이 데이터로 분석 계속</Text>
              </Button>
              <Button className="flex-1" variant="outline" onPress={clearCsvAnalysis}>
                <Text>다시 올리기</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

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
