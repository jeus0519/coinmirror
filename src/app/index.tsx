import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Step1Start } from '@/components/steps/step-1-start';
import { Step2Diagnosis } from '@/components/steps/step-2-diagnosis';
import { Step2Analysis } from '@/components/steps/step-2-analysis';
import { Step3DataImport } from '@/components/steps/step-3-data-import';
import { Step3Goals } from '@/components/steps/step-3-goals';
import { Step4Info } from '@/components/steps/step-4-info';
import { StepNav } from '@/components/steps/step-nav';
import { Text } from '@/components/ui/text';
import { trackCoinmirrorEvent } from '@/lib/analytics';
import { useFlowStore } from '@/stores/use-flow-store';

const coinmirrorLogo = require('../../assets/brand/coinmirror-logo-rounded-square-padded.png');

export default function AppScreen() {
  const currentStep = useFlowStore((s) => s.currentStep);
  const setStep = useFlowStore((s) => s.setStep);
  const runDuplicateUploadDemo = useFlowStore((s) => s.runDuplicateUploadDemo);
  const restoreSubscriptionState = useFlowStore((s) => s.restoreSubscriptionState);
  const params = useLocalSearchParams<{ step?: string; demo?: string; source?: string; r?: string }>();
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    if (params.demo === 'duplicate-upload') {
      runDuplicateUploadDemo();
      router.replace('/');
      return;
    }

    restoreSubscriptionState();

    if (params.source === 'reanalysis-email') {
      trackCoinmirrorEvent('reanalysis_return', {
        screen: 'landing',
        return_source: 'email',
        has_return_token: Boolean(params.r),
      });
    }

    if (params.step === 'upload') setStep(3);
  }, [params.demo, params.r, params.source, params.step, restoreSubscriptionState, runDuplicateUploadDemo, setStep]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ flex: 1 }}>
      <View className="shrink-0 border-b border-border bg-background">
        <View className="mx-auto w-full max-w-5xl flex-row items-center gap-2.5 px-4 pb-2 pt-1">
          <Image
            source={coinmirrorLogo}
            accessibilityLabel="코인미러 로고"
            style={{ width: 36, height: 36, borderRadius: 16 }}
            resizeMode="contain"
          />
          <View>
            <Text className="text-base font-extrabold text-foreground">코인미러</Text>
            <Text className="text-[11px] text-muted-foreground">내 거래 습관을 비춰봐요</Text>
          </View>
        </View>
        <StepNav />
      </View>

      <View className="flex-1 overflow-hidden">
        {currentStep === 1 && <Step1Start />}
        {currentStep === 2 && <Step2Diagnosis />}
        {currentStep === 3 && <Step3DataImport />}
        {currentStep === 4 && <Step2Analysis />}
        {currentStep === 5 && <Step3Goals />}
        {currentStep === 6 && <Step4Info />}
      </View>
    </SafeAreaView>
  );
}
