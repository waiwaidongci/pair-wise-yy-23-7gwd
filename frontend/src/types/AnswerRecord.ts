import type { CardSnapshot } from "./BrailleSymbolVersion";

export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: string;
  /**
   * 答题时的卡片快照。已交卷记录永远按当时内容解释（错题原因不随新字形漂移）。
   * 旧数据回填前为 null，由 utils/versioning.ts 回填首次内容。
   */
  card_snapshot: CardSnapshot | null;
  /** 该题当前卡片是否已更新到新版本，错题本据此提示“旧错误原因依据的是旧字形” */
  superseded: boolean;
}
