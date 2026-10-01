import { useEffect, useState } from "react";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { SymbolCard } from "../components/common/SymbolCard";
import { ConflictBanner } from "../components/common/ConflictBanner";
import { VersionBadge } from "../components/common/VersionBadge";
import { BrailleCell } from "../components/common/BrailleCell";
import { formatDate } from "../utils/formatters";
import type { BrailleSymbol } from "../types/BrailleSymbol";

// 模拟当前登录老师（纯前端无鉴权）
const CURRENT_TEACHER = "teacher-zhang";

const emptyForm = {
  letter: "",
  pinyin: "",
  cell_pattern: "",
  category: "LETTER",
  difficulty: "NORMAL",
  changeNote: ""
};

export function LearnPage() {
  const { rows, loading, load, saveSymbol, conflict, clearConflict, versions, loadVersions, adoptVersion } =
    useBrailleSymbolStore();
  const [editing, setEditing] = useState<BrailleSymbol | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [historyId, setHistoryId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (symbol: BrailleSymbol) => {
    setEditing(symbol);
    setForm({
      letter: symbol.letter,
      pinyin: symbol.pinyin,
      cell_pattern: symbol.cell_pattern,
      category: symbol.category,
      difficulty: symbol.difficulty,
      changeNote: ""
    });
  };

  const submit = async () => {
    if (!editing) return;
    // 关键：带上 baseVersion（老师开始编辑时依据的版本），用于并发冲突检测。
    const result = await saveSymbol(
      {
        ...editing,
        letter: form.letter,
        pinyin: form.pinyin,
        cell_pattern: form.cell_pattern,
        category: form.category,
        difficulty: form.difficulty
      },
      { teacher: CURRENT_TEACHER, changeNote: form.changeNote, baseVersion: editing.current_version }
    );
    if (!result.conflict) {
      setEditing(null);
    } else {
      // 冲突时留在当前卡片，老师可查看两个版本后决定采用哪版。
      setEditing(result.data);
    }
  };

  const openHistory = async (id: number) => {
    setHistoryId(id);
    await loadVersions(id);
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">braille-trainer</p>
          <h1>学习卡片</h1>
        </div>
      </div>

      <ConflictBanner
        note={conflict.symbolId === editing?.id ? conflict.note : undefined}
        onResolve={editing ? () => openHistory(editing.id) : undefined}
      />

      {editing ? (
        <div className="panel wide">
          <h2>修正卡片 · {editing.letter}（当前 v{editing.current_version}）</h2>
          <p className="muted">
            保存后后续练习立即使用新字形；进行中的会话仍按开考时的字形出题，已交卷记录不受影响。
          </p>
          <div className="form-grid">
            <label>
              字母
              <input value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} />
            </label>
            <label>
              拼音
              <input value={form.pinyin} onChange={(e) => setForm({ ...form, pinyin: e.target.value })} />
            </label>
            <label>
              点阵（6 位 0/1）
              <input
                value={form.cell_pattern}
                onChange={(e) => setForm({ ...form, cell_pattern: e.target.value })}
              />
            </label>
            <label>
              分类
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="LETTER">LETTER</option>
                <option value="NUMBER">NUMBER</option>
                <option value="PUNCTUATION">PUNCTUATION</option>
                <option value="CONTRACTION">CONTRACTION</option>
              </select>
            </label>
            <label>
              难度
              <input
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              />
            </label>
            <label>
              变更说明
              <input
                value={form.changeNote}
                onChange={(e) => setForm({ ...form, changeNote: e.target.value })}
                placeholder="本次修正了什么"
              />
            </label>
            <div className="question-options">
              <button className="banner-action" onClick={submit}>
                保存为新版本
              </button>
              <button
                className="banner-action"
                onClick={() => {
                  setEditing(null);
                  clearConflict();
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="symbol-grid">
        {loading ? <p>加载中…</p> : null}
        {rows.map((symbol) => (
          <SymbolCard key={symbol.id} symbol={symbol} onEdit={startEdit} />
        ))}
      </div>

      {historyId != null ? (
        <div className="panel wide">
          <h2>版本历史 · 卡片 #{historyId}</h2>
          <div className="table">
            {versions.map((version) => (
              <article key={version.version} className="row">
                <strong>
                  <VersionBadge version={version.version} conflict={version.conflict} />
                </strong>
                <span className="muted">
                  {version.letter} · {version.cell_pattern} · {version.updated_by} ·{" "}
                  {formatDate(version.updated_at)}
                </span>
                <span className="muted">{version.conflict_note ?? version.change_note}</span>
                <button
                  className="banner-action"
                  onClick={() => adoptVersion(historyId, version.version, CURRENT_TEACHER)}
                >
                  采用此版
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
