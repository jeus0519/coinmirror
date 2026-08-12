import { Lock } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { MetricCard } from '@/components/ui/metric-card';
import { Text } from '@/components/ui/text';
import { formatKrw } from '@/lib/format';
import { mockRecords } from '@/lib/mock-data';
import { baseMetrics, KIND_LABEL, lockedMetrics } from '@/lib/mock-metrics';
import { useFlowStore } from '@/stores/use-flow-store';

const HOUR_BUCKETS = [2, 1, 0, 0, 1, 0, 3, 5, 6, 8, 7, 9, 10, 11, 9, 8, 7, 6, 8, 9, 7, 5, 4, 3];
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKDAY_COUNTS = [12, 8, 15, 10, 18, 9, 6];

const realizedTrades = [
  { symbol: 'XRP', when: '08-09', pnlPct: -2.4 },
  { symbol: 'SOL', when: '08-06', pnlPct: 6.1 },
  { symbol: 'ETH', when: '08-02', pnlPct: 3.8 },
  { symbol: 'DOGE', when: '07-30', pnlPct: -5.6 },
];

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

  const symbolTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of mockRecords) {
      totals.set(r.symbol, (totals.get(r.symbol) ?? 0) + r.price * r.quantity);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const maxHour = Math.max(...HOUR_BUCKETS, 1);
  const maxWeekday = Math.max(...WEEKDAY_COUNTS, 1);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-extrabold text-foreground">스코어 및 분석</Text>
            {dataSource === 'sample' && (
              <Badge variant="outline">
                <Text>샘플 데이터</Text>
              </Badge>
            )}
          </View>
          <Button size="sm" variant="ghost" onPress={() => setStep(3)}>
            <Text className="text-xs text-muted-foreground">다른 데이터로 다시 분석</Text>
          </Button>
        </View>
        <Card>
          <CardContent className="pt-2">
            <Text className="leading-6 text-foreground">
              최근 30일 거래 27건을 분석했어요. 과매매(M1)와 손실 후 재진입(M5) 지표가 주의
              구간이고, 야간 거래(M6)는 아직 표본이 부족해 측정 중이에요.
            </Text>
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
          <StatTile label="총 거래 건수" value="27건" sub="최근 30일" />
          <StatTile label="총 거래대금" value={`${formatKrw(132_450_000)}원`} />
          <StatTile label="실현손익" value={`+${formatKrw(842_000)}원`} tone="pos" />
          <StatTile label="미청산 보유" value="3종목" />
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">행동 지표 6종</Text>
          <Text className="text-xs text-muted-foreground">
            위험도형은 높을수록 해당 행동의 빈도가 높다는 뜻이며, 좋고 나쁨의 평가가 아닙니다.
          </Text>
        </View>
        <View className="gap-3">
          {baseMetrics.map((m) => (
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
          {lockedMetrics.map((m) => {
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
                <Text className="text-[11px] font-bold text-muted-foreground">
                  {KIND_LABEL[m.kind]}
                </Text>
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
            <Text className="text-sm font-bold text-foreground">시간대별 체결 분포</Text>
            <Text className="text-[11px] text-muted-foreground">파란색은 00~06시 구간</Text>
            <View className="h-24 flex-row items-end gap-0.5">
              {HOUR_BUCKETS.map((v, i) => (
                <View
                  key={i}
                  className={'flex-1 rounded-t ' + (i < 6 ? 'bg-secondary' : 'bg-primary/30')}
                  style={{ height: `${Math.max((v / maxHour) * 100, 3)}%` }}
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
              {WEEKDAY_COUNTS.map((v, i) => (
                <View key={i} className="flex-1 items-center gap-1">
                  <View
                    className="w-full rounded-t bg-primary/30"
                    style={{ height: `${Math.max((v / maxWeekday) * 100, 3)}%` }}
                  />
                  <Text className="text-[9.5px] text-muted-foreground">{WEEKDAY_LABELS[i]}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      <Card>
        <CardContent className="gap-2.5 pt-2">
          <Text className="text-sm font-bold text-foreground">종목별 거래대금 상위</Text>
          {symbolTotals.map(([symbol, total]) => (
            <View
              key={symbol}
              className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0"
            >
              <Text className="font-semibold text-foreground">{symbol}</Text>
              <Text className="tabular-nums text-foreground">{formatKrw(total)}원</Text>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-2.5 pt-2">
          <Text className="text-sm font-bold text-foreground">최근 청산 기록</Text>
          {realizedTrades.map((t, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0"
            >
              <Text className="text-muted-foreground">{t.when}</Text>
              <Text className="font-semibold text-foreground">{t.symbol}</Text>
              <Text
                className={t.pnlPct >= 0 ? 'font-bold text-primary' : 'font-bold text-destructive'}
              >
                {t.pnlPct >= 0 ? '+' : ''}
                {t.pnlPct}%
              </Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
