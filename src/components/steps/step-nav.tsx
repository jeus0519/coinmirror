import { useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { calculateStepNavScrollOffset } from '@/lib/step-nav-layout';
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
  const setStep = useFlowStore((s) => s.setStep);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [itemLayouts, setItemLayouts] = useState<
    Partial<Record<FlowStep, { x: number; width: number }>>
  >({});

  useEffect(() => {
    const activeLayout = itemLayouts[currentStep];
    if (!activeLayout || viewportWidth <= 0 || contentWidth <= 0) return;

    const targetX = calculateStepNavScrollOffset({
      viewportWidth,
      contentWidth,
      currentScrollX: scrollXRef.current,
      itemX: activeLayout.x,
      itemWidth: activeLayout.width,
    });
    if (Math.abs(targetX - scrollXRef.current) < 1) return;

    scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
  }, [contentWidth, currentStep, itemLayouts, viewportWidth]);

  function handleItemLayout(step: FlowStep, event: LayoutChangeEvent) {
    const { width, x } = event.nativeEvent.layout;
    setItemLayouts((current) => {
      const previous = current[step];
      if (previous?.x === x && previous.width === width) return current;
      return { ...current, [step]: { x, width } };
    });
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={(width) => setContentWidth(width)}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      className="bg-background"
      contentContainerClassName="mx-auto max-w-5xl flex-row items-center gap-1.5 px-4 pb-3 pt-1"
    >
      {STEPS.map(({ step, label }) => {
        // 거래내역(3)은 진단 없이도 들어갈 수 있다 — 시작 화면의 "자료부터 올리기"와 같은 규칙.
        const disabled = step >= 4 && !hasAnalyzed;
        const active = step === currentStep;
        return (
          <Pressable
            key={step}
            disabled={disabled}
            onLayout={(event) => handleItemLayout(step, event)}
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
