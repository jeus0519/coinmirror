import { create } from 'zustand';

import { type TradeHistoryAnalysisResult } from '@/lib/trade-history/build-analysis';
import { type DiagnosisProfile } from '@/lib/onboarding-diagnosis';

/**
 * docs/coinmirror_demo.html의 6단계 스테퍼 상태를 대응한다.
 * 거래내역 단계(3)까지는 언제나 들어갈 수 있고(시작 화면의 "자료부터 올리기" 경로),
 * hasAnalyzed가 true여야 분석 이후 단계로 진입한다.
 */
export type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;
export type DataSource = 'sample' | 'csv' | 'pdf' | null;
export type SubscriptionTier = 'free' | 'pro';

interface FlowState {
  currentStep: FlowStep;
  hasDiagnosis: boolean;
  hasAnalyzed: boolean;
  dataSource: DataSource;
  subscriptionTier: SubscriptionTier;
  diagnosisAnswers: DiagnosisProfile;
  tradeAnalysis: TradeHistoryAnalysisResult | null;
  setStep: (step: FlowStep) => void;
  saveDiagnosis: (answers: DiagnosisProfile) => void;
  runSample: () => void;
  setTradeAnalysisPreview: (analysis: TradeHistoryAnalysisResult) => void;
  clearTradeAnalysis: () => void;
  confirmTradeAnalysis: () => void;
  toggleSubscription: () => void;
}

function canEnterStep(state: FlowState, step: FlowStep) {
  if (step === 1 || step === 2 || step === 3) return true;
  return state.hasAnalyzed;
}

export const useFlowStore = create<FlowState>((set) => ({
  currentStep: 1,
  hasDiagnosis: false,
  hasAnalyzed: false,
  dataSource: null,
  subscriptionTier: 'free',
  diagnosisAnswers: {},
  tradeAnalysis: null,
  setStep: (step) =>
    set((state) => ({ currentStep: canEnterStep(state, step) ? step : state.currentStep })),
  saveDiagnosis: (answers) =>
    set({ hasDiagnosis: true, diagnosisAnswers: answers, currentStep: 3 }),
  runSample: () =>
    set({ hasAnalyzed: true, dataSource: 'sample', tradeAnalysis: null, currentStep: 4 }),
  setTradeAnalysisPreview: (analysis) =>
    set({ hasAnalyzed: false, dataSource: null, tradeAnalysis: analysis, currentStep: 3 }),
  clearTradeAnalysis: () => set({ tradeAnalysis: null, dataSource: null, hasAnalyzed: false }),
  confirmTradeAnalysis: () =>
    set((state) => ({
      hasAnalyzed: true,
      dataSource: state.tradeAnalysis?.sourceFormat ?? 'csv',
      currentStep: 4,
    })),
  toggleSubscription: () =>
    set((state) => ({ subscriptionTier: state.subscriptionTier === 'free' ? 'pro' : 'free' })),
}));
