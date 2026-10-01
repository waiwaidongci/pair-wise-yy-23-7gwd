
import type { SymbolSnapshot } from "./BrailleSymbol";

export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  user_answer: string;
  correct: string;
  latency_ms: string;
  mistake_reason: string;
  // 答题时所依据的卡片版本：已交卷记录永远按当时字形解释
  symbol_version: number;
  symbol_snapshot: SymbolSnapshot;
  // 旧数据回填标记
  backfilled?: boolean;
}
