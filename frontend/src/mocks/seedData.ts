import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import { snapshotFromVersion } from "../utils/versioning";

/**
 * 种子数据刻意覆盖三类场景：
 * 1. 卡片 1 已被老师修正（v1 错误字形 -> v2 正确字形）：
 *    - 已交卷会话 session#1 冻结 v1，错题记录仍按当时内容解释；
 *    - 进行中会话 session#2 开始于修正前，继续按 v1 出题；
 *    - 课程 lesson#1 因此被重算并标记“待重练”。
 * 2. 卡片 6/7、课程 3 及其会话记录是“没有版本标识的旧数据”，
 *    首次加载时由 services/legacyBackfill 兼容并回填首次内容（v1）。
 */
export const seedBrailleSymbols: BrailleSymbol[] = [
  {
    id: 1,
    cell_pattern: "1",
    letter: "a",
    pinyin: "a",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-a",
    current_version_id: "sym-1-v2",
    current_version_no: 2,
    has_conflict: false
  },
  {
    id: 2,
    cell_pattern: "1,2",
    letter: "b",
    pinyin: "bo",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-b",
    current_version_id: "sym-2-v1",
    current_version_no: 1,
    has_conflict: false
  },
  {
    id: 3,
    cell_pattern: "1,4",
    letter: "c",
    pinyin: "ci",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-c",
    current_version_id: "sym-3-v1",
    current_version_no: 1,
    has_conflict: false
  },
  {
    id: 4,
    cell_pattern: "3,4,5,6",
    letter: "数号",
    pinyin: "number-sign",
    category: "NUMBER",
    difficulty: "MEDIUM",
    audio_hint_key: "number-sign",
    current_version_id: "sym-4-v1",
    current_version_no: 1,
    has_conflict: false
  },
  {
    id: 5,
    cell_pattern: "2",
    letter: "，",
    pinyin: "comma",
    category: "PUNCTUATION",
    difficulty: "MEDIUM",
    audio_hint_key: "punctuation-comma",
    current_version_id: "sym-5-v1",
    current_version_no: 1,
    has_conflict: false
  },
  // —— 以下两条为无版本标识的旧数据 ——
  {
    id: 6,
    cell_pattern: "1,4,5",
    letter: "d",
    pinyin: "di",
    category: "LETTER",
    difficulty: "MEDIUM",
    audio_hint_key: "letter-d"
  } as BrailleSymbol,
  {
    id: 7,
    cell_pattern: "1,5",
    letter: "e",
    pinyin: "e",
    category: "LETTER",
    difficulty: "MEDIUM",
    audio_hint_key: "letter-e"
  } as BrailleSymbol
];

export const seedBrailleSymbolVersions: BrailleSymbolVersion[] = [
  {
    id: "sym-1-v1",
    symbol_id: 1,
    version_no: 1,
    cell_pattern: "2",
    letter: "a",
    pinyin: "a",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-a",
    status: "SUPERSEDED",
    editor: "teacher-wang",
    parent_version_id: null,
    created_at: "2026-09-01T08:00:00Z",
    note: "初版：a 的点位误录为 2"
  },
  {
    id: "sym-1-v2",
    symbol_id: 1,
    version_no: 2,
    cell_pattern: "1",
    letter: "a",
    pinyin: "a",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-a",
    status: "ACTIVE",
    editor: "teacher-wang",
    parent_version_id: "sym-1-v1",
    created_at: "2026-09-15T10:30:00Z",
    note: "老师修正：字母 a 应为点位 1，原点位 2 是错的"
  },
  {
    id: "sym-2-v1",
    symbol_id: 2,
    version_no: 1,
    cell_pattern: "1,2",
    letter: "b",
    pinyin: "bo",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-b",
    status: "ACTIVE",
    editor: "teacher-li",
    parent_version_id: null,
    created_at: "2026-09-01T08:00:00Z",
    note: ""
  },
  {
    id: "sym-3-v1",
    symbol_id: 3,
    version_no: 1,
    cell_pattern: "1,4",
    letter: "c",
    pinyin: "ci",
    category: "LETTER",
    difficulty: "EASY",
    audio_hint_key: "letter-c",
    status: "ACTIVE",
    editor: "teacher-li",
    parent_version_id: null,
    created_at: "2026-09-01T08:00:00Z",
    note: ""
  },
  {
    id: "sym-4-v1",
    symbol_id: 4,
    version_no: 1,
    cell_pattern: "3,4,5,6",
    letter: "数号",
    pinyin: "number-sign",
    category: "NUMBER",
    difficulty: "MEDIUM",
    audio_hint_key: "number-sign",
    status: "ACTIVE",
    editor: "teacher-wang",
    parent_version_id: null,
    created_at: "2026-09-02T08:00:00Z",
    note: ""
  },
  {
    id: "sym-5-v1",
    symbol_id: 5,
    version_no: 1,
    cell_pattern: "2",
    letter: "，",
    pinyin: "comma",
    category: "PUNCTUATION",
    difficulty: "MEDIUM",
    audio_hint_key: "punctuation-comma",
    status: "ACTIVE",
    editor: "teacher-wang",
    parent_version_id: null,
    created_at: "2026-09-02T08:00:00Z",
    note: ""
  }
];

export const seedLessons: Lesson[] = [
  {
    id: 1,
    title: "基础字母（一）",
    symbol_ids: [1, 2, 3],
    stage: "入门",
    estimated_minutes: 10,
    unlock_rule: "无",
    needs_repractice: true,
    stale_version_ids: ["sym-1-v1"],
    recalculated_at: "2026-09-15T10:30:00Z"
  },
  {
    id: 2,
    title: "数字与标点",
    symbol_ids: [4, 5],
    stage: "进阶",
    estimated_minutes: 15,
    unlock_rule: "完成基础字母（一）",
    needs_repractice: false,
    stale_version_ids: [],
    recalculated_at: null
  },
  // —— 无版本标识的旧课程 ——
  {
    id: 3,
    title: "基础字母（二）",
    symbol_ids: [6, 7],
    stage: "入门",
    estimated_minutes: 12,
    unlock_rule: "无"
  } as Lesson
];

const v1 = (id: string) => seedBrailleSymbolVersions.find((version) => version.id === id)!;

export const seedPracticeSessions: PracticeSession[] = [
  {
    id: 1,
    lesson_id: 1,
    mode: "CELL_TO_TEXT",
    started_at: "2026-09-10T09:00:00Z",
    finished_at: "2026-09-10T09:08:00Z",
    score: 67,
    mistake_count: 1,
    status: "FINISHED",
    card_snapshots: ["sym-1-v1", "sym-2-v1", "sym-3-v1"].map((id) => snapshotFromVersion(v1(id))),
    baseline_version_ids: ["sym-1-v1", "sym-2-v1", "sym-3-v1"],
    editor: "student-1"
  },
  {
    // 开始于卡片修正之前，尚未交卷：必须继续按开始时的 v1 字形出题
    id: 2,
    lesson_id: 1,
    mode: "MIXED",
    started_at: "2026-09-12T14:00:00Z",
    finished_at: "",
    score: 0,
    mistake_count: 0,
    status: "IN_PROGRESS",
    card_snapshots: ["sym-1-v1", "sym-2-v1", "sym-3-v1"].map((id) => snapshotFromVersion(v1(id))),
    baseline_version_ids: ["sym-1-v1", "sym-2-v1", "sym-3-v1"],
    editor: "student-2"
  },
  // —— 无版本标识的旧会话 ——
  {
    id: 3,
    lesson_id: 3,
    mode: "CELL_TO_TEXT",
    started_at: "2026-08-20T09:00:00Z",
    finished_at: "2026-08-20T09:09:00Z",
    score: 100,
    mistake_count: 0
  } as PracticeSession
];

export const seedAnswerRecords: AnswerRecord[] = [
  {
    id: 1,
    session_id: 1,
    symbol_id: 1,
    user_answer: "b",
    correct: false,
    latency_ms: 4200,
    mistake_reason: "点阵识别错误：把点位「2」认成了 b（当时卡片点位录错，学生按旧字形作答）",
    card_snapshot: snapshotFromVersion(v1("sym-1-v1")),
    superseded: true
  },
  {
    id: 2,
    session_id: 1,
    symbol_id: 2,
    user_answer: "b",
    correct: true,
    latency_ms: 2100,
    mistake_reason: "",
    card_snapshot: snapshotFromVersion(v1("sym-2-v1")),
    superseded: false
  },
  {
    id: 3,
    session_id: 1,
    symbol_id: 3,
    user_answer: "c",
    correct: true,
    latency_ms: 1800,
    mistake_reason: "",
    card_snapshot: snapshotFromVersion(v1("sym-3-v1")),
    superseded: false
  },
  {
    // 进行中会话已答的一题，同样冻结 v1
    id: 4,
    session_id: 2,
    symbol_id: 1,
    user_answer: "b",
    correct: true,
    latency_ms: 2600,
    mistake_reason: "",
    card_snapshot: snapshotFromVersion(v1("sym-1-v1")),
    superseded: true
  },
  // —— 无版本标识的旧答题记录 ——
  {
    id: 5,
    session_id: 3,
    symbol_id: 6,
    user_answer: "d",
    correct: true,
    latency_ms: 1900,
    mistake_reason: ""
  } as AnswerRecord
];

/** 兼容旧工作台的汇总导出 */
export const mockData = {
  brailleSymbol: seedBrailleSymbols,
  brailleSymbolVersion: seedBrailleSymbolVersions,
  lesson: seedLessons,
  practiceSession: seedPracticeSessions,
  answerRecord: seedAnswerRecords
};
