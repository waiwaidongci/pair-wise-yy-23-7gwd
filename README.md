# 盲文点字学习训练器

纯前端盲文点字学习与练习工具，支持点阵字符卡片、听写练习、错题本和学习进度统计，数据存 IndexedDB。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20111>



## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`



## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI + Zustand + IndexedDB |
| 后端 | - |
| 数据库 | 本地模拟数据 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `braille-trainer`
- `FRONTEND_PORT`: 前端端口，默认 `20111`


## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: braille-trainer`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-braille-trainer}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 点字卡片版本化（老师改卡后的一致性处理）

老师修正点字卡片后，为避免“正在做的练习”和“已交卷的答题记录”对不上题目、旧错误原因失去依据，卡片按**同一张卡（id 稳定）+ 多个字形版本**建模：

- **后续练习使用新字形**：卡片保存后生成新版本并成为当前版本（`current_version`），新开考的会话与新题目一律取当前版本。
- **没做完的会话按开始时的卡片出题**：开考时把当时每张卡片的版本与字形锁定为会话快照（`symbol_snapshot`），会话期间题目不随卡片更新而变化。
- **已完成答题记录按当时内容解释**：答题记录保存所依据的卡片版本与字形快照（`symbol_version` / `symbol_snapshot`），交卷后永不翻案，错题本按当时字形展示错误原因。
- **受影响的未完成课程重算并标待重练**：卡片更新后重算所有进行中的会话，快照落后于当前版本的会话置 `needs_repractice` 并提示“待重练”；重练时用最新字形重新开考。
- **两名老师同时保存各留版本并说明冲突**：保存采用乐观并发，表单携带开始编辑时的 `baseVersion`；若期间他人已保存（`baseVersion !== current_version`），则追加新版本并标记 `conflict`，两个版本都保留，同时生成冲突说明，老师可在版本历史中确认采用哪一版。
- **旧数据兼容与回填**：没有版本标识的旧卡片/旧会话/旧记录，在首次加载时回填：卡片补写 `v1` 首次内容、会话按课程卡片补快照、答题记录补写答题时版本，并置 `backfilled` 标记。

关键文件：

| 职责 | 文件 |
|---|---|
| 版本/快照类型 | `frontend/src/types/BrailleSymbol.ts`、`types/PracticeSession.ts`、`types/AnswerRecord.ts` |
| 版本常量与文案 | `frontend/src/constants/versioning.ts`、`constants/logTemplates.ts`、`constants/errorCodes.ts`、`constants/errorMessages.ts` |
| 版本纯逻辑（回填/快照/重算/差异） | `frontend/src/utils/versioning.ts`、`utils/formatters.ts` |
| 版本对象构造 | `frontend/src/constructors/BrailleSymbolConstructor.ts`、`PracticeSessionConstructor.ts`、`AnswerRecordConstructor.ts` |
| 并发保存/冲突解决/待重练重算 | `frontend/src/api/BrailleSymbol.ts`、`api/PracticeSession.ts`、`api/AnswerRecord.ts`、`api/BrailleSymbolVersion.ts` |
| 状态联动 | `frontend/src/stores/BrailleSymbolStore.ts`、`PracticeSessionStore.ts`、`AnswerRecordStore.ts` |
| 会话出题/版本解析 | `frontend/src/hooks/usePracticeSession.ts`、`hooks/useSymbolVersion.ts` |
| 版本/冲突/待重练组件 | `frontend/src/components/common/VersionBadge.tsx`、`ConflictBanner.tsx`、`RepracticeBanner.tsx`、`SymbolCard.tsx`、`BrailleCell.tsx` |

## 枚举/常量出现位置清单

- PracticeMode: constants/PracticeMode、types/PracticeMode、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- SymbolCategory: constants/SymbolCategory、types/SymbolCategory、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- MasteryLevel: constants/MasteryLevel、types/MasteryLevel、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- 版本相关常量（INITIAL_VERSION、SESSION_STATUS、CONFLICT_STRATEGY、REPRACTICE_REASON、SYSTEM_TEACHER、BACKFILL_NOTE）: constants/versioning、utils/versioning、constructors、api、stores、pages 均有引用。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
