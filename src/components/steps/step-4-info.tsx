import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { loadInfoEventTabViewModel } from '@/lib/info-event-client';
import { buildInfoEventTabViewModel, type ExchangeEventItem } from '@/lib/info-event-tab';
import { cn } from '@/lib/utils';

function MetricTile({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'up' | 'down';
}) {
  return (
    <View className="min-w-[46%] flex-1 gap-1 rounded-2xl border border-border bg-card p-4">
      <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
      <Text
        className={cn(
          'text-2xl font-extrabold tracking-tight',
          tone === 'up' ? 'text-primary' : tone === 'down' ? 'text-destructive' : 'text-foreground'
        )}
      >
        {value}
      </Text>
      <Text className="text-[11.5px] leading-4 text-muted-foreground">{description}</Text>
    </View>
  );
}

function ExchangeEventCard({ event }: { event: ExchangeEventItem }) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-bold leading-5 text-foreground">{event.title}</Text>
        <View className="rounded-full bg-primary/10 px-2.5 py-1">
          <Text className="text-[11px] font-extrabold text-primary">{event.exchange}</Text>
        </View>
      </View>
      {event.publishedAt && <Text className="text-[11.5px] text-muted-foreground">{event.publishedAt}</Text>}
      <Text className="text-[12.5px] leading-5 text-muted-foreground">{event.summary}</Text>
      <Pressable onPress={() => Linking.openURL(event.url)}>
        <Text className="text-xs font-semibold text-secondary">거래소에서 직접 확인 ↗</Text>
      </Pressable>
    </View>
  );
}

export function Step4Info() {
  const [viewModel, setViewModel] = useState(buildInfoEventTabViewModel);

  useEffect(() => {
    let active = true;
    void loadInfoEventTabViewModel().then((nextViewModel) => {
      if (active) setViewModel(nextViewModel);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">{viewModel.title}</Text>
        <Text className="text-xs leading-5 text-muted-foreground">{viewModel.description}</Text>
        <View className="rounded-xl bg-warning/10 px-3.5 py-2.5">
          <Text className="text-[12.5px] leading-5 text-warning">{viewModel.safetyCopy}</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">{viewModel.marketTemperature.title}</Text>
          <Text className="text-xs leading-5 text-muted-foreground">{viewModel.marketTemperature.description}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2.5">
          {viewModel.marketTemperature.metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </View>
        <View className="rounded-2xl bg-primary/10 px-4 py-3">
          <Text className="text-[12.5px] leading-5 text-primary">{viewModel.marketTemperature.reading}</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">{viewModel.upbitKrwInterest.title}</Text>
          <Text className="text-xs leading-5 text-muted-foreground">{viewModel.upbitKrwInterest.description}</Text>
        </View>
        <View className="gap-2.5">
          {viewModel.upbitKrwInterest.assets.map((asset) => (
            <View key={asset.symbol} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <View className="rounded-xl bg-primary/10 px-2.5 py-2">
                <Text className="text-[11px] font-extrabold text-primary">{asset.rankLabel}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-foreground">{asset.symbol}</Text>
                <Text className="text-[11.5px] leading-4 text-muted-foreground">{asset.note}</Text>
                <Text className="text-[11.5px] font-semibold text-foreground">{asset.volumeShareLabel}</Text>
              </View>
              <View className="rounded-full bg-muted px-2.5 py-1">
                <Text className="text-[11px] font-bold text-muted-foreground">{asset.badge}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className="rounded-2xl bg-card px-4 py-3">
          <Text className="text-[12.5px] leading-5 text-muted-foreground">{viewModel.upbitKrwInterest.note}</Text>
        </View>
      </View>


      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">{viewModel.exchangeEvents.title}</Text>
          <Text className="text-xs leading-5 text-muted-foreground">{viewModel.exchangeEvents.description}</Text>
          <Text className="text-[11.5px] text-muted-foreground">{viewModel.exchangeEvents.updatedAtLabel}</Text>
        </View>

        <Card>
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-extrabold text-foreground">업비트 이벤트 최신 3개</Text>
            {viewModel.exchangeEvents.upbit.map((event) => (
              <ExchangeEventCard key={event.title} event={event} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="gap-3 pt-2">
            <Text className="text-sm font-extrabold text-foreground">빗썸 이벤트 최신 3개</Text>
            {viewModel.exchangeEvents.bithumb.map((event) => (
              <ExchangeEventCard key={event.title} event={event} />
            ))}
          </CardContent>
        </Card>

        <View className="rounded-xl bg-warning/10 px-3.5 py-2.5">
          <Text className="text-[12.5px] leading-5 text-warning">{viewModel.exchangeEvents.safetyCopy}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {viewModel.systemNotes.map((note) => (
          <View key={note} className="rounded-full border border-border bg-card px-3 py-1.5">
            <Text className="text-[11px] font-semibold text-muted-foreground">{note}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
