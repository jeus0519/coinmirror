import { ScrollView, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { type FlowStep, useFlowStore } from '@/stores/use-flow-store';

const STEPS: { step: FlowStep; label: string }[] = [
  { step: 1, label: '소개' },
  { step: 2, label: '성향 진단' },
  { step: 3, label: '거래내역' },
  { step: 4, label: '스코어·분석' },
  { step: 5, label: '목표·진행' },
  { step: 6, label: '정보·이벤트' },
];

export function StepNav() {
  const currentStep = useFlowStore((s) => s.currentStep);
  const hasAnalyzed = useFlowStore((s) => s.hasAnalyzed);
  const hasDiagnosis = useFlowStore((s) => s.hasDiagnosis);
  const setStep = useFlowStore((s) => s.setStep);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-border bg-card/80"
      contentContainerClassName="flex-row items-center gap-1.5 px-4 py-2.5"
    >
      {STEPS.map(({ step, label }) => {
        const disabled = (step === 3 && !hasDiagnosis) || (step >= 4 && !hasAnalyzed);
        const active = step === currentStep;
        return (
          <Pressable
            key={step}
            disabled={disabled}
            onPress={() => setStep(step)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
              active ? 'bg-primary/10' : 'bg-transparent',
              disabled && 'opacity-40'
            )}
          >
            <View
              className={cn(
                'h-5 w-5 items-center justify-center rounded-full',
                active ? 'bg-primary' : 'bg-muted'
              )}
            >
              <Text
                className={cn(
                  'text-[11px] font-extrabold',
                  active ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                {step}
              </Text>
            </View>
            <Text
              className={cn(
                'text-[13px] font-semibold',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
