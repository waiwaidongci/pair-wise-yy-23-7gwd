/* eslint-disable @typescript-eslint/no-explicit-any */
// Node 端到端验证：用内存 IndexedDB 桩跑通 bootstrap/回填/改卡/重算/会话/冲突
import { bootstrapData } from "../src/controllers/dataController";
import { publishCardRevision, resolveCardConflict } from "../src/services/cardVersionService";
import {
  startPracticeSession,
  gradeAnswer,
  finishPracticeSession,
  getFrozenQuestion
} from "../src/services/practiceSessionService";
import { clearRepracticeIfRefreshed } from "../src/services/lessonRecalculation";
import { ControllerError } from "../src/utils/ControllerError";
import { ServiceError } from "../src/utils/ServiceError";

// ---- 最小可用的同步内存 IndexedDB 桩（put 在微任务结束时落库，模拟事务提交） ----
class MemStore {
  map = new Map<any, any>();
  pending = new Map<any, any>();
  keyPath: string;
  constructor(keyPath: string) {
    this.keyPath = keyPath;
  }
  begin() {
    this.pending = new Map();
  }
  commit() {
    this.pending.forEach((value, key) => this.map.set(key, value));
    this.pending = new Map();
  }
  put(value: any) {
    const key = value[this.keyPath];
    this.pending.set(key, structuredClone(value));
    return makeRequest(structuredClone(value));
  }
  getAll() {
    return makeRequest([...this.map.values()].map((v) => structuredClone(v)));
  }
  get(key: any) {
    return makeRequest(structuredClone(this.map.get(key)));
  }
  count() {
    return makeRequest(this.map.size);
  }
  clear() {
    this.pending = new Map();
    this.map.clear();
    return makeRequest(undefined);
  }
}

function makeRequest(result: any): any {
  const request: any = { result, onsuccess: null, onerror: null, error: null };
  queueMicrotask(() => request.onsuccess?.({}));
  return request;
}

class MemDB {
  stores = new Map<string, MemStore>();
  createObjectStore(name: string, opts: { keyPath: string }) {
    const store = new MemStore(opts.keyPath);
    this.stores.set(name, store);
    return store;
  }
  objectStoreNames = {
    contains: (name: string) => this.stores.has(name)
  };
  transaction(names: string | string[]) {
    const list = Array.isArray(names) ? names : [names];
    const stores = list.map((n) => this.stores.get(n)!);
    stores.forEach((s) => s.begin());
    const tx: any = {
      objectStore: (name?: string) =>
        name ? this.stores.get(name)! : stores[0],
      oncomplete: null,
      onerror: null,
      error: null
    };
    queueMicrotask(() => {
      stores.forEach((s) => s.commit());
      tx.oncomplete?.({});
    });
    return tx;
  }
}

const db = new MemDB();
(globalThis as any).indexedDB = {
  open() {
    const request: any = { result: db, onupgradeneeded: null, onsuccess: null, onerror: null, error: null };
    queueMicrotask(() => {
      request.onupgradeneeded?.({});
      request.onsuccess?.({});
    });
    return request;
  }
};

let failures = 0;
function assert(cond: boolean, message: string) {
  if (cond) console.log("PASS:", message);
  else {
    failures++;
    console.error("FAIL:", message);
  }
}
const glyph = (cell_pattern: string, category = "LETTER", extra: Record<string, string> = {}) => ({
  cell_pattern,
  letter: "b",
  pinyin: "bo",
  category,
  difficulty: "EASY",
  audio_hint_key: "letter-b",
  ...extra
});

async function main() {
  // 1. 启动 + 旧数据回填
  const boot = await bootstrapData();
  const b = boot.bundle;
  assert(b.symbols.length === 7, "种子 7 张卡片");
  const sym6 = b.symbols.find((s) => s.id === 6)!;
  assert(sym6.current_version_id === "sym-6-v1" && sym6.current_version_no === 1, "旧卡片回填 v1 指针");
  const legacySession = b.sessions.find((s) => s.id === 3)!;
  assert(legacySession.status === "FINISHED" && legacySession.card_snapshots.length === 2, "旧会话回填状态与快照");
  const legacyRecord = b.records.find((r) => r.id === 5)!;
  assert(
    !!legacyRecord.card_snapshot && legacyRecord.card_snapshot.version_id === "sym-6-v1",
    "旧答题记录回填当时快照"
  );
  assert(boot.report.changed, "回填报告标记发生变更");

  // 幂等
  const boot2 = await bootstrapData();
  assert(!boot2.report.changed, "回填幂等：第二次启动无变更");

  // 2. 已交卷记录按当时内容解释
  const r1 = boot2.bundle.records.find((r) => r.id === 1)!;
  assert(
    r1.card_snapshot!.cell_pattern === "2" && r1.superseded === true,
    "已交卷错题按 v1 旧点位解释且标记 superseded"
  );
  assert(
    boot2.bundle.sessions.find((x) => x.id === 1)!.card_snapshots[0].version_id === "sym-1-v1",
    "已交卷会话保留 sym-1-v1 快照"
  );

  // 3. 课程1已待重练
  const l1 = boot2.bundle.lessons.find((x) => x.id === 1)!;
  assert(l1.needs_repractice && l1.stale_version_ids.includes("sym-1-v1"), "课程1待重练并记录旧版本");

  // 4. 新会话使用新字形 v2
  const newSession = startPracticeSession({
    lessonId: 1,
    mode: "CELL_TO_TEXT",
    editor: "student-new",
    bundle: boot2.bundle
  });
  assert(newSession.card_snapshots[0].version_id === "sym-1-v2", "后续新练习使用新字形 v2");

  // 5. 进行中旧会话 #2 继续按 v1 出题
  const s2 = boot2.bundle.sessions.find((x) => x.id === 2)!;
  const frozen = getFrozenQuestion(s2, 0);
  assert(
    frozen.version_id === "sym-1-v1" && frozen.cell_pattern === "2",
    "未做完会话继续按开始时的卡片 v1 出题"
  );

  // 6. 顺序保存：sym-2 生成 v2，课程重算
  const sym2 = boot2.bundle.symbols.find((s) => s.id === 2)!;
  const result = await publishCardRevision({
    symbol: sym2,
    nextGlyph: glyph("1,2", "NUMBER"),
    editor: "teacher-zhao",
    note: "仅分类修正测试",
    baseVersionId: sym2.current_version_id,
    bundle: boot2.bundle
  });
  assert(result.version.version_no === 2 && result.version.id === "sym-2-v2", "顺序保存生成 v2");
  const l1After = result.changedLessons.find((x) => x.id === 1);
  assert(
    !!l1After && l1After.needs_repractice && l1After.stale_version_ids.includes("sym-2-v1"),
    "卡片2更新后课程1重算并追加 sym-2-v1 待重练"
  );

  // 字形不变不产生新版本
  const refreshed = await bootstrapData();
  const sym2r = refreshed.bundle.symbols.find((s) => s.id === 2)!;
  const noop = await publishCardRevision({
    symbol: sym2r,
    nextGlyph: glyph(sym2r.cell_pattern, sym2r.category),
    editor: "teacher-zhao",
    baseVersionId: sym2r.current_version_id,
    bundle: refreshed.bundle
  });
  assert(noop.version.id === "sym-2-v2", "字形不变时不产生新版本");

  // 7. 并发保存：A 先保存 v3(ACTIVE)，B 基于同一旧版保存 -> v4(CONFLICT)
  const base = await bootstrapData();
  const sym2b = base.bundle.symbols.find((s) => s.id === 2)!;
  await publishCardRevision({
    symbol: sym2b,
    nextGlyph: glyph("1,2,3", "NUMBER"),
    editor: "teacher-a",
    note: "A 的修正",
    baseVersionId: "sym-2-v2",
    bundle: base.bundle
  });
  const afterA = await bootstrapData();
  const sym2AfterA = afterA.bundle.symbols.find((s) => s.id === 2)!;
  assert(sym2AfterA.current_version_id === "sym-2-v3", "先保存者 A 的 v3 成为当前版本");

  let conflicted = false;
  try {
    await publishCardRevision({
      symbol: { ...sym2AfterA, current_version_id: "sym-2-v2", current_version_no: 2 },
      nextGlyph: glyph("1,2,6", "NUMBER", { pinyin: "b", audio_hint_key: "letter-b2" }),
      editor: "teacher-b",
      note: "B 的并发修正",
      baseVersionId: "sym-2-v2",
      bundle: afterA.bundle
    });
  } catch (e) {
    conflicted =
      (e instanceof ServiceError || e instanceof ControllerError) && e.code === "VERSION_CONFLICT";
  }
  assert(conflicted, "并发保存抛出版本冲突（controller 包装）");
  const afterB = await bootstrapData();
  const sym2Final = afterB.bundle.symbols.find((s) => s.id === 2)!;
  assert(
    sym2Final.has_conflict && sym2Final.current_version_id === "sym-2-v3",
    "冲突时卡片仍指向先保存版本并标记 has_conflict"
  );
  const v3 = afterB.bundle.versions.find((v) => v.id === "sym-2-v3")!;
  const v4 = afterB.bundle.versions.find((v) => v.id === "sym-2-v4")!;
  assert(
    v3.status === "ACTIVE" && v4.status === "CONFLICT" && v4.editor === "teacher-b",
    "两位老师版本都保留：v3 ACTIVE / v4 CONFLICT"
  );

  // 裁决采用 B 的 v4
  const resolved = await resolveCardConflict(afterB.bundle, 2, "sym-2-v4");
  assert(
    resolved.symbol.current_version_id === "sym-2-v4" && resolved.symbol.has_conflict === false,
    "裁决采用 B 版本后冲突清除"
  );
  assert(
    resolved.versions.find((v) => v.id === "sym-2-v3")!.status === "SUPERSEDED" &&
      resolved.versions.find((v) => v.id === "sym-2-v4")!.status === "ACTIVE",
    "裁决后 v3 保留为历史、v4 恢复当前"
  );

  // 8. 待重练清除语义（按卡片维度：旧版本被对应当前版本的练习覆盖）
  const afterResolve = await bootstrapData();
  const lesson1 = afterResolve.bundle.lessons.find((x) => x.id === 1)!;
  // 只练了 sym-1 的当前版本，stale 里还有 sym-2 旧版本 => 不清除
  const notYet = clearRepracticeIfRefreshed(afterResolve.bundle, 1, ["sym-1-v2"]);
  assert(!!notYet && notYet.needs_repractice === true, "仅覆盖部分卡片的旧版本时不清除待重练");
  // 两张卡片的当前版本都练过 => 清除（按卡片维度，不要求字面版本 id 相同）
  const cleared = clearRepracticeIfRefreshed(afterResolve.bundle, 1, ["sym-1-v2", "sym-2-v4"]);
  assert(
    !!cleared && cleared.needs_repractice === false && cleared.stale_version_ids.length === 0,
    "新字形重练覆盖全部受影响卡片后清除待重练"
  );

  // 9. 判分与交卷
  const grade = await gradeAnswer({
    session: newSession,
    questionIndex: 0,
    userAnswer: " a ",
    latencyMs: 1200,
    mistakeReason: "",
    bundle: afterResolve.bundle
  });
  assert(
    grade.record.correct &&
      grade.record.card_snapshot!.version_id === "sym-1-v2" &&
      grade.superseded === false,
    "新会话按新字形判分并冻结快照"
  );
  const finished = await finishPracticeSession({
    session: newSession,
    records: [grade.record],
    bundle: afterResolve.bundle
  });
  assert(finished.status === "FINISHED" && finished.finished_at !== "", "交卷后状态 FINISHED 且记录交卷时间");

  // 10. 完整流程：进行中旧会话交卷不解除待重练；按新字形重练交卷解除
  // 重置课程1的待重练状态为初始（sym-1-v1 陈旧），模拟刚改完卡片
  const { saveManyLesson } = await import("../src/api/Lesson");
  const flow = await bootstrapData();
  const flowLesson = flow.bundle.lessons.find((x) => x.id === 1)!;
  await saveManyLesson([{ ...flowLesson, needs_repractice: true, stale_version_ids: ["sym-1-v1"] }]);
  const flowBundle = await bootstrapData();
  const lessonBefore = flowBundle.bundle.lessons.find((x) => x.id === 1)!;
  assert(lessonBefore.needs_repractice, "流程准备：课程1处于待重练");

  // 旧会话 #2 冻结的是 sym-1-v1，交卷后课程仍应待重练
  const staleSession = flowBundle.bundle.sessions.find((x) => x.id === 2)!;
  await finishPracticeSession({
    session: staleSession,
    records: flowBundle.bundle.records.filter((r) => r.session_id === 2),
    bundle: flowBundle.bundle
  });
  const afterStale = await bootstrapData();
  const lessonAfterStale = afterStale.bundle.lessons.find((x) => x.id === 1)!;
  assert(lessonAfterStale.needs_repractice, "旧字形会话交卷后课程仍待重练");

  // 按当前字形开始新会话（sym-1-v2），交卷前由老师/系统确认重练覆盖旧版本：
  // 模拟学生完成新练习，调用方按 stale->当前 映射确认覆盖后课程解除待重练
  const freshSession = startPracticeSession({
    lessonId: 1,
    mode: "CELL_TO_TEXT",
    editor: "student-repractice",
    bundle: afterStale.bundle
  });
  assert(
    freshSession.card_snapshots.some((s) => s.version_id === "sym-1-v2"),
    "重练会话使用卡片当前字形"
  );
  const repracticeRecords = await Promise.all(
    freshSession.card_snapshots.map((snapshot, index) =>
      gradeAnswer({
        session: freshSession,
        questionIndex: index,
        userAnswer: snapshot.letter,
        latencyMs: 1000,
        mistakeReason: "",
        bundle: afterStale.bundle
      })
    )
  );
  // 重练覆盖确认：按卡片维度，重练会话练过 sym-1 当前版本即覆盖 sym-1-v1
  const clearOk = clearRepracticeIfRefreshed(
    afterStale.bundle,
    1,
    repracticeRecords.map((r) => r.record.card_snapshot!.version_id)
  );
  assert(clearOk && clearOk.needs_repractice === false, "新字形重练覆盖旧版本后可解除待重练");
  await saveManyLesson([clearOk!]);
  const afterFresh = await bootstrapData();
  assert(
    afterFresh.bundle.lessons.find((x) => x.id === 1)!.needs_repractice === false,
    "解除结果已落库"
  );
  assert(repracticeRecords.every((r) => r.record.correct), "重练按当前字形全部判对");

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
