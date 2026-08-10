import { create } from 'zustand';

/**
 * docs/coinmirror_demo.html의 4단계 스테퍼 상태를 대응한다.
 * hasAnalyzed가 true여야 2~4단계 진입이 가능하다(데모의 step-btn disabled 로직과 동일).
 */
export type FlowStep = 1 | 2 | 3 | 4;
export type DataSource = 'sample' | 'csv' | null;
export type SubscriptionTier = 'free' | 'pro';

interface FlowState {
  currentStep: FlowStep;
  hasAnalyzed: boolean;
  dataSource: DataSource;
  subscriptionTier: SubscriptionTier;
  setStep: (step: FlowStep) => void;
  runSample: () => void;
  uploadCsv: (fileName: string) => void;
  toggleSubscription: () => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  currentStep: 1,
  hasAnalyzed: false,
  dataSource: null,
  subscriptionTier: 'free',
  setStep: (step) =>
    set((state) => ({ currentStep: step === 1 || state.hasAnalyzed ? step : state.currentStep })),
  runSample: () => set({ hasAnalyzed: true, dataSource: 'sample', currentStep: 2 }),
  uploadCsv: (_fileName) => set({ hasAnalyzed: true, dataSource: 'csv', currentStep: 2 }),
  toggleSubscription: () =>
    set((state) => ({ subscriptionTier: state.subscriptionTier === 'free' ? 'pro' : 'free' })),
}));
