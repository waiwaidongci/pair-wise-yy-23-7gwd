export interface BrailleSymbol {
  id: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: string;
  difficulty: string;
  audio_hint_key: string;
  /** 当前生效版本 id；旧数据回填前为 null，见 utils/versioning.ts 中 LEGACY_VERSION_NO */
  current_version_id: string | null;
  /** 当前生效版本号，便于列表直接展示“第 N 版” */
  current_version_no: number | null;
  /** 是否存在未解决的并发编辑分叉 */
  has_conflict: boolean;
}
