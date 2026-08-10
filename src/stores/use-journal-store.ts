import { create } from 'zustand';

/**
 * 스토어 작성 패턴 예시. 새 스토어는 이 구조(상태 + 액션을 한 인터페이스에)를 따른다.
 * 상세: docs/FRONTEND.md#상태관리
 */
export type TradeEmotion = 'fear' | 'greed' | 'fomo' | 'confidence' | 'neutral';

export interface JournalEntry {
  id: string;
  coinSymbol: string;
  emotion: TradeEmotion;
  note: string;
  createdAt: string;
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
  removeEntry: (id: string) => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
}));
