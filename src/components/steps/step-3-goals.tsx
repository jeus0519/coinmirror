import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { goalProgress, goalTemplates, weeklyTrend } from '@/lib/mock-goals';

const WORKSHEET_STORAGE_KEY = 'coinmirror.worksheet';

const WORKSHEET_QUESTIONS: { key: WorksheetKey; label: string; placeholder: string }[] = [
  {
    key: 'fact',
    label: '1. 이번 분석에서 가장 눈에 띈 사실은?',
    placeholder: '예: 손실 포지션 평균 보유시간이 이익 포지션의 3배였다.',
  },
  {
    key: 'rule',
    label: '2. 앞으로 4주간 지켜볼 내 기준선은?',
    placeholder: '예: 하루 체결 3건을 넘기면 그날은 앱을 닫는다.',
  },
  {
    key: 'trigger',
    label: '3. 그 기준을 깨기 쉬운 상황은 언제인가?',
    placeholder: '예: 자기 전 시세를 확인할 때.',
  },
  {
    key: 'check',
    label: '4. 4주 뒤 무엇으로 확인할 것인가?',
    placeholder: '예: 다음 CSV 분석에서 야간 거래 비중 10% 이하.',
  },
];

type WorksheetKey = 'fact' | 'rule' | 'trigger' | 'check';
type WorksheetState = Record<WorksheetKey, string>;

const EMPTY_WORKSHEET: WorksheetState = { fact: '', rule: '', trigger: '', check: '' };

function ProgressCard({ item }: { item: (typeof goalProgress)[number] }) {
  const pillLabel = item.achieved === null ? '측정 중' : item.achieved ? '기준 충족' : '기준 초과';
  const pillBgClass =
    item.achieved === null ? 'bg-muted' : item.achieved ? 'bg-primary/15' : 'bg-destructive/15';
  const pillTextClass =
    item.achieved === null
      ? 'text-muted-foreground'
      : item.achieved
        ? 'text-primary'
        : 'text-destructive';
  const barClass = item.achieved ? 'bg-primary' : 'bg-warning';

  return (
    <View className="gap-2.5 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-bold text-foreground">{item.label}</Text>
        <View className={'rounded-full px-2.5 py-1 ' + pillBgClass}>
          <Text className={'text-[11px] font-extrabold ' + pillTextClass}>{pillLabel}</Text>
        </View>
      </View>
      <Text className="text-xs text-muted-foreground">{item.note}</Text>
      <Progress value={item.progressPct} indicatorClassName={barClass} />
      <View className="flex-row justify-between">
        <Text className="text-[11.5px] text-muted-foreground">
          내 기준 {item.target}
          {item.unit}
        </Text>
        <Text className="text-[11.5px] text-muted-foreground">
          실제 {item.current === null ? '–' : `${item.current}${item.unit}`}
        </Text>
      </View>
    </View>
  );
}

export function Step3Goals() {
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(goalTemplates.map((t) => [t.id, String(t.defaultTarget)]))
  );
  const [worksheet, setWorksheet] = useState<WorksheetState>(EMPTY_WORKSHEET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WORKSHEET_STORAGE_KEY).then((raw) => {
      if (raw) setWorksheet({ ...EMPTY_WORKSHEET, ...JSON.parse(raw) });
      setLoaded(true);
    });
  }, []);

  function updateWorksheet(key: WorksheetKey, value: string) {
    const next = { ...worksheet, [key]: value };
    setWorksheet(next);
    AsyncStorage.setItem(WORKSHEET_STORAGE_KEY, JSON.stringify(next));
  }

  const maxTrend = Math.max(...weeklyTrend.map((w) => w.tradeCount), 1);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">내 원칙 세우기</Text>
          <Text className="text-xs text-muted-foreground">
            분석에서 나온 지표를 기준으로 스스로 지킬 원칙을 숫자로 정합니다.
          </Text>
        </View>
        <Card>
          <CardContent className="gap-4 pt-2">
            {goalTemplates.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between gap-3">
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-bold text-foreground">{t.label}</Text>
                  <Text className="text-xs text-muted-foreground">{t.description}</Text>
                  <Text className="text-[11px] font-semibold text-primary">근거: {t.source}</Text>
                </View>
                <View className="w-24 flex-row items-center gap-1.5">
                  <Input
                    className="flex-1 text-right"
                    keyboardType="numeric"
                    value={targets[t.id]}
                    onChangeText={(v) => setTargets((prev) => ({ ...prev, [t.id]: v }))}
                  />
                  <Text className="text-xs text-muted-foreground">{t.unit}</Text>
                </View>
              </View>
            ))}
            <View className="flex-row flex-wrap gap-2">
              <Button
                size="sm"
                onPress={() =>
                  Alert.alert('진행 현황 계산됨(목업)', '실제 계산은 다음 업데이트에서 연결돼요.')
                }
              >
                <Text>진행 현황 계산</Text>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => Alert.alert('내 원칙 저장됨(목업)')}
              >
                <Text>내 원칙 저장</Text>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() =>
                  setTargets(
                    Object.fromEntries(goalTemplates.map((t) => [t.id, String(t.defaultTarget)]))
                  )
                }
              >
                <Text className="text-muted-foreground">기본값으로</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-extrabold text-foreground">진행 현황</Text>
          <Badge variant="outline">
            <Text>
              {goalProgress.filter((g) => g.achieved).length}/{goalProgress.length} 충족
            </Text>
          </Badge>
        </View>
        <Text className="text-xs text-muted-foreground">
          내가 정한 기준선과 실제 거래 기록을 대조한 결과입니다.
        </Text>
        <View className="gap-2.5">
          {goalProgress.map((item) => (
            <ProgressCard key={item.label} item={item} />
          ))}
        </View>
      </View>

      <Card>
        <CardContent className="gap-3 pt-2">
          <Text className="text-sm font-bold text-foreground">주간 행동 추이</Text>
          <Text className="text-[11px] text-muted-foreground">
            주 단위 체결 건수와 야간 거래 비중입니다.
          </Text>
          <View className="h-28 flex-row items-end gap-3">
            {weeklyTrend.map((w) => (
              <View key={w.week} className="flex-1 items-center gap-1">
                <View
                  className="w-full flex-row items-end justify-center gap-0.5"
                  style={{ height: 80 }}
                >
                  <View
                    className="w-1/2 rounded-t bg-primary/30"
                    style={{ height: `${(w.tradeCount / maxTrend) * 100}%` }}
                  />
                  <View
                    className="w-1/2 rounded-t bg-secondary"
                    style={{ height: `${(w.nightRatio / maxTrend) * 100}%` }}
                  />
                </View>
                <Text className="text-[10px] text-muted-foreground">{w.week}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-lg font-extrabold text-foreground">
            다음 4주 원칙 설계 워크시트
          </Text>
          <Text className="text-xs text-muted-foreground">
            직접 적는 양식입니다. 입력 내용은 이 기기에만 저장되며 서버로 전송되지 않습니다.
          </Text>
        </View>
        <Card>
          <CardContent className="gap-4 pt-2">
            {WORKSHEET_QUESTIONS.map((q) => (
              <View key={q.key} className="gap-1.5">
                <Label>{q.label}</Label>
                <Textarea
                  editable={loaded}
                  value={worksheet[q.key]}
                  onChangeText={(v) => updateWorksheet(q.key, v)}
                  placeholder={q.placeholder}
                />
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
