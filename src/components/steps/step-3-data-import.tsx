import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';

import { ShareCard } from '@/components/share-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { analyzeCsvInput } from '@/lib/csv/analyze-csv';
import { analyzeUpbitPdfText } from '@/lib/pdf/adapters/upbit';
import {
  extractPdfText,
  isPdfNoTextLayerError,
  isPdfPasswordRequiredError,
} from '@/lib/pdf/extract-pdf-text';
import { buildExpectedInvestmentTypeProfile } from '@/lib/investment-type';
import { summarizeDiagnosis } from '@/lib/onboarding-diagnosis';
import { buildInvestmentTypeShareCard } from '@/lib/share-card';
import { useFlowStore } from '@/stores/use-flow-store';

type PickedAsset = DocumentPicker.DocumentPickerAsset & {
  file?: { arrayBuffer: () => Promise<ArrayBuffer> };
};

type UploadFormat = 'pdf' | 'csv';

async function readPickedAsset(asset: PickedAsset) {
  if (asset.file?.arrayBuffer) return asset.file.arrayBuffer();
  const response = await fetch(asset.uri);
  return response.arrayBuffer();
}

function isCsvAsset(asset: PickedAsset) {
  const lowerName = asset.name?.toLowerCase() ?? '';
  return lowerName.endsWith('.csv') || /csv|excel/.test(asset.mimeType ?? '');
}

function isPdfAsset(asset: PickedAsset) {
  const lowerName = asset.name?.toLowerCase() ?? '';
  return lowerName.endsWith('.pdf') || asset.mimeType === 'application/pdf';
}

function promptForPdfPassword() {
  const prompt = (globalThis as typeof globalThis & { prompt?: (message: string) => string | null })
    .prompt;
  return prompt?.('PDF 비밀번호를 입력해 주세요. 저장하지 않아요.')?.trim();
}

function documentTypesFor(format: UploadFormat) {
  return format === 'pdf'
    ? ['application/pdf']
    : ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
}

function showPasswordTrustGuide() {
  Alert.alert(
    '비밀번호는 어떻게 쓰이나요?',
    [
      '입력한 비밀번호는 이 기기에서 PDF를 여는 데만 쓰고, 저장하거나 서버로 보내지 않아요.',
      '거래소 계정 비밀번호가 아니라 이 PDF 파일 하나를 여는 암호예요.',
      '',
      '인쇄 → PDF로 저장으로 암호를 지운 파일은 글자가 이미지로 바뀌어서 숫자를 읽을 수 없어요. 업비트가 보낸 원본을 그대로 올려 주세요.',
    ].join('\n')
  );
}

function showImagePdfGuide(pageCount: number) {
  Alert.alert(
    '숫자를 읽을 수 없는 PDF예요',
    [
      `${pageCount}쪽 전체에서 글자를 찾지 못했어요. 인쇄해서 저장했거나 스캔한 이미지 PDF로 보여요.`,
      '',
      '업비트 고객센터에서 받은 원본 PDF를 그대로 올려 주세요. 비밀번호가 걸려 있어도 괜찮아요.',
      '비밀번호는 이 기기에서만 쓰고 저장하지 않습니다.',
    ].join('\n')
  );
}

export function Step3DataImport() {
  const runSample = useFlowStore((s) => s.runSample);
  const tradeAnalysis = useFlowStore((s) => s.tradeAnalysis);
  const setTradeAnalysisPreview = useFlowStore((s) => s.setTradeAnalysisPreview);
  const clearTradeAnalysis = useFlowStore((s) => s.clearTradeAnalysis);
  const confirmTradeAnalysis = useFlowStore((s) => s.confirmTradeAnalysis);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const setStep = useFlowStore((s) => s.setStep);
  const summary = summarizeDiagnosis(diagnosisAnswers as Parameters<typeof summarizeDiagnosis>[0]);
  const expectedType = buildExpectedInvestmentTypeProfile(diagnosisAnswers);
  const expectedShareCard = buildInvestmentTypeShareCard(expectedType, 'expected');

  async function handleUpload(format: UploadFormat) {
    const result = await DocumentPicker.getDocumentAsync({
      type: documentTypesFor(format),
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0] as PickedAsset;
    if (format === 'pdf' && !isPdfAsset(file)) {
      Alert.alert('PDF 파일이 아니에요', '업비트 PDF 거래내역을 골라 주세요.');
      return;
    }
    if (format === 'csv' && !isCsvAsset(file)) {
      Alert.alert('CSV 파일이 아니에요', '업비트 CSV 거래내역을 골라 주세요.');
      return;
    }
    try {
      const bytes = await readPickedAsset(file);
      if (isPdfAsset(file)) {
        let text: string;
        try {
          text = await extractPdfText(bytes);
        } catch (error) {
          if (isPdfNoTextLayerError(error)) {
            showImagePdfGuide(error.pageCount);
            return;
          }
          if (!isPdfPasswordRequiredError(error)) throw error;
          const password = promptForPdfPassword();
          if (!password) {
            Alert.alert(
              'PDF 비밀번호가 필요해요',
              '업비트 고객센터 PDF에는 비밀번호가 걸려 있어요. 비밀번호는 이 기기에서 PDF를 여는 데만 쓰고 저장하지 않아요.'
            );
            return;
          }
          try {
            text = await extractPdfText(bytes, { password });
          } catch (retryError) {
            if (isPdfNoTextLayerError(retryError)) {
              showImagePdfGuide(retryError.pageCount);
              return;
            }
            throw retryError;
          }
        }
        setTradeAnalysisPreview(analyzeUpbitPdfText(text, diagnosisAnswers));
        return;
      }
      setTradeAnalysisPreview(analyzeCsvInput(bytes, diagnosisAnswers));
    } catch {
      Alert.alert(
        '거래내역을 읽지 못했어요',
        '파일을 다시 골라 주세요. 원본과 PDF 비밀번호는 저장하지 않아요.'
      );
    }
  }

  function handleContinueTradeAnalysis() {
    if (!tradeAnalysis?.parse.executions.length) {
      const reason = tradeAnalysis?.preview.errors[0]?.reason;
      Alert.alert(
        '점수를 만들 수 없어요',
        reason
          ? `읽을 수 있는 거래가 없었어요.\n\n${reason}`
          : '읽을 수 있는 거래가 없었어요. 파일을 다시 확인한 뒤 올려 주세요.'
      );
      return;
    }
    confirmTradeAnalysis();
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">거래내역 불러오기</Text>
        <Text className="text-[13px] leading-5 text-muted-foreground">
          이제 자료를 불러올 차례예요. 예시로 보거나 PDF/CSV 거래내역을 올려요.
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
                코드 {expectedType.code} · 거래내역 없이 만든 예상
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
            {expectedType.comparisonCopy} 예상 카드는 점수·금액·종목명을 담지 않습니다.
          </Text>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            {expectedType.disclaimer}
          </Text>
          <ShareCard card={expectedShareCard} />
        </CardContent>
      </Card>

      {tradeAnalysis && (
        <Card>
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-extrabold text-foreground">
              {tradeAnalysis.preview.sourceFormatLabel} 파싱 미리보기
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                어댑터 {tradeAnalysis.preview.adapterLabel}
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                정상 {tradeAnalysis.preview.normalRowCount}행
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                오류 {tradeAnalysis.preview.errorRowCount}행
              </Text>
              <Text className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                건너뜀 {tradeAnalysis.preview.skippedRowCount}행
              </Text>
            </View>
            <Text className="text-xs leading-5 text-muted-foreground">
              기간 {tradeAnalysis.preview.periodLabel} · 종목 {tradeAnalysis.preview.symbolCount}개
            </Text>
            <View className="gap-1 rounded-2xl bg-muted p-3">
              <Text className="text-xs font-bold text-foreground">인식된 항목 매핑</Text>
              {Object.entries(tradeAnalysis.preview.columnMapping).map(([field, header]) => (
                <Text key={field} className="text-[11px] text-muted-foreground">
                  {field}: {header}
                </Text>
              ))}
            </View>
            {tradeAnalysis.preview.errors.length > 0 && (
              <View className="gap-1 rounded-2xl bg-destructive/10 p-3">
                <Text className="text-xs font-bold text-destructive">오류 행 상위 항목</Text>
                {tradeAnalysis.preview.errors.map((error) => (
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
              <Button className="flex-1" onPress={handleContinueTradeAnalysis}>
                <Text>이 데이터로 분석 계속</Text>
              </Button>
              <Button className="flex-1" variant="outline" onPress={clearTradeAnalysis}>
                <Text>다시 올리기</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="gap-1">
          <Text className="text-sm font-extrabold text-foreground">자료 형식을 골라 주세요</Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            업비트 고객센터 PDF가 가장 흔해요. CSV가 있다면 CSV도 괜찮습니다.
          </Text>
        </View>
        <Button onPress={runSample}>
          <Text>예시 데이터로 바로 체험하기</Text>
        </Button>
        <View className="flex-row gap-2">
          <Button className="flex-1" variant="outline" onPress={() => handleUpload('pdf')}>
            <Icon as={Upload} size={16} className="text-foreground" />
            <Text>PDF 거래내역 올리기</Text>
          </Button>
          <Button className="flex-1" variant="outline" onPress={() => handleUpload('csv')}>
            <Icon as={Upload} size={16} className="text-foreground" />
            <Text>CSV 거래내역 올리기</Text>
          </Button>
        </View>
        <View className="gap-2 rounded-2xl bg-muted p-3">
          <Text className="text-xs font-bold text-foreground">
            업비트가 보낸 원본 PDF를 올려 주세요
          </Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            비밀번호가 걸려 있어도 괜찮아요. 입력한 비밀번호는 이 기기에서 PDF를 여는 데만 쓰고
            저장하거나 서버로 보내지 않아요.
          </Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            인쇄 → “PDF로 저장”으로 암호를 지운 파일은 글자가 이미지로 바뀌어서 숫자를 읽을 수
            없어요. 오히려 암호가 풀린 거래내역서가 남으니 원본을 그대로 쓰는 편이 안전합니다.
          </Text>
          <Button size="sm" variant="ghost" onPress={showPasswordTrustGuide}>
            <Text className="text-xs text-primary">비밀번호가 어떻게 쓰이는지 보기</Text>
          </Button>
        </View>
        <Text className="text-xs leading-5 text-muted-foreground">
          파일은 이 기기 안에서만 읽어요. 원본과 PDF 비밀번호는 저장하지 않습니다.
        </Text>
      </View>
    </ScrollView>
  );
}
