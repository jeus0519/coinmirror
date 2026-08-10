import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  assetInfoList,
  exchangeEvents,
  type AssetInfo,
  type ExchangeEvent,
} from '@/lib/mock-market-info';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3.5 py-1.5',
        active ? 'border-primary bg-primary' : 'border-border bg-card'
      )}
    >
      <Text
        className={cn(
          'text-xs font-bold',
          active ? 'text-primary-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AssetCard({ asset }: { asset: AssetInfo }) {
  return (
    <View
      className={cn(
        'gap-2.5 rounded-2xl border p-4',
        asset.inMyHistory ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View>
          <Text className="text-base font-extrabold text-foreground">{asset.symbol}</Text>
          <Text className="text-xs text-muted-foreground">{asset.name}</Text>
        </View>
        <View className="rounded-lg bg-secondary/10 px-2 py-1">
          <Text className="text-[11px] font-bold text-secondary">{asset.category}</Text>
        </View>
      </View>
      <Text className="text-xs leading-5 text-muted-foreground">{asset.summary}</Text>
      <View className="flex-row flex-wrap gap-1.5">
        <View className="rounded-lg border border-border bg-muted/50 px-2 py-1">
          <Text className="text-[11px] text-muted-foreground">
            합의 <Text className="font-bold text-foreground">{asset.consensus}</Text>
          </Text>
        </View>
        <View className="rounded-lg border border-border bg-muted/50 px-2 py-1">
          <Text className="text-[11px] text-muted-foreground">
            출시 <Text className="font-bold text-foreground">{asset.launched}</Text>
          </Text>
        </View>
        <View className="rounded-lg border border-border bg-muted/50 px-2 py-1">
          <Text className="text-[11px] text-muted-foreground">
            원화마켓{' '}
            <Text className="font-bold text-foreground">{asset.krwMarkets.join(', ')}</Text>
          </Text>
        </View>
      </View>
      <View className="flex-row gap-4">
        <Pressable onPress={() => Linking.openURL(asset.official)}>
          <Text className="text-xs text-secondary">공식 사이트 ↗</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(asset.whitepaper)}>
          <Text className="text-xs text-secondary">기술 문서 ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EventCard({ event }: { event: ExchangeEvent }) {
  return (
    <View
      className={cn(
        'gap-2 rounded-2xl border p-4',
        event.matchesMyHistory ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-bold text-foreground">{event.title}</Text>
        <View className="rounded-full bg-primary/10 px-2.5 py-1">
          <Text className="text-[11px] font-extrabold text-primary">{event.exchange}</Text>
        </View>
      </View>
      <View className="gap-1">
        <View className="flex-row gap-2">
          <Text className="w-16 text-[12.5px] font-semibold text-muted-foreground">유형</Text>
          <Text className="text-[12.5px] text-foreground">{event.type}</Text>
        </View>
        <View className="flex-row gap-2">
          <Text className="w-16 text-[12.5px] font-semibold text-muted-foreground">관련 종목</Text>
          <Text className="flex-1 text-[12.5px] text-foreground">
            {event.relatedSymbols.length ? event.relatedSymbols.join(', ') : '해당 없음'}
            {event.matchesMyHistory ? ' · 내 거래 종목 포함' : ''}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Text className="w-16 text-[12.5px] font-semibold text-muted-foreground">기간</Text>
          <Text className="flex-1 text-[12.5px] text-foreground">{event.period}</Text>
        </View>
        <View className="flex-row gap-2">
          <Text className="w-16 text-[12.5px] font-semibold text-muted-foreground">참여 조건</Text>
          <Text className="flex-1 text-[12.5px] text-foreground">{event.requirement}</Text>
        </View>
        <View className="flex-row gap-2">
          <Text className="w-16 text-[12.5px] font-semibold text-muted-foreground">제공 형태</Text>
          <Text className="flex-1 text-[12.5px] text-foreground">{event.rewardForm}</Text>
        </View>
      </View>
      <View className="rounded-lg bg-warning/10 px-3 py-2">
        <Text className="text-[11.5px] text-warning">확인 사항 · {event.riskNote}</Text>
      </View>
      <Pressable onPress={() => Linking.openURL(event.noticeUrl)}>
        <Text className="text-xs text-secondary">공식 공지 게시판에서 확인 ↗</Text>
      </Pressable>
    </View>
  );
}

export function Step4Info() {
  const [assetFilter, setAssetFilter] = useState<'mine' | 'all'>('mine');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const filteredAssets = assetInfoList.filter((a) => assetFilter === 'all' || a.inMyHistory);
  const eventTypes = useMemo(() => ['all', ...new Set(exchangeEvents.map((e) => e.type))], []);
  const filteredEvents = exchangeEvents.filter(
    (e) => eventTypeFilter === 'all' || e.type === eventTypeFilter
  );
  const noticeBoards = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of exchangeEvents) seen.set(e.exchange, e.noticeUrl);
    return [...seen.entries()];
  }, []);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">종목 정보 및 거래소 이벤트</Text>
        <Text className="text-xs text-muted-foreground">
          내가 실제로 거래한 종목을 앞쪽에 배치했습니다. 추천 순위가 아닙니다.
        </Text>
        <View className="rounded-xl bg-warning/10 px-3.5 py-2.5">
          <Text className="text-[12.5px] text-warning">
            이 정보는 매수·매도 판단 근거가 아니라 참고용 사실 정보입니다.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">종목 일반 정보</Text>
          <Text className="text-xs text-muted-foreground">
            각 프로젝트가 공개한 개요입니다. 시세·전망 정보는 포함하지 않습니다.
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Chip
            label="내 거래 종목"
            active={assetFilter === 'mine'}
            onPress={() => setAssetFilter('mine')}
          />
          <Chip label="전체" active={assetFilter === 'all'} onPress={() => setAssetFilter('all')} />
        </View>
        <View className="gap-2.5">
          {filteredAssets.map((a) => (
            <AssetCard key={a.symbol} asset={a} />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-extrabold text-foreground">
            거래소 참여형 이벤트 정보
          </Text>
          <Text className="text-xs text-muted-foreground">
            스테이킹 · 에어드랍 · 점검 공지 등 참여 여부를 스스로 판단할 수 있게 유형별로 정리한
            목록입니다.
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {eventTypes.map((t) => (
            <Chip
              key={t}
              label={t === 'all' ? '전체' : t}
              active={eventTypeFilter === t}
              onPress={() => setEventTypeFilter(t)}
            />
          ))}
        </View>
        <View className="gap-2.5">
          {filteredEvents.map((e) => (
            <EventCard key={e.title} event={e} />
          ))}
        </View>

        <Card>
          <CardContent className="gap-2 pt-2">
            <Text className="text-sm font-bold text-foreground">거래소 공식 공지 게시판</Text>
            <View className="flex-row flex-wrap gap-4">
              {noticeBoards.map(([exchange, url]) => (
                <Pressable key={exchange} onPress={() => Linking.openURL(url)}>
                  <Text className="text-xs text-secondary">{exchange} ↗</Text>
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
