/**
 * 点字卡片版本快照。
 *
 * 老师每次修正卡片（cell_pattern/letter/pinyin/category/difficulty/audio_hint_key）
 * 都会产生一条不可变的版本记录；已开始的会话与已交卷的答题记录通过
 * (symbol_id, version_id) 回指当时看到的字形，历史解释不随后续修改漂移。
 */
export interface BrailleSymbolVersion {
  /** 版本主键，同时作为 (symbol_id, version_no) 的复合引用目标 */
  id: string;
  symbol_id: number;
  /** 同一卡片下从 1 起递增 */
  version_no: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: string;
  difficulty: string;
  audio_hint_key: string;
  /** ACTIVE 当前生效版本；SUPERSEDED 被新版本取代；CONFLICT 两位老师并发保存产生的分叉 */
  status: string;
  /** 编辑老师，仅用于冲突说明展示 */
  editor: string;
  parent_version_id: string | null;
  created_at: string;
  note: string;
}

/** 会话/答题记录里冻结的“当时卡片内容”，与 BrailleSymbolVersion 字段保持同源 */
export interface CardSnapshot {
  symbol_id: number;
  version_id: string;
  version_no: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: string;
  difficulty: string;
  audio_hint_key: string;
}
