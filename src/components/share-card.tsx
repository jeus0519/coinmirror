import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { type ShareCardViewModel } from '@/lib/share-card';

export function ShareCard({ card }: { card: ShareCardViewModel }) {
  return (
    <View className="w-full max-w-[360px] self-center overflow-hidden rounded-[28px] border border-primary/25 bg-card shadow-sm">
      <View className="gap-4 bg-primary/10 px-5 py-5">
        <Text className="text-[11px] font-extrabold uppercase tracking-[2px] text-primary">
          {card.label}
        </Text>
        <View className="gap-2">
          <Text className="text-[28px] font-black leading-9 text-foreground">{card.title}</Text>
          <Text className="text-base font-extrabold tracking-wide text-primary">{card.code}</Text>
        </View>
      </View>
      <View className="gap-4 px-5 py-5">
        <Text className="text-sm font-bold leading-6 text-foreground">{card.axisLine}</Text>
        <Text className="text-[13px] leading-5 text-muted-foreground">{card.description}</Text>
        <View className="gap-1 border-t border-border pt-3">
          <Text className="text-[11px] leading-4 text-muted-foreground">{card.compliance}</Text>
          <Text className="text-[11px] font-extrabold text-primary">{card.watermark}</Text>
        </View>
      </View>
    </View>
  );
}
