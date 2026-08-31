import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Step1Start } from '@/components/steps/step-1-start';
import { Step2Diagnosis } from '@/components/steps/step-2-diagnosis';
import { Step2Analysis } from '@/components/steps/step-2-analysis';
import { Step3DataImport } from '@/components/steps/step-3-data-import';
import { Step3Goals } from '@/components/steps/step-3-goals';
import { Step4Info } from '@/components/steps/step-4-info';
import { StepNav } from '@/components/steps/step-nav';
import { Text } from '@/components/ui/text';
import { useFlowStore } from '@/stores/use-flow-store';

export default function AppScreen() {
  const currentStep = useFlowStore((s) => s.currentStep);
  const setStep = useFlowStore((s) => s.setStep);
  const params = useLocalSearchParams<{ step?: string }>();

  useEffect(() => {
    if (params.step === 'upload') setStep(3);
  }, [params.step, setStep]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-2.5 px-4 pb-2 pt-1">
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary">
          <Text className="text-lg font-extrabold text-primary-foreground">미</Text>
        </View>
        <View>
          <Text className="text-base font-extrabold text-foreground">코인미러</Text>
          <Text className="text-[11px] text-muted-foreground">내 거래 습관을 비춰봐요</Text>
        </View>
      </View>

      <StepNav />

      {currentStep === 1 && <Step1Start />}
      {currentStep === 2 && <Step2Diagnosis />}
      {currentStep === 3 && <Step3DataImport />}
      {currentStep === 4 && <Step2Analysis />}
      {currentStep === 5 && <Step3Goals />}
      {currentStep === 6 && <Step4Info />}
    </SafeAreaView>
  );
}
