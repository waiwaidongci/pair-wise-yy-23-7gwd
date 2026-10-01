import type { CardSnapshot } from "./BrailleSymbolVersion";

export interface PracticeSession {
  id: number;
  lesson_id: number;
  mode: string;
  started_at: string;
  finished_at: string;
  score: number;
  mistake_count: number;
  /** IN_PROGRESS 未做完（继续按开始时的卡片出题）；FINISHED 已交卷 */
  status: string;
  /**
   * 会话开始时各题引用的卡片版本快照，按题目顺序冻结。
   * 会话中途老师改卡也不变：未做完的会话继续按开始时的卡片出题。
   */
  card_snapshots: CardSnapshot[];
  /** 会话开始时认定的课程快照版本，卡片更新后据此判定课程是否需要重练 */
  baseline_version_ids: string[];
  /** 编辑老师（会话发起人） */
  editor: string;
}
