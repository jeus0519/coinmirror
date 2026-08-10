import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatKrw } from '@/lib/format';
import { mockRecords } from '@/lib/mock-data';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-3">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="font-medium text-foreground">{value}</Text>
    </View>
  );
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = mockRecords.find((r) => r.id === id) ?? mockRecords[0];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <Card>
        <CardContent className="gap-1 pt-2">
          <Row label="거래소" value={record.exchange} />
          <Row label="코인" value={record.symbol} />
          <Row label="방향" value={record.side === 'buy' ? '매수' : '매도'} />
          <Row label="체결가" value={`${formatKrw(record.price)}원`} />
          <Row label="수량" value={`${record.quantity}`} />
          <Row label="총액" value={`${formatKrw(record.price * record.quantity)}원`} />
          {record.targetPrice != null && (
            <Row label="목표가" value={`${formatKrw(record.targetPrice)}원`} />
          )}
          {record.stopLossPrice != null && (
            <Row label="손절가" value={`${formatKrw(record.stopLossPrice)}원`} />
          )}
        </CardContent>
      </Card>

      {(record.reasonTags.length > 0 || record.emotionTags.length > 0) && (
        <Card>
          <CardContent className="gap-3 pt-2">
            {record.reasonTags.length > 0 && (
              <View className="gap-2">
                <Text className="text-sm text-muted-foreground">매매 근거</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {record.reasonTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Text>{tag}</Text>
                    </Badge>
                  ))}
                </View>
              </View>
            )}
            {record.emotionTags.length > 0 && (
              <View className="gap-2">
                <Text className="text-sm text-muted-foreground">감정</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {record.emotionTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Text>{tag}</Text>
                    </Badge>
                  ))}
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {record.memo && (
        <Card>
          <CardContent className="gap-2 pt-2">
            <Text className="text-sm text-muted-foreground">메모</Text>
            <Text className="text-foreground">{record.memo}</Text>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}
