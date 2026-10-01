/**
 * 日志模板集中处：所有版本化相关写操作都要记录日志。
 * 字段变更时必须同步改模板与调用处（services/versioning 等）。
 */
export const LOG_TEMPLATES = {
  BrailleSymbol: [
    "点字字符创建",
    "点字字符更新",
    "点字字符状态变更",
    "点字字符导出",
    "点字卡片新版本发布：symbol={symbolId} version={versionNo} editor={editor}",
    "点字卡片并发保存分叉：symbol={symbolId} 保留版本 {keptVersionIds}，等待冲突裁决"
  ],
  BrailleSymbolVersion: [
    "卡片版本快照创建：symbol={symbolId} version={versionNo} status={status}",
    "卡片版本状态流转：symbol={symbolId} version={versionNo} {fromStatus}->{toStatus}",
    "旧数据首次内容回填：symbol={symbolId} version={versionNo} source={source}",
    "卡片版本导出：symbol={symbolId} versions={count}"
  ],
  Lesson: [
    "课程创建",
    "课程更新",
    "课程状态变更",
    "课程导出",
    "课程受卡片更新影响重算：lesson={lessonId} 待重练符号 {symbolIds}",
    "课程待重练标记清除：lesson={lessonId} 学生已按新版本 {versionIds} 重练"
  ],
  PracticeSession: [
    "练习会话创建",
    "练习会话更新",
    "练习会话状态变更",
    "练习会话导出",
    "会话冻结开始时卡片版本：session={sessionId} versions={versionIds}",
    "未完成会话继续沿用旧字形出题：session={sessionId} basedOn={versionIds}"
  ],
  AnswerRecord: [
    "答题记录创建",
    "答题记录更新",
    "答题记录状态变更",
    "答题记录导出",
    "答题记录按当时版本解释：record={recordId} version={versionId} superseded={superseded}",
    "旧答题记录回填首次卡片内容：record={recordId} symbol={symbolId}"
  ]
};
