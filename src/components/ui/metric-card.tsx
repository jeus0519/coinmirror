import { View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { KIND_LABEL, type Metric, scoreLevel } from '@/lib/mock-metrics';

const KIND_STYLE: Record<Metric['kind'], string> = {
  habit: 'bg-primary/15',
  composite: 'bg-secondary/15',
};
const KIND_TEXT_STYLE: Record<Metric['kind'], string> = {
  habit: 'text-primary',
  composite: 'text-secondary',
};

const LEVEL_BAR_STYLE: Record<ReturnType<typeof scoreLevel>, string> = {
  stable: 'bg-primary',
  observe: 'bg-warning',
  caution: 'bg-destructive',
  measuring: 'bg-muted',
};

export function MetricCard({ metric }: { metric: Metric }) {
  const level = scoreLevel(metric.score);

  return (
    <Card className={cn(!metric.measured && 'opacity-70')}>
      <CardContent className="gap-3 pt-2">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-[15px] font-bold text-foreground">
              {metric.id}. {metric.name}
            </Text>
            <View className={cn('self-start rounded-full px-2 py-0.5', KIND_STYLE[metric.kind])}>
              <Text className={cn('text-[10.5px] font-extrabold', KIND_TEXT_STYLE[metric.kind])}>
                {KIND_LABEL[metric.kind]} · 표본 {metric.sampleSize}건
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[26px] font-extrabold leading-none text-foreground">
              {metric.score === null ? '–' : metric.score}
              {metric.score !== null && (
                <Text className="text-xs font-semibold text-muted-foreground"> /100</Text>
              )}
            </Text>
            <Text className="text-[11px] font-bold text-muted-foreground">{metric.band}</Text>
          </View>
        </View>

        <Progress
          value={metric.score ?? 0}
          className="bg-muted"
          indicatorClassName={LEVEL_BAR_STYLE[level]}
        />

        <Text className="text-[13.5px] text-foreground">{metric.headline}</Text>

        {Object.keys(metric.stats).length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {Object.entries(metric.stats).map(([k, v]) => (
              <View key={k} className="rounded-lg border border-border bg-muted/50 px-2.5 py-1">
                <Text className="text-[11.5px] text-muted-foreground">
                  {k} <Text className="font-bold text-foreground">{v}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {metric.evidence.length > 0 && (
          <View className="gap-1.5 border-t border-dashed border-border pt-2.5">
            {metric.evidence.map((e, i) => (
              <View key={i} className="flex-row items-baseline gap-2">
                <Text className="text-[11px] tabular-nums text-muted-foreground">{e.when}</Text>
                <Text className="min-w-10 text-xs font-extrabold text-primary">{e.symbol}</Text>
                <Text className="flex-1 text-xs text-foreground">{e.fact}</Text>
              </View>
            ))}
          </View>
        )}

        {metric.question && (
          <View className="rounded-lg bg-secondary/10 px-3 py-2">
            <Text className="text-[13px] text-secondary">회고 질문 · {metric.question}</Text>
          </View>
        )}

        {metric.limitation && (
          <View className="rounded-lg bg-warning/10 px-3 py-2">
            <Text className="text-[11.5px] text-warning">계산 한계 · {metric.limitation}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
