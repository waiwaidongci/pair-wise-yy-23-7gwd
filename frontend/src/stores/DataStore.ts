import { create } from "zustand";
import { bootstrapData, reloadBundle } from "../controllers/dataController";
import { saveCardRevision, settleCardConflict } from "../controllers/cardController";
import { beginSession, completeSession, submitAnswer } from "../controllers/practiceController";
import { savePracticeSession } from "../api/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { GlyphContent } from "../utils/versioning";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { BackfillReport } from "../services/legacyBackfill";

export interface ConflictNotice {
  symbolId: number;
  activeVersionId?: string;
  conflictVersionId?: string;
  message: string;
}

interface DataState {
  symbols: BrailleSymbol[];
  versions: BrailleSymbolVersion[];
  lessons: Lesson[];
  sessions: PracticeSession[];
  records: AnswerRecord[];
  loading: boolean;
  bootstrapped: boolean;
  backfillReport: BackfillReport | null;
  conflictNotice: ConflictNotice | null;
  bootError: string | null;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  saveCard: (args: {
    symbol: BrailleSymbol;
    nextGlyph: GlyphContent;
    editor: string;
    note?: string;
  }) => Promise<{ conflict: boolean }>;
  resolveConflict: (symbolId: number, chosenVersionId: string) => Promise<void>;
  startSession: (lessonId: number, mode: string, editor: string) => Promise<PracticeSession>;
  answerQuestion: (args: {
    session: PracticeSession;
    questionIndex: number;
    userAnswer: string;
    latencyMs: number;
    mistakeReason: string;
  }) => Promise<{ record: AnswerRecord; superseded: boolean }>;
  finishSession: (session: PracticeSession) => Promise<PracticeSession>;
  clearConflictNotice: () => void;
}

const emptyReport: BackfillReport = {
  symbolIds: [],
  versionIds: [],
  sessionIds: [],
  recordIds: [],
  lessonIds: [],
  changed: false
};

export const useDataStore = create<DataState>((set, get) => ({
  symbols: [],
  versions: [],
  lessons: [],
  sessions: [],
  records: [],
  loading: false,
  bootstrapped: false,
  backfillReport: null,
  conflictNotice: null,
  bootError: null,

  async bootstrap() {
    set({ loading: true });
    try {
      const { bundle, report } = await bootstrapData();
      set({
        symbols: bundle.symbols,
        versions: bundle.versions,
        lessons: bundle.lessons,
        sessions: bundle.sessions,
        records: bundle.records,
        backfillReport: report.changed ? report : emptyReport,
        loading: false,
        bootstrapped: true
      });
    } catch (error) {
      set({
        loading: false,
        bootstrapped: true,
        bootError:
          (error as { message?: string })?.message ?? "本地数据装载失败，请刷新重试或重置 IndexedDB"
      });
    }
  },

  async refresh() {
    const bundle = await reloadBundle();
    set({
      symbols: bundle.symbols,
      versions: bundle.versions,
      lessons: bundle.lessons,
      sessions: bundle.sessions,
      records: bundle.records
    });
  },

  async saveCard({ symbol, nextGlyph, editor, note }) {
    const base = get();
    const bundle = {
      symbols: base.symbols,
      versions: base.versions,
      lessons: base.lessons,
      sessions: base.sessions,
      records: base.records
    };
    try {
      await saveCardRevision({ symbol, nextGlyph, editor, note, baseVersionId: symbol.current_version_id }, bundle);
      await get().refresh();
      return { conflict: false };
    } catch (error) {
      // 并发保存：两位老师的版本都已落库，只是当前卡片仍指向先保存者，页面需说明冲突
      await get().refresh();
      const detail = (error as { detail?: Record<string, unknown> }).detail ?? {};
      set({
        conflictNotice: {
          symbolId: symbol.id,
          activeVersionId: detail.activeVersionId as string | undefined,
          conflictVersionId: detail.conflictVersionId as string | undefined,
          message: `「${symbol.letter}」卡片存在两位老师同时保存的版本，已各留版本并标记冲突，请在冲突面板选择保留字形。`
        }
      });
      return { conflict: true };
    }
  },

  async resolveConflict(symbolId, chosenVersionId) {
    const base = get();
    await settleCardConflict(
      {
        symbols: base.symbols,
        versions: base.versions,
        lessons: base.lessons,
        sessions: base.sessions,
        records: base.records
      },
      symbolId,
      chosenVersionId
    );
    set({ conflictNotice: null });
    await get().refresh();
  },

  async startSession(lessonId, mode, editor) {
    const base = get();
    const session = beginSession({
      lessonId,
      mode,
      editor,
      bundle: {
        symbols: base.symbols,
        versions: base.versions,
        lessons: base.lessons,
        sessions: base.sessions,
        records: base.records
      }
    });
    await savePracticeSession(session);
    await get().refresh();
    return session;
  },

  async answerQuestion({ session, questionIndex, userAnswer, latencyMs, mistakeReason }) {
    const base = get();
    const result = await submitAnswer({
      session,
      questionIndex,
      userAnswer,
      latencyMs,
      mistakeReason,
      bundle: {
        symbols: base.symbols,
        versions: base.versions,
        lessons: base.lessons,
        sessions: base.sessions,
        records: base.records
      }
    });
    await get().refresh();
    return result;
  },

  async finishSession(session) {
    const base = get();
    const finished = await completeSession({
      session,
      records: base.records,
      bundle: {
        symbols: base.symbols,
        versions: base.versions,
        lessons: base.lessons,
        sessions: base.sessions,
        records: base.records
      }
    });
    await get().refresh();
    return finished;
  },

  clearConflictNotice() {
    set({ conflictNotice: null });
  }
}));
