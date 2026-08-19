import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { principlePresets, weeklyTrend } from '@/lib/mock-goals';
import { cn } from '@/lib/utils';

export function Step3Goals() {
  const [selectedPrincipleId, setSelectedPrincipleId] = useState(principlePresets[0].id);
  const selected = principlePresets.find((item) => item.id === selectedPrincipleId)!;
  const maxTradeCount = Math.max(...weeklyTrend.map((item) => item.tradeCount), 1);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">P7 · 원칙 지키기</Text>
        <Text className="text-xs leading-5 text-muted-foreground">
          숫자를 매번 입력하는 대신 앞으로 관찰할 원칙 하나를 고르세요. 다음 거래내역 분석에서
          동일한 기준으로 자동 확인합니다.
        </Text>
      </View>

      <View className="gap-2.5">
        {principlePresets.map((principle) => {
          const active = principle.id === selectedPrincipleId;
          return (
            <Pressable key={principle.id} onPress={() => setSelectedPrincipleId(principle.id)}>
              <View
                className={cn(
                  'gap-2 rounded-2xl border p-4',
                  active ? 'border-primary bg-primary/5' : 'border-border bg-card'
                )}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-sm font-extrabold text-foreground">
                    {principle.label}
                  </Text>
                  <View
                    className={cn(
                      'h-5 w-5 rounded-full border',
                      active && 'border-4 border-primary'
                    )}
                  />
                </View>
                <Text className="text-xs leading-5 text-muted-foreground">
                  {principle.description}
                </Text>
                <Text className="text-[11px] font-semibold text-primary">
                  확인: {principle.check}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={() => Alert.alert('원칙 선택됨(목업)', selected.label)}>
        <Text>이 원칙으로 4주 관찰하기</Text>
      </Button>

      <Card>
        <CardContent className="gap-3 pt-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-sm font-bold text-foreground">현재 기록과 미리 비교</Text>
            <Badge variant="outline">
              <Text>
                {selected.achieved === null
                  ? '기준 필요'
                  : selected.achieved
                    ? '현재 충족'
                    : '관찰 필요'}
              </Text>
            </Badge>
          </View>
          <Text className="text-xs text-muted-foreground">{selected.current}</Text>
          <Text className="text-[11px] leading-5 text-muted-foreground">
            이것은 매매 권고가 아니라 다음 분석에서 동일한 행동을 관찰하기 위한 개인 기준입니다.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3 pt-2">
          <Text className="text-sm font-bold text-foreground">최근 4주 변화 미리보기</Text>
          <Text className="text-[11px] text-muted-foreground">
            막대는 거래 횟수, 숫자는 F10 투자 체력 종합점수예요. 구독관리에서는 최대 12주를
            추적합니다.
          </Text>
          <View className="h-32 flex-row items-end gap-3">
            {weeklyTrend.map((item) => (
              <View key={item.week} className="flex-1 items-center gap-1">
                <Text className="text-[11px] font-bold text-primary">{item.compositeScore}</Text>
                <View className="h-20 w-full justify-end">
                  <View
                    className="w-full rounded-t bg-primary/25"
                    style={{ height: `${(item.tradeCount / maxTradeCount) * 100}%` }}
                  />
                </View>
                <Text className="text-[10px] text-muted-foreground">{item.week}</Text>
              </View>
            ))}
          </View>
          <Progress value={weeklyTrend.at(-1)?.compositeScore ?? 0} />
        </CardContent>
      </Card>
    </ScrollView>
  );
}
