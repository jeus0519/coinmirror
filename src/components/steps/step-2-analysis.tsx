import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { ShareCard } from '@/components/share-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { MetricCard } from '@/components/ui/metric-card';
import { Text } from '@/components/ui/text';
import { buildAnalysisViewData } from '@/lib/analysis-view-data';
import { buildExpectationComparisons } from '@/lib/onboarding-diagnosis';
import { buildInvestmentTypeShareCard } from '@/lib/share-card';
import { buildMonthlyHabitReport } from '@/lib/subscription/monthly-report';
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
  const subscriptionSnapshots = useFlowStore((s) => s.subscriptionSnapshots);
  const snapshotComparison = useFlowStore((s) => s.snapshotComparison);
  const suggestedSubscriptionGoal = useFlowStore((s) => s.suggestedSubscriptionGoal);
  const savedSubscriptionGoals = useFlowStore((s) => s.savedSubscriptionGoals);
  const saveCurrentAnalysisSnapshot = useFlowStore((s) => s.saveCurrentAnalysisSnapshot);
  const saveSuggestedSubscriptionGoal = useFlowStore((s) => s.saveSuggestedSubscriptionGoal);
  const restoreSubscriptionState = useFlowStore((s) => s.restoreSubscriptionState);
  const clearSubscriptionSnapshots = useFlowStore((s) => s.clearSubscriptionSnapshots);
  const setStep = useFlowStore((s) => s.setStep);
  const diagnosisAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const tradeAnalysis = useFlowStore((s) => s.tradeAnalysis);
  const analysis = useMemo(
    () => buildAnalysisViewData({ dataSource, tradeAnalysis, diagnosis: diagnosisAnswers }),
    [tradeAnalysis, dataSource, diagnosisAnswers]
  );
  const derivedSeries = analysis.derivedSeries;
  const expectationComparisons = useMemo(
    () => buildExpectationComparisons(diagnosisAnswers, analysis.expectationActuals),
    [analysis.expectationActuals, diagnosisAnswers]
  );
  const recordedShareCard = buildInvestmentTypeShareCard(analysis.investmentType, 'recorded');
  const monthlyHabitReport = useMemo(
    () => buildMonthlyHabitReport(subscriptionSnapshots, savedSubscriptionGoals),
    [subscriptionSnapshots, savedSubscriptionGoals]
  );
  const hasSavedGoal = savedSubscriptionGoals.length > 0;
  const snapshotStatusTitle = snapshotComparison
    ? '직전 분석과 비교 중'
    : subscriptionSnapshots.length > 0
      ? '기준선 저장됨'
      : '첫 기준선이 아직 없어요';
  const snapshotStatusDescription = snapshotComparison
    ? '직전 분석과 이번 분석의 차이를 바로 아래에서 확인할 수 있어요.'
    : subscriptionSnapshots.length > 0
      ? '다음 업로드 때 자동 비교돼요. 새 거래내역을 올린 뒤 이번 분석 다시 저장하기를 눌러 변화량을 확인하세요.'
      : '이번 분석을 저장해두면 다음 업로드 때 승률, 보유기간, 거래 빈도 변화를 비교할 수 있어요.';
  const snapshotSaveCta = subscriptionSnapshots.length > 0 ? '이번 분석 다시 저장하기' : '이번 분석 저장하기';
  const goalStatusTitle = hasSavedGoal ? '목표 저장 완료' : '목표는 비교가 생기면 저장할 수 있어요';

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-extrabold text-foreground">기록 분석</Text>
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
            {analysis.source === 'pdf' && (
              <Badge variant="outline">
                <Text>내 PDF 분석</Text>
              </Badge>
            )}
          </View>
          <Button size="sm" variant="ghost" onPress={() => setStep(3)}>
            <Text className="text-xs text-muted-foreground">다른 자료 보기</Text>
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
          나뉜 체결은 1건으로 묶었어요. 손익은 FIFO와 수수료를 반영했어요.
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {analysis.statTiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </View>
      </View>

      {analysis.subscriptionInsights.length > 0 && (
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-base font-extrabold text-foreground">
              이번 분석에서 눈에 띄는 패턴
            </Text>
            <Text className="text-xs text-muted-foreground">
              과거 거래 기록에서 확인된 사실만 보여드려요. 매수·매도 조언은 하지 않아요.
            </Text>
          </View>
          {analysis.subscriptionInsights.map((insight) => (
            <Card key={insight.kind} className="border-primary/20">
              <CardContent className="gap-3 pt-2">
                <View className="gap-1">
                  <Text className="text-sm font-extrabold text-foreground">{insight.title}</Text>
                  <Text className="text-xs leading-5 text-muted-foreground">{insight.evidence}</Text>
                </View>
                <View className="gap-1.5 rounded-2xl bg-muted p-3">
                  <Text className="text-[11px] font-extrabold text-primary">
                    구독관리에서 추적할 목표 후보
                  </Text>
                  <Text className="text-xs leading-5 text-foreground">{insight.trackingGoal}</Text>
                </View>
                <Text className="text-xs leading-5 text-muted-foreground">{insight.prompt}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {subscriptionTier === 'free' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="gap-3 pt-2">
            <View className="gap-1">
              <Text className="text-[11px] font-extrabold text-primary">구독관리 미리보기</Text>
              <Text className="text-base font-extrabold text-foreground">
                이번 분석을 기준선으로 저장할까요?
              </Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                방금 본 승률, 수익·손실 보유기간, 거래 빈도를 다음 업로드와 비교하면 반복되는
                패턴이 더 선명해져요.
              </Text>
            </View>
            <View className="gap-1.5 rounded-2xl bg-background/80 p-3">
              <Text className="text-xs text-foreground">• 다음 업로드 때 변화량 자동 비교</Text>
              <Text className="text-xs text-foreground">• 월간 투자습관 리포트</Text>
              <Text className="text-xs text-foreground">• 내 약점 기반 목표 저장과 추적</Text>
            </View>
            <Button onPress={() => router.push('/subscription')}>
              <Text>내 패턴 변화 추적하기</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="gap-3 pt-2">
          <View className="gap-1">
            <Text className="text-base font-extrabold text-foreground">구독관리 기준선</Text>
            <Text className="text-xs font-extrabold text-primary">{snapshotStatusTitle}</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              {snapshotStatusDescription} 이번 분석 저장하기를 누르면 투자거울 타입, 승률,
              보유기간 같은 분석 요약만 저장해요. 원본 PDF와 비밀번호는 저장하지 않아요.
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-muted p-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs font-bold text-foreground">
                저장된 분석 {subscriptionSnapshots.length}개
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                2개 이상 저장되면 직전 분석과 비교가 표시돼요.
              </Text>
            </View>
            <Button size="sm" onPress={() => saveCurrentAnalysisSnapshot()}>
              <Text className="text-xs">{snapshotSaveCta}</Text>
            </Button>
          </View>
          <View className="gap-2 rounded-2xl border border-border p-3">
            <Text className="text-[11px] leading-4 text-muted-foreground">
              이 기기에 저장된 분석 요약과 목표만 삭제할 수 있어요. 원본 PDF와 비밀번호는
              애초에 저장하지 않아요.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Button size="sm" variant="outline" onPress={() => restoreSubscriptionState()}>
                <Text className="text-xs">저장한 기준선 불러오기</Text>
              </Button>
              <Button size="sm" variant="ghost" onPress={() => clearSubscriptionSnapshots()}>
                <Text className="text-xs text-muted-foreground">
                  저장한 기준선과 목표 삭제하기
                </Text>
              </Button>
            </View>
          </View>
          {snapshotComparison && (
            <View className="gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <Text className="text-sm font-extrabold text-foreground">직전 분석과 비교</Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                {snapshotComparison.summary}
              </Text>
              {snapshotComparison.dedupe.duplicateExecutionCount > 0 && (
                <View className="gap-1 rounded-xl bg-background/80 p-2.5">
                  <Text className="text-[11px] font-extrabold text-primary">
                    중복 체결 자동 처리
                  </Text>
                  <Text className="text-[11px] leading-4 text-muted-foreground">
                    {snapshotComparison.dedupe.copy} 신규 체결만 비교 결과에 반영했어요. 기간 밖
                    매수분은 중복 집계하지 않고 신규 매도 원가 연결용으로만 사용해요.
                  </Text>
                </View>
              )}
              {snapshotComparison.rows.map((row) => (
                <View key={row.metricKey} className="gap-1 rounded-xl bg-background/80 p-2.5">
                  <Text className="text-xs font-bold text-foreground">{row.label}</Text>
                  <Text className="text-[11px] leading-4 text-muted-foreground">{row.copy}</Text>
                  <Text className="text-[11px] font-semibold text-primary">
                    {row.status === 'pending'
                      ? '판단 보류'
                      : row.direction === 'improved'
                        ? '개선'
                        : row.direction === 'worsened'
                          ? '악화'
                          : '유지'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {suggestedSubscriptionGoal && (
            <View className="gap-2 rounded-2xl bg-muted p-3">
              <Text className="text-[11px] font-extrabold text-primary">추천 목표 후보</Text>
              <Text className="text-sm font-extrabold text-foreground">
                {suggestedSubscriptionGoal.title}
              </Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                {suggestedSubscriptionGoal.description}
              </Text>
              <Button size="sm" variant="secondary" onPress={() => saveSuggestedSubscriptionGoal()}>
                <Text className="text-xs">이 목표 저장하기</Text>
              </Button>
            </View>
          )}
          {savedSubscriptionGoals.length > 0 && (
            <View className="gap-2">
              <View className="gap-1">
                <Text className="text-sm font-extrabold text-foreground">저장한 목표</Text>
                <Text className="text-[11px] font-semibold text-primary">{goalStatusTitle}</Text>
              </View>
              {savedSubscriptionGoals.map((goal) => (
                <View key={goal.id} className="gap-1 rounded-2xl border border-border p-3">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-xs font-bold text-foreground">{goal.title}</Text>
                    <Text className="text-[11px] font-semibold text-primary">
                      {goal.status === 'achieved'
                        ? '달성'
                        : goal.status === 'missed'
                          ? '재점검'
                          : goal.status === 'pending'
                            ? '판단 보류'
                            : '추적 중'}
                    </Text>
                  </View>
                  <Text className="text-[11px] leading-4 text-muted-foreground">
                    {goal.evaluationCopy}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="gap-3 pt-2">
          <View className="gap-1">
            <Text className="text-[11px] font-extrabold text-primary">월간 투자습관 리포트 미리보기</Text>
            <Text className="text-base font-extrabold text-foreground">{monthlyHabitReport.title}</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              {monthlyHabitReport.subtitle} {monthlyHabitReport.summaryCopy} 이번 달 저장한 분석, 중복 제외,
              원가 연결 보정, 목표 회고를 한 번에 확인해요.
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2.5">
            {monthlyHabitReport.metrics.slice(0, 4).map((metric) => (
              <View key={metric.key} className="min-w-[46%] flex-1 gap-1 rounded-2xl bg-muted p-3">
                <Text className="text-[11px] font-bold text-muted-foreground">{metric.label}</Text>
                <Text className="text-lg font-extrabold text-foreground">{metric.value}</Text>
                <Text className="text-[11px] leading-4 text-muted-foreground">{metric.helper}</Text>
              </View>
            ))}
          </View>
          {monthlyHabitReport.status === 'ready' ? (
            <View className="gap-2 rounded-2xl bg-background/80 p-3">
              <Text className="text-xs font-extrabold text-foreground">이번 달 변화</Text>
              {monthlyHabitReport.changes.map((change) => (
                <Text key={change.metricKey} className="text-[11px] leading-4 text-muted-foreground">
                  • {change.label}: {change.copy}
                </Text>
              ))}
            </View>
          ) : (
            <View className="gap-1 rounded-2xl bg-muted p-3">
              <Text className="text-xs font-extrabold text-foreground">한 번 더 저장하면 월간 변화가 생겨요</Text>
              <Text className="text-[11px] leading-4 text-muted-foreground">
                같은 달에 저장한 분석이 2개 이상이면 중복 제외, 원가 연결 보정, 목표 회고를 함께 정리해요.
              </Text>
            </View>
          )}
          <View className="gap-1 rounded-2xl bg-primary/5 p-3">
            <Text className="text-xs font-extrabold text-primary">목표 회고</Text>
            <Text className="text-[11px] leading-4 text-muted-foreground">
              저장한 목표 {monthlyHabitReport.goalSummary.total}개 · 달성{' '}
              {monthlyHabitReport.goalSummary.achieved}개 · 재점검{' '}
              {monthlyHabitReport.goalSummary.missed}개 · 판단 보류{' '}
              {monthlyHabitReport.goalSummary.pending}개
            </Text>
            {monthlyHabitReport.goalSummary.highlights.map((title) => (
              <Text key={title} className="text-[11px] leading-4 text-muted-foreground">
                • {title}
              </Text>
            ))}
          </View>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            {monthlyHabitReport.safetyCopy} 원본 PDF와 비밀번호는 저장하지 않아요.
          </Text>
          {subscriptionTier === 'free' && (
            <Button variant="outline" onPress={() => router.push('/subscription')}>
              <Text>월간 리포트 전체 보기</Text>
            </Button>
          )}
        </CardContent>
      </Card>

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
            {analysis.investmentType.disclaimer} 미래 행동을 제시하거나 성격을 단정하는 기능이
            아닙니다.
          </Text>
          <ShareCard card={recordedShareCard} />
        </CardContent>
      </Card>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">내 예상 vs 기록</Text>
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
                예상 문항은 건너뛰었어요. 거래 점수는 그대로 볼 수 있어요.
              </Text>
            </CardContent>
          </Card>
        )}
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">무료 행동 점수</Text>
          <Text className="text-xs text-muted-foreground">
            모든 점수는 0~100점이며 높을수록 절제·규율 상태가 안정적이에요. 거래 성과나 투자 실력을
            평가하는 점수는 아닙니다.
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
                    구독 체험이 켜졌어요 — 다음 분석부터 더 볼 수 있어요.
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
