// 点字字符卡片：同一张卡片（id 稳定）可以有多个字形版本。
// 扁平字段（cell_pattern/letter/...）始终镜像“当前版本”，保证旧读取方兼容；
// 历史内容保存在 versions[] 中，用于会话快照与答题记录的当时内容解释。
export interface BrailleSymbolVersion {
  version: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: string;
  difficulty: string;
  audio_hint_key: string;
  updated_by: string;
  updated_at: string;
  change_note?: string;
  // 两名老师并发保存同一版本时，后保存的版本标记为冲突，两个版本都保留
  conflict?: boolean;
  conflict_note?: string;
}

export interface BrailleSymbol {
  id: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: string;
  difficulty: string;
  audio_hint_key: string;
  current_version: number;
  versions: BrailleSymbolVersion[];
}

// 会话/答题记录对卡片的快照：只记录版本号与当时字形，题目随版本走。
export interface SymbolSnapshot {
  symbol_id: number;
  version: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
}
