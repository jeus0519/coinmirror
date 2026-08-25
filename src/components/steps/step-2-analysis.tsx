import { Lock } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { MetricCard } from '@/components/ui/metric-card';
import { Text } from '@/components/ui/text';
import { buildAnalysisViewData } from '@/lib/analysis-view-data';
import { buildExpectationComparisons } from '@/lib/onboarding-diagnosis';
import { buildInvestmentTypeShareCard } from '@/lib/share-card';
import { useFlowStore } from '@/stores/use-flow-store';

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'pos' | 'neg';
}) {
  return (
    <View className="min-w-[46%] flex-1 gap-1 rounded-2xl border border-border bg-card p-3.5">
      <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
      <Text
        className={
          'text-xl font-extrabold tracking-tight ' +
          (tone === 'pos'
            ? 'text-primary'
            : tone === 'neg'
              ? 'text-destructive'
              : 'text-foreground')
        }
      >
        {value}
      </Text>
      {sub && <Text className="text-[11px] text-muted-foreground">{sub}</Text>}
    </View>
  );
}

export function Step2Analysis() {
  const dataSource = useFlowStore((s) => s.dataSource);
  const subscriptionTier = useFlowStore((s) => s.subscriptionTier);
  const toggleSubscription = useFlowStore((s) => s.toggleSubscription);
  const setStep = useFlowStore((s) => s.setStep);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const csvAnalysis = useFlowStore((s) => s.csvAnalysis);
  const analysis = useMemo(
    () => buildAnalysisViewData({ dataSource, csvAnalysis, diagnosis: diagnosisAnswers }),
    [csvAnalysis, dataSource, diagnosisAnswers]
  );
  const derivedSeries = analysis.derivedSeries;
  const expectationComparisons = useMemo(
    () => buildExpectationComparisons(diagnosisAnswers, analysis.expectationActuals),
    [analysis.expectationActuals, diagnosisAnswers]
  );
  const recordedShareCard = buildInvestmentTypeShareCard(analysis.investmentType, 'recorded');

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-extrabold text-foreground">스코어 및 분석</Text>
            {analysis.source === 'sample' && (
              <Badge variant="outline">
                <Text>샘플 데이터</Text>
              </Badge>
            )}
            {analysis.source === 'csv' && (
              <Badge variant="outline">
                <Text>내 CSV 분석</Text>
              </Badge>
            )}
          </View>
          <Button size="sm" variant="ghost" onPress={() => setStep(3)}>
            <Text className="text-xs text-muted-foreground">다른 데이터로 다시 분석</Text>
          </Button>
        </View>
        <Card>
          <CardContent className="pt-2">
            <Text className="leading-6 text-foreground">{analysis.summaryText}</Text>
          </CardContent>
        </Card>
      </View>

      <View className="gap-3">
        <Text className="text-base font-extrabold text-foreground">거래 개요</Text>
        <Text className="text-xs text-muted-foreground">
          분할 체결은 가중평균 1건으로 병합했고, 실현손익은 FIFO 기준으로 수수료를 반영해
          계산했습니다.
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {analysis.statTiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </View>
      </View>

      <Card>
        <CardContent className="gap-3 pt-2">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs font-bold text-primary">투자거울 타입</Text>
              <Text className="text-xl font-extrabold text-foreground">
                {analysis.investmentType.title}
              </Text>
              <Text className="text-xs text-muted-foreground">
                코드 {analysis.investmentType.code}
              </Text>
            </View>
            <View className="rounded-2xl bg-primary/10 px-3 py-2">
              <Text className="text-xs font-bold text-primary">
                MBTI{' '}
                {analysis.investmentType.generalMbti &&
                analysis.investmentType.generalMbti.length === 4
                  ? analysis.investmentType.generalMbti
                  : '선택 안 함'}
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {analysis.investmentType.axes.map((axis) => (
              <View key={axis.axis} className="rounded-full bg-muted px-3 py-1.5">
                <Text className="text-[11px] font-semibold text-foreground">
                  {axis.code} · {axis.label}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            {analysis.investmentType.comparisonCopy}
          </Text>
          <View className="gap-2 rounded-2xl bg-muted p-3">
            <Text className="text-xs font-extrabold text-foreground">장점</Text>
            {analysis.investmentType.strengths.map((item) => (
              <Text key={item} className="text-[11px] leading-4 text-muted-foreground">
                • {item}
              </Text>
            ))}
          </View>
          <View className="gap-2 rounded-2xl bg-muted p-3">
            <Text className="text-xs font-extrabold text-foreground">주의할 점</Text>
            {analysis.investmentType.watchouts.map((item) => (
              <Text key={item} className="text-[11px] leading-4 text-muted-foreground">
                • {item}
              </Text>
            ))}
          </View>
          <View className="gap-2 rounded-2xl bg-primary/5 p-3">
            <Text className="text-xs font-extrabold text-primary">개선하면 좋은 편향</Text>
            {analysis.investmentType.biasSuggestions.map((item) => (
              <Text key={item.metricId} className="text-[11px] leading-4 text-muted-foreground">
                • {item.title}: {item.suggestion}
              </Text>
            ))}
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            {analysis.investmentType.similarMbtiCopy}
          </Text>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            {analysis.investmentType.disclaimer} 매수·매도 추천이나 성격 단정이 아닙니다.
          </Text>
          <View className="gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
            <Text className="text-xs font-extrabold text-primary">
              캡처용 공유 카드 · 기록된 타입
            </Text>
            <Text className="text-lg font-extrabold text-foreground">
              {recordedShareCard.title}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {recordedShareCard.label} · {recordedShareCard.code}
            </Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              {recordedShareCard.axisLine}
            </Text>
            <Text className="text-[11px] leading-4 text-muted-foreground">
              {recordedShareCard.description} {recordedShareCard.compliance} ·{' '}
              {recordedShareCard.watermark}
            </Text>
          </View>
        </CardContent>
      </Card>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">내 예상 vs 실제 기록</Text>
          <Text className="text-xs text-muted-foreground">
            맞고 틀림을 판단하지 않고, 답한 항목의 차이만 보여드려요.
          </Text>
        </View>
        {expectationComparisons.length ? (
          <View className="gap-2.5">
            {expectationComparisons.map((item) => (
              <Card key={item.questionId}>
                <CardContent className="gap-2 pt-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-sm font-bold text-foreground">{item.label}</Text>
                    {item.source === 'sample' && (
                      <Badge variant="outline">
                        <Text>샘플</Text>
                      </Badge>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-xl bg-muted p-3">
                      <Text className="text-[11px] text-muted-foreground">내 예상</Text>
                      <Text className="text-[13px] font-bold text-foreground">{item.expected}</Text>
                    </View>
                    <View className="flex-1 rounded-xl bg-primary/10 p-3">
                      <Text className="text-[11px] text-primary">기록된 실제</Text>
                      <Text className="text-[13px] font-bold text-foreground">{item.actual}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground">{item.observation}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <CardContent className="pt-2">
              <Text className="text-xs text-muted-foreground">
                자기 예상 문항은 건너뛰었어요. 거래 기반 점수는 그대로 확인할 수 있습니다.
              </Text>
            </CardContent>
          </Card>
        )}
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">Free 행동 점수</Text>
          <Text className="text-xs text-muted-foreground">
            모든 점수는 0~100점이며 높을수록 절제·규율 상태가 안정적이에요. 수익률이나 투자 실력
            평가는 아닙니다.
          </Text>
        </View>
        <View className="gap-3">
          {analysis.metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-foreground">구독 전용 지표</Text>
          <Button size="sm" variant="outline" onPress={toggleSubscription}>
            <Text className="text-xs">
              {subscriptionTier === 'free' ? '구독 체험 켜기' : '구독 체험 끄기'}
            </Text>
          </Button>
        </View>
        <View className="gap-2.5">
          {analysis.lockedMetrics.map((m) => {
            const unlocked = subscriptionTier === 'pro';
            return (
              <View
                key={m.id}
                className={
                  'gap-1.5 rounded-2xl border p-4 ' +
                  (unlocked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')
                }
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-extrabold text-foreground">
                    {m.id} · {m.name}
                  </Text>
                  {!unlocked && <Icon as={Lock} size={14} className="text-muted-foreground" />}
                </View>
                <Text className="text-[13px] text-foreground">{m.teaser}</Text>
                {unlocked && (
                  <Text className="text-xs font-semibold text-primary">
                    구독 체험이 켜져 있어요 — 다음 CSV 분석부터 실제 값이 계산돼요.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-bold text-foreground">시간대별 거래대금</Text>
            <Text className="text-[11px] text-muted-foreground">파란색은 00~06시 구간</Text>
            <View className="h-24 flex-row items-end gap-0.5">
              {analysis.hourlyBars.map((bar) => (
                <View
                  key={bar.hour}
                  className={'flex-1 rounded-t ' + (bar.isDawn ? 'bg-secondary' : 'bg-primary/30')}
                  style={{ height: `${bar.heightPct}%` }}
                />
              ))}
            </View>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-bold text-foreground">요일별 체결 분포</Text>
            <Text className="text-[11px] text-muted-foreground">월요일부터 일요일 순</Text>
            <View className="h-24 flex-row items-end gap-1.5">
              {analysis.weekdayBars.map((bar) => (
                <View key={bar.label} className="flex-1 items-center gap-1">
                  <View
                    className="w-full rounded-t bg-primary/30"
                    style={{ height: `${bar.heightPct}%` }}
                  />
                  <Text className="text-[9.5px] text-muted-foreground">{bar.label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      <Card>
        <CardContent className="gap-2.5 pt-2">
          <Text className="text-sm font-bold text-foreground">종목별 매수 비중 상위</Text>
          <Text className="text-[11px] text-muted-foreground">
            매수금액 기준 · {derivedSeries.perSymbolBuyShare.length}개 종목
          </Text>
          {analysis.symbolRows.map((row) => (
            <View
              key={row.symbol}
              className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0"
            >
              <Text className="font-semibold text-foreground">{row.symbol}</Text>
              <Text className="tabular-nums text-foreground">{row.shareLabel}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
