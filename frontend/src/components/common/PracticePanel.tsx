import { BrailleCell } from "./BrailleCell";
import { VersionBadge } from "./StatusBadge";
import type { CardSnapshot } from "../../types/BrailleSymbolVersion";

interface PracticePanelProps {
  question: CardSnapshot;
  mode: string;
  questionIndex: number;
  total: number;
  /** 题干字形是否已被新版本取代（仅进行中会话会出现：继续按开始时的卡片出题） */
  stale: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  feedback?: { correct: boolean; message: string } | null;
  disabled?: boolean;
}

const MODE_TEXT: Record<string, string> = {
  CELL_TO_TEXT: "看点阵写字母",
  TEXT_TO_CELL: "看字母选点阵",
  LISTENING: "听读音写字",
  MIXED: "混合练习"
};

export function PracticePanel({
  question,
  mode,
  questionIndex,
  total,
  stale,
  inputValue,
  onInputChange,
  onSubmit,
  feedback,
  disabled
}: PracticePanelProps) {
  const showCell = mode !== "TEXT_TO_CELL";
  return (
    <section className="practice-panel">
      <header className="practice-head">
        <span className="practice-mode">{MODE_TEXT[mode] ?? mode}</span>
        <span>
          第 {questionIndex + 1} / {total} 题
        </span>
        <VersionBadge versionNo={question.version_no} status={stale ? "SUPERSEDED" : "ACTIVE"} />
      </header>
      {stale && (
        <p className="practice-notice">
          本会话开始于卡片修正之前，仍按开始时的第 {question.version_no} 版字形出题；交卷后新练习才会使用新字形。
        </p>
      )}
      <div className="practice-question">
        {showCell ? (
          <BrailleCell pattern={question.cell_pattern} letter={mode === "MIXED" ? undefined : ""} stale={stale} />
        ) : (
          <div className="practice-text-question">{question.letter}</div>
        )}
        {mode === "LISTENING" && <p className="practice-hint">听音提示：{question.audio_hint_key}（{question.pinyin}）</p>}
      </div>
      <div className="practice-answer">
        <input
          value={inputValue}
          placeholder="输入你识别出的字母"
          disabled={disabled}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        />
        <button className="primary" onClick={onSubmit} disabled={disabled}>
          提交答案
        </button>
      </div>
      {feedback && (
        <p className={"practice-feedback " + (feedback.correct ? "ok" : "wrong")}>{feedback.message}</p>
      )}
    </section>
  );
}
