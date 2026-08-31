import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const PLAN_ITEMS = [
  '이번 분석을 기준선으로 저장',
  '다음 업로드 때 변화량 자동 비교',
  '월간 투자습관 리포트 PDF',
  '목표 저장과 달성 여부 체크',
] as const;

export default function SubscriptionCheckoutPage() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4 pb-12">
      <View className="gap-3">
        <Button size="sm" variant="ghost" className="self-start px-0" onPress={() => router.back()}>
          <Icon as={ArrowLeft} size={16} className="text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">구독 혜택으로 돌아가기</Text>
        </Button>
        <View className="gap-2">
          <Text className="text-[11px] font-extrabold text-primary">구독 결제 준비</Text>
          <Text className="text-2xl font-extrabold leading-8 text-foreground">
            플랜을 확인하고,{`\n`}결제 단계로 이어가요
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            지금은 실제 결제 전환 전 단계예요. 가격·혜택·안전 안내를 확인한 뒤 결제 모듈을
            연결하면 바로 결제창으로 이어질 수 있게 구성합니다.
          </Text>
        </View>
      </View>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="gap-4 pt-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-[11px] font-extrabold text-primary">추천 플랜</Text>
              <Text className="text-xl font-extrabold text-foreground">구독관리 월간 플랜</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                한 달 단위로 내 거래 습관 변화를 회고하는 개인 관리 플랜
              </Text>
            </View>
            <View className="rounded-2xl bg-background px-3 py-2">
              <Text className="text-lg font-extrabold text-foreground">월 4,900원</Text>
            </View>
          </View>

          <View className="gap-2 rounded-2xl bg-background/90 p-3">
            {PLAN_ITEMS.map((item) => (
              <View key={item} className="flex-row items-start gap-2">
                <Icon as={CheckCircle2} size={14} className="mt-0.5 text-primary" />
                <Text className="flex-1 text-xs leading-5 text-foreground">{item}</Text>
              </View>
            ))}
          </View>

          <Button disabled>
            <Icon as={CreditCard} size={16} className="text-primary-foreground" />
            <Text>결제 모듈 연결 예정</Text>
          </Button>
          <Text className="text-[11px] leading-5 text-muted-foreground">
            실제 결제는 토스페이먼츠, PortOne, Stripe 같은 결제 모듈 중 하나를 선택한 뒤
            연결합니다. 지금 버튼은 결제가 발생하지 않는 준비 상태입니다.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3 pt-2">
          <View className="flex-row items-start gap-3">
            <View className="rounded-2xl bg-muted p-2.5">
              <Icon as={ShieldCheck} size={18} className="text-primary" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-base font-extrabold text-foreground">결제 전 확인 사항</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                PDF 비밀번호와 원본 거래내역은 저장하지 않는 방향을 유지하고, 구독에는 분석 결과
                요약·목표·월간 변화만 저장하는 구조가 안전해요.
              </Text>
            </View>
          </View>
          <Button variant="outline" onPress={() => router.back()}>
            <Text>혜택 다시 보기</Text>
          </Button>
        </CardContent>
      </Card>

      <Text className="text-[11px] leading-5 text-muted-foreground">
        결제 모듈 연결 전까지는 실제 과금이 발생하지 않습니다. 본 기능은 투자 조언이 아니라 과거
        거래 기록을 회고하고 목표를 관리하는 구독 기능입니다.
      </Text>
    </ScrollView>
  );
}
