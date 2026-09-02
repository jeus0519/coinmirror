import { create } from 'zustand';

import { analyzeCsvInput } from '@/lib/csv/analyze-csv';
import { type TradeHistoryAnalysisResult } from '@/lib/trade-history/build-analysis';
import { type DiagnosisProfile } from '@/lib/onboarding-diagnosis';
import {
  buildIncrementalSnapshotFromAnalysis,
  buildSnapshotFromAnalysis,
  compareSnapshots,
  type SnapshotComparison,
  type SubscriptionSnapshot,
} from '@/lib/subscription/snapshots';
import {
  buildGoalCandidateFromComparison,
  evaluateSavedGoal,
  saveGoalFromCandidate,
  type SavedSubscriptionGoal,
  type SubscriptionGoalCandidate,
} from '@/lib/subscription/goals';
import {
  clearPersistedSubscriptionState,
  getBrowserSubscriptionStorage,
  loadPersistedSubscriptionState,
  persistSubscriptionState,
  type SubscriptionPersistenceStorage,
} from '@/lib/subscription/persistence';
import {
  DUPLICATE_UPLOAD_DEMO_BASELINE_CSV,
  DUPLICATE_UPLOAD_DEMO_SECOND_CSV,
} from '@/lib/subscription/duplicate-upload-demo';

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
  subscriptionSnapshots: SubscriptionSnapshot[];
  snapshotComparison: SnapshotComparison | null;
  suggestedSubscriptionGoal: SubscriptionGoalCandidate | null;
  savedSubscriptionGoals: SavedSubscriptionGoal[];
  diagnosisAnswers: DiagnosisProfile;
  tradeAnalysis: TradeHistoryAnalysisResult | null;
  setStep: (step: FlowStep) => void;
  saveDiagnosis: (answers: DiagnosisProfile) => void;
  runSample: () => void;
  runDuplicateUploadDemo: (storage?: SubscriptionPersistenceStorage | null) => void;
  setTradeAnalysisPreview: (analysis: TradeHistoryAnalysisResult) => void;
  clearTradeAnalysis: () => void;
  confirmTradeAnalysis: () => void;
  toggleSubscription: () => void;
  saveCurrentAnalysisSnapshot: (storage?: SubscriptionPersistenceStorage | null) => void;
  saveSuggestedSubscriptionGoal: (storage?: SubscriptionPersistenceStorage | null) => void;
  restoreSubscriptionState: (storage?: SubscriptionPersistenceStorage | null) => void;
  clearSubscriptionSnapshots: (storage?: SubscriptionPersistenceStorage | null) => void;
}

function resolveStorage(storage?: SubscriptionPersistenceStorage | null) {
  return storage === undefined ? getBrowserSubscriptionStorage() : storage;
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
  subscriptionSnapshots: [],
  snapshotComparison: null,
  suggestedSubscriptionGoal: null,
  savedSubscriptionGoals: [],
  diagnosisAnswers: {},
  tradeAnalysis: null,
  setStep: (step) =>
    set((state) => ({ currentStep: canEnterStep(state, step) ? step : state.currentStep })),
  saveDiagnosis: (answers) =>
    set({ hasDiagnosis: true, diagnosisAnswers: answers, currentStep: 3 }),
  runSample: () =>
    set({ hasAnalyzed: true, dataSource: 'sample', tradeAnalysis: null, currentStep: 4 }),
  runDuplicateUploadDemo: (storage) =>
    set((state) => {
      const baselineAnalysis = analyzeCsvInput(DUPLICATE_UPLOAD_DEMO_BASELINE_CSV, state.diagnosisAnswers);
      const secondAnalysis = analyzeCsvInput(DUPLICATE_UPLOAD_DEMO_SECOND_CSV, state.diagnosisAnswers);
      const baseline = buildSnapshotFromAnalysis(baselineAnalysis, {
        id: 'demo-baseline',
        ownerId: 'local-device',
        createdAt: new Date().toISOString(),
        isBaseline: true,
      });
      const current = buildIncrementalSnapshotFromAnalysis(
        secondAnalysis,
        [baseline],
        state.diagnosisAnswers,
        {
          id: 'demo-second-upload',
          ownerId: 'local-device',
          createdAt: new Date().toISOString(),
          isBaseline: false,
        }
      );
      const comparison = compareSnapshots(baseline, current);
      const nextState = {
        currentStep: 4 as FlowStep,
        hasAnalyzed: true,
        dataSource: 'csv' as DataSource,
        tradeAnalysis: secondAnalysis,
        subscriptionSnapshots: [baseline, current],
        snapshotComparison: comparison,
        suggestedSubscriptionGoal: buildGoalCandidateFromComparison(comparison),
        savedSubscriptionGoals: state.savedSubscriptionGoals.map((goal) =>
          evaluateSavedGoal(goal, comparison)
        ),
      };
      persistSubscriptionState(resolveStorage(storage), {
        snapshots: nextState.subscriptionSnapshots,
        goals: nextState.savedSubscriptionGoals,
      });
      return nextState;
    }),
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
  saveCurrentAnalysisSnapshot: (storage) =>
    set((state) => {
      if (!state.tradeAnalysis) return state;
      const previous = state.subscriptionSnapshots.at(-1) ?? null;
      const snapshot = previous
        ? buildIncrementalSnapshotFromAnalysis(
            state.tradeAnalysis,
            state.subscriptionSnapshots,
            state.diagnosisAnswers,
            {
              id: `local-${state.subscriptionSnapshots.length + 1}`,
              ownerId: 'local-device',
              createdAt: new Date().toISOString(),
              isBaseline: false,
            }
          )
        : buildSnapshotFromAnalysis(state.tradeAnalysis, {
            id: `local-${state.subscriptionSnapshots.length + 1}`,
            ownerId: 'local-device',
            createdAt: new Date().toISOString(),
            isBaseline: true,
          });
      const comparison = previous ? compareSnapshots(previous, snapshot) : null;
      const nextState = {
        subscriptionSnapshots: [...state.subscriptionSnapshots, snapshot],
        snapshotComparison: comparison,
        suggestedSubscriptionGoal: buildGoalCandidateFromComparison(comparison),
        savedSubscriptionGoals: state.savedSubscriptionGoals.map((goal) =>
          evaluateSavedGoal(goal, comparison)
        ),
      };
      persistSubscriptionState(resolveStorage(storage), {
        snapshots: nextState.subscriptionSnapshots,
        goals: nextState.savedSubscriptionGoals,
      });
      return nextState;
    }),
  saveSuggestedSubscriptionGoal: (storage) =>
    set((state) => {
      if (!state.suggestedSubscriptionGoal) return state;
      const goal = saveGoalFromCandidate(state.suggestedSubscriptionGoal, {
        id: `goal-${state.savedSubscriptionGoals.length + 1}`,
        createdAt: new Date().toISOString(),
      });
      const nextState = {
        savedSubscriptionGoals: [...state.savedSubscriptionGoals, goal],
        suggestedSubscriptionGoal: null,
      };
      persistSubscriptionState(resolveStorage(storage), {
        snapshots: state.subscriptionSnapshots,
        goals: nextState.savedSubscriptionGoals,
      });
      return nextState;
    }),
  restoreSubscriptionState: (storage) =>
    set((state) => {
      const persisted = loadPersistedSubscriptionState(resolveStorage(storage));
      const previous = persisted.snapshots.at(-2) ?? null;
      const current = persisted.snapshots.at(-1) ?? null;
      const comparison = previous && current ? compareSnapshots(previous, current) : null;
      return {
        ...state,
        subscriptionSnapshots: persisted.snapshots,
        snapshotComparison: comparison,
        suggestedSubscriptionGoal: buildGoalCandidateFromComparison(comparison),
        savedSubscriptionGoals: persisted.goals.map((goal) => evaluateSavedGoal(goal, comparison)),
      };
    }),
  clearSubscriptionSnapshots: (storage) => {
    clearPersistedSubscriptionState(resolveStorage(storage));
    set({
      subscriptionSnapshots: [],
      snapshotComparison: null,
      suggestedSubscriptionGoal: null,
      savedSubscriptionGoals: [],
    });
  },
}));
