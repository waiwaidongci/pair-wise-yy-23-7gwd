import { useMemo, useState } from "react";
import { useDataStore } from "../stores/DataStore";
import { BrailleCell } from "../components/common/BrailleCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge, VersionBadge } from "../components/common/StatusBadge";
import { useBackfillStatus, useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { conflictVersionsOf, currentVersion, versionsOfSymbol } from "../utils/selectors";
import { formatDate, formatVersionNo } from "../utils/formatters";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { GlyphContent } from "../utils/versioning";

const GLYPH_FIELDS: Array<keyof GlyphContent> = [
  "cell_pattern",
  "letter",
  "pinyin",
  "category",
  "difficulty",
  "audio_hint_key"
];

export function LearnPage() {
  const symbols = useDataStore((state) => state.symbols);
  const versions = useDataStore((state) => state.versions);
  const saveCard = useDataStore((state) => state.saveCard);
  const resolveConflict = useDataStore((state) => state.resolveConflict);
  const conflictNotice = useDataStore((state) => state.conflictNotice);
  const clearConflictNotice = useDataStore((state) => state.clearConflictNotice);
  const backfill = useBackfillStatus();

  const [selectedId, setSelectedId] = useState<number | null>(symbols[0]?.id ?? null);
  const [editor, setEditor] = useState("teacher-zhang");
  const [form, setForm] = useState<GlyphContent | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = symbols.find((symbol) => symbol.id === selectedId) ?? null;
  const symbolVersions = useMemo(
    () => (selected ? versionsOfSymbol(versions, selected.id) : []),
    [versions, selected]
  );
  const active = currentVersion(versions, selected ?? undefined);
  const { pageRows } = useIndexedDbStore(symbolVersions, 6);

  const beginEdit = (symbol: BrailleSymbol, version: BrailleSymbolVersion | undefined) => {
    setSelectedId(symbol.id);
    setForm(
      version
        ? {
            cell_pattern: version.cell_pattern,
            letter: version.letter,
            pinyin: version.pinyin,
            category: version.category,
            difficulty: version.difficulty,
            audio_hint_key: version.audio_hint_key
          }
        : {
            cell_pattern: symbol.cell_pattern,
            letter: symbol.letter,
            pinyin: symbol.pinyin,
            category: symbol.category,
            difficulty: symbol.difficulty,
            audio_hint_key: symbol.audio_hint_key
          }
    );
    setNote("");
  };

  const submit = async () => {
    if (!selected || !form) return;
    setSaving(true);
    try {
      await saveCard({ symbol: selected, nextGlyph: form, editor: editor.trim() || "teacher", note });
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  const settle = async (chosenVersionId: string) => {
    if (!selected) return;
    await resolveConflict(selected.id, chosenVersionId);
  };

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">learn</p>
          <h1>学习卡片 · 版本化</h1>
          <p className="sub">
            老师修正卡片会产生不可变新版本；后续练习使用新字形，进行中的会话与已交卷记录仍按当时版本解释。
          </p>
        </div>
        <StatusBadge value="VERSIONED" tone="ok" label="卡片版本受控" />
      </section>

      {backfill.changed && (
        <section className="notice info">
          检测到无版本标识的旧数据，已兼容并回填首次内容：
          卡片 {backfill.counts.symbols} 张、会话 {backfill.counts.sessions} 个、
          答题记录 {backfill.counts.records} 条、课程 {backfill.counts.lessons} 门。
        </section>
      )}
      {conflictNotice && (
        <section className="notice danger">
          <span>{conflictNotice.message}</span>
          <button className="link" onClick={clearConflictNotice}>
            知道了
          </button>
        </section>
      )}

      <section className="workbench learn-layout">
        <div className="panel">
          <h2>卡片列表</h2>
          <div className="card-list">
            {symbols.map((symbol) => {
              return (
                <button
                  key={symbol.id}
                  className={"card-item" + (selectedId === symbol.id ? " active" : "")}
                  onClick={() => {
                    setSelectedId(symbol.id);
                    setForm(null);
                  }}
                >
                  <span className="card-item-letter">{symbol.letter}</span>
                  <span className="card-item-meta">
                    {symbol.pinyin} · {symbol.category}
                    <small>
                      {formatVersionNo(symbol.current_version_no)} · {symbol.cell_pattern}
                    </small>
                  </span>
                  {symbol.has_conflict && <StatusBadge value="CONFLICT" tone="danger" label="冲突" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel wide">
          {!selected ? (
            <EmptyState title="请选择一张卡片" />
          ) : (
            <>
              <div className="symbol-head">
                <h2>
                  卡片「{selected.letter}」 <VersionBadge versionNo={selected.current_version_no} current />
                </h2>
                <button className="primary" onClick={() => beginEdit(selected, active)}>
                  修正卡片
                </button>
              </div>

              {selected.has_conflict && (
                <ConflictPanel
                  symbol={selected}
                  candidates={conflictVersionsOf(versions, selected.id)}
                  onSettle={settle}
                />
              )}

              {form ? (
                <CardForm
                  form={form}
                  setForm={setForm}
                  editor={editor}
                  setEditor={setEditor}
                  note={note}
                  setNote={setNote}
                  saving={saving}
                  onCancel={() => setForm(null)}
                  onSubmit={submit}
                />
              ) : (
                <div className="symbol-current">
                  <BrailleCell pattern={selected.cell_pattern} letter={selected.letter} />
                  <dl className="symbol-fields">
                    <dt>拼音</dt>
                    <dd>{selected.pinyin}</dd>
                    <dt>分类</dt>
                    <dd>{selected.category}</dd>
                    <dt>难度</dt>
                    <dd>{selected.difficulty}</dd>
                    <dt>听音键</dt>
                    <dd>{selected.audio_hint_key}</dd>
                    <dt>版本 id</dt>
                    <dd>{selected.current_version_id ?? "旧数据待回填"}</dd>
                  </dl>
                </div>
              )}

              <h3 className="version-history-title">版本历史（不可变快照）</h3>
              <div className="version-history">
                {pageRows.map((version) => (
                  <article key={version.id} className={"version-row " + version.status.toLowerCase()}>
                    <BrailleCell pattern={version.cell_pattern} letter={version.letter} size={52} stale={version.status !== "ACTIVE"} />
                    <div className="version-info">
                      <strong>
                        {formatVersionNo(version.version_no)}
                        <VersionBadge versionNo={version.version_no} />
                        <StatusBadge
                          value={version.status}
                          tone={version.status === "CONFLICT" ? "danger" : version.status === "ACTIVE" ? "ok" : "muted"}
                          label={version.status === "ACTIVE" ? "当前" : version.status === "CONFLICT" ? "冲突分叉" : "已取代"}
                        />
                      </strong>
                      <p>{version.note || "—"}</p>
                      <small>
                        {version.editor} · {formatDate(version.created_at)} · id {version.id}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function CardForm({
  form,
  setForm,
  editor,
  setEditor,
  note,
  setNote,
  saving,
  onSubmit,
  onCancel
}: {
  form: GlyphContent;
  setForm: (form: GlyphContent) => void;
  editor: string;
  setEditor: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card-form">
      <div className="form-grid">
        {GLYPH_FIELDS.map((field) => (
          <label key={field}>
            {field}
            <input
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
            />
          </label>
        ))}
        <label>
          修改老师
          <input value={editor} onChange={(event) => setEditor(event.target.value)} />
        </label>
        <label className="span-2">
          修改说明（写入新版本 note）
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：a 的点位应为 1" />
        </label>
      </div>
      <div className="form-actions">
        <button className="primary" disabled={saving} onClick={onSubmit}>
          {saving ? "保存中…" : "发布新版本"}
        </button>
        <button onClick={onCancel}>取消</button>
      </div>
      <p className="form-hint">
        若另一位老师已先保存：系统会保留双方版本、标记冲突并自动重算受影响的未完成课程。
      </p>
    </div>
  );
}

function ConflictPanel({
  symbol,
  candidates,
  onSettle
}: {
  symbol: BrailleSymbol;
  candidates: BrailleSymbolVersion[];
  onSettle: (versionId: string) => void;
}) {
  return (
    <section className="conflict-panel">
      <h3>并发保存冲突 · 各留版本，请裁决「{symbol.letter}」最终字形</h3>
      <p>
        两位老师同时保存了这张卡片。当前版本与分叉版本均已保留，裁决后被选中的版本恢复为当前版本，
        另一方版本保留在历史中（标记为已取代）。
      </p>
      <div className="conflict-candidates">
        {candidates.map((version) => (
          <article key={version.id} className={"conflict-card " + version.status.toLowerCase()}>
            <BrailleCell
              pattern={version.cell_pattern}
              letter={version.letter}
              size={60}
              stale={version.status === "CONFLICT"}
            />
            <VersionBadge versionNo={version.version_no} status={version.status} />
            <p>{version.note || "无说明"}</p>
            <small>
              {version.editor} · {formatDate(version.created_at)}
            </small>
            <button className="primary" onClick={() => onSettle(version.id)}>
              采用此版本
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
