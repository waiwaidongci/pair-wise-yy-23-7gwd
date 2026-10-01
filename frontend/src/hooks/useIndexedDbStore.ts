import { useEffect, useMemo, useState } from "react";
import { useDataStore } from "../stores/DataStore";

/** 通用本地数据表分页 hook（IndexedDB 支持的列表统一走它） */
export function useIndexedDbStore<T>(rows: T[] = [], pageSize = 8) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows]);
  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize]
  );
  return { page, setPage, pageSize, pageRows, total: rows.length };
}

/** 旧数据兼容回填状态：首次加载若发生回填，向页面返回报告供提示 */
export function useBackfillStatus() {
  const report = useDataStore((state) => state.backfillReport);
  const loading = useDataStore((state) => state.loading);
  return {
    loading,
    changed: !!report?.changed,
    report,
    counts: report
      ? {
          symbols: report.symbolIds.length,
          sessions: report.sessionIds.length,
          records: report.recordIds.length,
          lessons: report.lessonIds.length
        }
      : { symbols: 0, sessions: 0, records: 0, lessons: 0 }
  };
}
