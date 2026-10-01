import type { SymbolSnapshot } from "./BrailleSymbol";

export type SessionStatus = "in_progress" | "finished";

export interface PracticeSession {
  id: number;
  lesson_id: number;
  mode: string;
  started_at: string;
  finished_at: string;
  score: number;
  mistake_count: number;
  status: SessionStatus;
  // 开考时锁定的卡片快照：未做完的会话始终按这份快照出题
  symbol_snapshot: SymbolSnapshot[];
  // 卡片在会话进行中被更新时置为 true，提示该课程需要重算/重练
  needs_repractice: boolean;
  repractice_reason?: string;
  // 由“待重练”再次开练时，记录来源会话
  repractice_source_session_id?: number;
  // 旧数据回填标记
  backfilled?: boolean;
}
