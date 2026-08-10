import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DISCLAIMER_SHORT } from '@/constants/compliance-copy';
import { formatKrw } from '@/lib/format';

type ExchangeOption = { value: string; label: string };

const EXCHANGES: ExchangeOption[] = [
  { value: 'upbit', label: '업비트' },
  { value: 'bithumb', label: '빗썸' },
  { value: 'binance', label: '바이낸스' },
  { value: 'etc', label: '기타' },
];

const REASON_TAGS = ['차트', '뉴스', '커뮤니티', '장기보유', '그냥/느낌'];
const EMOTION_TAGS = ['확신', '불안', '조급', '무덤덤', '분노', 'FOMO'];

export default function NewEntryScreen() {
  const [exchange, setExchange] = useState<ExchangeOption>(EXCHANGES[0]!);
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<string | undefined>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [memo, setMemo] = useState('');

  const totalAmount = useMemo(() => {
    const p = Number(price);
    const q = Number(quantity);
    if (!p || !q) return null;
    return p * q;
  }, [price, quantity]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-10">
      <View className="gap-2">
        <Label>거래소</Label>
        <Select value={exchange} onValueChange={(option) => option && setExchange(option)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="거래소 선택" />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGES.map((item) => (
              <SelectItem key={item.value} value={item.value} label={item.label} />
            ))}
          </SelectContent>
        </Select>
      </View>

      <View className="gap-2">
        <Label>코인 심볼</Label>
        <Input
          value={symbol}
          onChangeText={setSymbol}
          placeholder="BTC"
          autoCapitalize="characters"
        />
      </View>

      <View className="gap-2">
        <Label>매수/매도</Label>
        <ToggleGroup type="single" value={side} onValueChange={setSide} variant="outline">
          <ToggleGroupItem value="buy" isFirst>
            <Text>매수</Text>
          </ToggleGroupItem>
          <ToggleGroupItem value="sell" isLast>
            <Text>매도</Text>
          </ToggleGroupItem>
        </ToggleGroup>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Label>체결 가격</Label>
          <Input value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
        </View>
        <View className="flex-1 gap-2">
          <Label>체결 수량</Label>
          <Input
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      {totalAmount !== null && (
        <Text className="text-sm text-muted-foreground">총 금액 · {formatKrw(totalAmount)}원</Text>
      )}

      <View className="gap-2">
        <Label>매매 근거</Label>
        <ToggleGroup
          type="multiple"
          value={reasonTags}
          onValueChange={setReasonTags}
          variant="outline"
          className="flex-wrap"
        >
          {REASON_TAGS.map((tag, i) => (
            <ToggleGroupItem
              key={tag}
              value={tag}
              isFirst={i === 0}
              isLast={i === REASON_TAGS.length - 1}
            >
              <Text>{tag}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>

      <View className="gap-2">
        <Label>감정</Label>
        <ToggleGroup
          type="multiple"
          value={emotionTags}
          onValueChange={setEmotionTags}
          variant="outline"
          className="flex-wrap"
        >
          {EMOTION_TAGS.map((tag, i) => (
            <ToggleGroupItem
              key={tag}
              value={tag}
              isFirst={i === 0}
              isLast={i === EMOTION_TAGS.length - 1}
            >
              <Text>{tag}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Label>목표가 (선택)</Label>
          <Input
            value={targetPrice}
            onChangeText={setTargetPrice}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1 gap-2">
          <Label>손절가 (선택)</Label>
          <Input
            value={stopLossPrice}
            onChangeText={setStopLossPrice}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View className="gap-2">
        <Label>메모 (선택)</Label>
        <Textarea value={memo} onChangeText={setMemo} placeholder="이 매매를 왜 했는지 짧게" />
      </View>

      <Text className="text-xs text-muted-foreground">{DISCLAIMER_SHORT}</Text>

      <Button onPress={() => router.back()}>
        <Text>기록 저장</Text>
      </Button>
    </ScrollView>
  );
}
