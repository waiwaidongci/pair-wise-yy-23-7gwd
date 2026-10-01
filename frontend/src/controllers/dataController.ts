import { loadBundle } from "../services/dataRepository";
import { backfillLegacyData, type BackfillReport } from "../services/legacyBackfill";
import { ControllerError } from "../utils/ControllerError";
import { log } from "../utils/logger";
import type { DataBundle } from "../services/dataRepository";

export interface BootstrapResult {
  bundle: DataBundle;
  report: BackfillReport;
}

/**
 * 应用启动唯一入口：先装载 IndexedDB（空库时播种），
 * 再兼容回填没有版本标识的旧数据。controller 层负责包一层异常。
 */
export async function bootstrapData(): Promise<BootstrapResult> {
  try {
    const { seedDatabaseIfEmpty } = await import("../db/seed");
    const seeded = await seedDatabaseIfEmpty();
    if (seeded) log("BrailleSymbolVersion", 2, { symbolId: 0, versionNo: 1, source: "seed" });

    const bundle = await loadBundle();
    const report = await backfillLegacyData(bundle);
    if (report.changed) {
      const refreshed = await loadBundle();
      return { bundle: refreshed, report };
    }
    return { bundle, report };
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}

export async function reloadBundle(): Promise<DataBundle> {
  try {
    return await loadBundle();
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}
