import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';

import { ShareCard } from '@/components/share-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
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

/**
 * 화면 안 안내 배너. react-native-web에서 `Alert.alert`는 아무 것도 하지 않는 빈 함수라
 * 오류·안내를 Alert으로 띄우면 Chrome에서는 "눌러도 무반응"으로 보인다.
 * 그래서 이 화면의 모든 피드백은 Alert이 아니라 이 상태로만 표시한다.
 */
type Notice = {
  tone: 'info' | 'error';
  title: string;
  body: string;
  /** 이미지 PDF처럼 사용자가 바로 할 수 있는 다음 행동이 있을 때 예시 체험 버튼을 붙인다. */
  offerSample?: boolean;
};

const ACCEPT: Record<UploadFormat, string> = {
  pdf: '.pdf,application/pdf',
  csv: '.csv,text/csv,text/plain,application/vnd.ms-excel',
};

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

function documentTypesFor(format: UploadFormat) {
  return format === 'pdf'
    ? ['application/pdf']
    : ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
}

function formatBytes(size?: number) {
  if (!size) return '';
  if (size < 1024) return ` · ${size}바이트`;
  if (size < 1024 * 1024) return ` · ${(size / 1024).toFixed(0)}KB`;
  return ` · ${(size / (1024 * 1024)).toFixed(1)}MB`;
}

/** 진행 문구가 실제로 그려진 뒤에 무거운 파싱을 시작하도록 한 프레임 양보한다. */
function nextFrame() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function describeFailure(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return '알 수 없는 오류';
}

function showPasswordTrustGuide(): Notice {
  return {
    tone: 'info',
    title: '비밀번호는 어떻게 쓰이나요?',
    body: [
      '입력한 비밀번호는 이 기기에서 PDF를 여는 데만 쓰고, 저장하거나 서버로 보내지 않아요.',
      '거래소 계정 비밀번호가 아니라 이 PDF 파일 하나를 여는 암호예요.',
      '',
      '인쇄 → PDF로 저장으로 암호를 지운 파일은 글자가 이미지로 바뀌어서 숫자를 읽을 수 없어요. 업비트가 보낸 원본을 그대로 올려 주세요.',
    ].join('\n'),
  };
}

function showImagePdfGuide(pageCount: number): Notice {
  return {
    tone: 'info',
    title: '숫자를 읽을 수 없는 PDF예요',
    body: [
      `${pageCount}쪽 전체에서 글자를 찾지 못했어요. 인쇄해서 저장했거나 스캔한 이미지 PDF로 보여요.`,
      '',
      '업비트 고객센터에서 받은 원본 PDF를 그대로 올려 주세요. 비밀번호가 걸려 있어도 괜찮아요.',
      '비밀번호는 이 기기에서만 쓰고 저장하지 않습니다.',
    ].join('\n'),
    offerSample: true,
  };
}

/**
 * 웹에서는 스타일된 버튼 위에 진짜 `<input type="file">`을 투명하게 덮는다.
 *
 * 이전 구현은 expo-document-picker(또는 직접 만든 input)를 async 핸들러 안에서
 * 프로그램적으로 click 했다. 그러면 Chrome이 사용자 제스처를 잃어 파일 창이 아예 안 뜨거나,
 * 창을 닫아도 change가 오지 않아 Promise가 매달린 채 화면에 아무 변화가 없었다.
 * 사용자의 클릭이 input 자체에 직접 떨어지면 그 문제가 원천적으로 없다.
 *
 * 네이티브는 그대로 expo-document-picker를 쓴다.
 */
function FilePickerButton({
  format,
  label,
  disabled,
  onPicked,
  onFailed,
}: {
  format: UploadFormat;
  label: string;
  disabled: boolean;
  onPicked: (asset: PickedAsset, format: UploadFormat) => void;
  onFailed: (notice: Notice) => void;
}) {
  async function pickWithNativeDialog() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: documentTypesFor(format),
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      onPicked(result.assets[0] as PickedAsset, format);
    } catch (error) {
      onFailed({
        tone: 'error',
        title: '파일 선택 창을 열지 못했어요',
        body: `잠시 뒤 다시 시도해 주세요.\n사유: ${describeFailure(error)}`,
      });
    }
  }

  const button = (
    <Button
      className="w-full"
      variant="outline"
      disabled={disabled}
      onPress={Platform.OS === 'web' ? undefined : pickWithNativeDialog}
    >
      <Icon as={Upload} size={16} className="text-foreground" />
      <Text>{label}</Text>
    </Button>
  );

  if (Platform.OS !== 'web') return <View className="flex-1">{button}</View>;

  return (
    <View className="flex-1">
      {button}
      <input
        type="file"
        aria-label={label}
        accept={ACCEPT[format]}
        disabled={disabled}
        // 같은 파일을 다시 골라도 change가 뜨도록 창을 열기 직전에 값을 비운다.
        onClick={(event) => {
          event.currentTarget.value = '';
        }}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          onPicked(
            {
              name: file.name,
              mimeType: file.type,
              uri: '',
              size: file.size,
              file,
            } as PickedAsset,
            format
          );
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: disabled ? 'default' : 'pointer',
        }}
      />
    </View>
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

  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingPdfBytes, setPendingPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfPassword, setPdfPassword] = useState('');

  const isBusy = progress !== null;

  function applyPreview(analysis: ReturnType<typeof analyzeCsvInput>) {
    setTradeAnalysisPreview(analysis);
    setNotice(null);
  }

  async function analyzePendingPdfWithPassword() {
    const password = pdfPassword;
    if (!pendingPdfBytes) return;
    if (password.length === 0) {
      setNotice({
        tone: 'error',
        title: 'PDF 비밀번호가 필요해요',
        body: '비밀번호를 입력한 뒤 다시 눌러 주세요.',
      });
      return;
    }
    setNotice(null);
    setProgress('입력한 비밀번호로 PDF를 여는 중이에요.');
    await nextFrame();
    try {
      const text = await extractPdfText(pendingPdfBytes.slice(0), { password });
      setProgress('거래내역을 읽었어요. 분석 미리보기를 만드는 중이에요.');
      await nextFrame();
      applyPreview(analyzeUpbitPdfText(text, diagnosisAnswers));
      setPendingPdfBytes(null);
      setPdfPassword('');
    } catch (error) {
      if (isPdfNoTextLayerError(error)) {
        setNotice(showImagePdfGuide(error.pageCount));
        setPendingPdfBytes(null);
        setPdfPassword('');
        return;
      }
      setNotice({
        tone: 'error',
        title: 'PDF를 열지 못했어요',
        body: '비밀번호가 맞는지 확인해 주세요. 원본 파일과 비밀번호는 저장하지 않아요.',
      });
    } finally {
      setProgress(null);
    }
  }

  async function handlePickedAsset(asset: PickedAsset, format: UploadFormat) {
    setNotice(null);
    setPendingPdfBytes(null);
    setPdfPassword('');
    setSelectedFileLabel(`${asset.name}${formatBytes(asset.size)}`);

    if (format === 'pdf' && !isPdfAsset(asset)) {
      setNotice({
        tone: 'error',
        title: 'PDF 파일이 아니에요',
        body: '업비트 PDF 거래내역을 골라 주세요.',
      });
      return;
    }
    if (format === 'csv' && !isCsvAsset(asset)) {
      setNotice({
        tone: 'error',
        title: 'CSV 파일이 아니에요',
        body: '업비트 CSV 거래내역을 골라 주세요.',
      });
      return;
    }

    setProgress(`${asset.name} 파일을 읽는 중이에요.`);
    await nextFrame();
    try {
      const bytes = await readPickedAsset(asset);
      if (isPdfAsset(asset)) {
        setProgress('PDF에서 거래 내역을 찾는 중이에요. 몇 초 걸릴 수 있어요.');
        await nextFrame();
        let text: string;
        try {
          text = await extractPdfText(bytes);
        } catch (error) {
          if (isPdfPasswordRequiredError(error)) {
            setPendingPdfBytes(bytes.slice(0));
            setNotice({
              tone: 'info',
              title: '비밀번호가 걸린 PDF예요',
              body: '아래 비밀번호 입력칸에 이 PDF를 여는 암호를 넣어 주세요. 입력한 값은 이 기기에서만 쓰고 저장하지 않아요.',
            });
            return;
          }
          if (isPdfNoTextLayerError(error)) {
            setNotice(showImagePdfGuide(error.pageCount));
            return;
          }
          throw error;
        }
        setProgress('거래내역을 읽었어요. 분석 미리보기를 만드는 중이에요.');
        await nextFrame();
        applyPreview(analyzeUpbitPdfText(text, diagnosisAnswers));
        return;
      }
      applyPreview(analyzeCsvInput(bytes, diagnosisAnswers));
    } catch (error) {
      setNotice({
        tone: 'error',
        title: '거래내역을 읽지 못했어요',
        body: `파일을 다시 골라 주세요. 원본과 PDF 비밀번호는 저장하지 않아요.\n사유: ${describeFailure(error)}`,
      });
    } finally {
      setProgress(null);
    }
  }

  function handleRetryUpload() {
    clearTradeAnalysis();
    setSelectedFileLabel(null);
    setNotice(null);
    setPendingPdfBytes(null);
    setPdfPassword('');
  }

  function handleContinueTradeAnalysis() {
    if (!tradeAnalysis?.parse.executions.length) {
      const reason = tradeAnalysis?.preview.errors[0]?.reason;
      setNotice({
        tone: 'error',
        title: '점수를 만들 수 없어요',
        body: reason
          ? `읽을 수 있는 거래가 없었어요.\n${reason}`
          : '읽을 수 있는 거래가 없었어요. 파일을 다시 확인한 뒤 올려 주세요.',
        offerSample: true,
      });
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
          <FilePickerButton
            format="pdf"
            label="PDF 거래내역 올리기"
            disabled={isBusy}
            onPicked={handlePickedAsset}
            onFailed={setNotice}
          />
          <FilePickerButton
            format="csv"
            label="CSV 거래내역 올리기"
            disabled={isBusy}
            onPicked={handlePickedAsset}
            onFailed={setNotice}
          />
        </View>

        {selectedFileLabel && (
          <View className="rounded-2xl border border-border bg-background p-3">
            <Text className="text-[11px] font-bold text-muted-foreground">선택한 파일</Text>
            <Text className="text-xs leading-5 text-foreground">{selectedFileLabel}</Text>
          </View>
        )}

        {progress && (
          <View className="flex-row items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <ActivityIndicator size="small" />
            <Text className="flex-1 text-xs font-bold leading-5 text-foreground">{progress}</Text>
          </View>
        )}

        {notice && (
          <View
            className={
              notice.tone === 'error'
                ? 'gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3'
                : 'gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3'
            }
          >
            <Text
              className={
                notice.tone === 'error'
                  ? 'text-xs font-extrabold text-destructive'
                  : 'text-xs font-extrabold text-foreground'
              }
            >
              {notice.title}
            </Text>
            <Text className="text-xs leading-5 text-muted-foreground">{notice.body}</Text>
            {notice.offerSample && (
              <Button size="sm" variant="outline" onPress={runSample}>
                <Text>예시 데이터로 먼저 둘러보기</Text>
              </Button>
            )}
          </View>
        )}

        {pendingPdfBytes && (
          <View className="gap-3 rounded-2xl border border-border bg-background p-3">
            <Text className="text-sm font-extrabold text-foreground">
              PDF 비밀번호를 입력해 주세요
            </Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              업비트 고객센터 PDF를 여는 암호예요. 이 기기에서 분석할 때만 쓰고 저장하지 않아요.
            </Text>
            <Input
              value={pdfPassword}
              onChangeText={setPdfPassword}
              placeholder="PDF 비밀번호"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              onSubmitEditing={analyzePendingPdfWithPassword}
            />
            <View className="flex-row gap-2">
              <Button className="flex-1" onPress={analyzePendingPdfWithPassword} disabled={isBusy}>
                <Text>{isBusy ? '여는 중...' : '비밀번호 입력 후 분석'}</Text>
              </Button>
              <Button className="flex-1" variant="outline" onPress={handleRetryUpload}>
                <Text>취소</Text>
              </Button>
            </View>
          </View>
        )}

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
          <Button size="sm" variant="ghost" onPress={() => setNotice(showPasswordTrustGuide())}>
            <Text className="text-xs text-primary">비밀번호가 어떻게 쓰이는지 보기</Text>
          </Button>
        </View>
        <Text className="text-xs leading-5 text-muted-foreground">
          파일은 이 기기 안에서만 읽어요. 원본과 PDF 비밀번호는 저장하지 않습니다.
        </Text>
      </View>

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
              <Button className="flex-1" variant="outline" onPress={handleRetryUpload}>
                <Text>다시 올리기</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}
