# 盲文点字学习训练器（braille-trainer）

纯前端盲文点字学习与练习工具：点阵字符卡片、听写练习、错题本、学习进度统计，数据保存在浏览器 IndexedDB。
**卡片采用不可变版本管理**：老师修正点字卡片后，后续练习使用新字形，没做完的会话继续按开始时的卡片出题，已交卷答题记录仍按当时内容解释；受影响的未完成课程自动重算并标出“待重练”；两位老师同时保存同一张卡片时双方版本都保留并标记冲突，待老师裁决；没有版本标识的旧数据首次加载自动兼容并回填“首次内容”。

## 快速启动（首选）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20111>

停止：`docker compose down`；重置浏览器本地数据：清除站点 IndexedDB（应用数据全部在浏览器本地）。

## 本地开发方式

```bash
cd frontend
npm install
npm run dev          # http://localhost:20111
npm run build        # 类型检查 + 生产构建到 dist/
npm run test:versioning  # 卡片版本化端到端逻辑校验（24 项断言）
```

## 卡片版本化行为说明（本次核心改动）

| 场景 | 行为 |
|---|---|
| 老师修正卡片字形 | 生成一条不可变版本快照（`BrailleSymbolVersion`），旧版本置 `SUPERSEDED`；仅改字形字段（cell_pattern/letter/pinyin/category/difficulty/audio_hint_key）才产生新版本，字形不变不重复发版 |
| 后续新练习 | `startPracticeSession` 始终冻结卡片**当前生效版本**的快照出题 |
| 没做完的会话 | 题干永远取会话开始时冻结的 `card_snapshots`，老师中途改卡也不变，页面提示“仍按开始时版本出题” |
| 已交卷记录 | `AnswerRecord.card_snapshot` 保存答题时字形，错题本按当时点位解释旧错误原因；卡片已更新的记录加“字形已更新·按旧版解释”标记（`superseded`） |
| 课程重算 | 每次卡片保存后重算：含该卡片且存在进行中会话的课程标记 `needs_repractice`（待重练），`stale_version_ids` 记录仍是旧字形的版本；学生按新字形重练覆盖后清除标记 |
| 两位老师同时保存 | 后保存者检测到基底版本已被取代：先保存者保持 `ACTIVE`，后保存者版本存为 `CONFLICT`，双方内容都不丢，卡片 `has_conflict=true` 并在“学习卡片”页给出冲突面板，老师选用其一后被选版本恢复 `ACTIVE`、另一版本保留为历史 |
| 旧数据（无版本标识） | 首次加载幂等回填：卡片补 v1（内容=首次内容）、会话补冻结快照与状态、答题记录补当时快照、课程补重练字段并重算；回填报告会在页面提示 |

种子数据（`mocks/seedData.ts`）自带演示场景：卡片 `a`（id=1）已从错误点位 v1 修正为 v2；会话 #1 已交卷冻结 v1；会话 #2 开始于修正前、仍在进行；课程 1 已被标记待重练；卡片 6/7、课程 3、会话 #3、记录 #5 是无版本标识的旧数据。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI（依赖保留）+ Zustand + IndexedDB |
| 路由 | 内置 hash 路由（`#/learn`、`#/practice`、`#/mistakes`、`#/progress`），Nginx `try_files` 兼容 history 方式 |
| 数据库 | 浏览器 IndexedDB（库名 `braille-trainer`，5 个 object store） |
| 部署 | Docker Compose（多阶段构建 + Nginx 静态托管） |

## 项目目录结构

```text
frontend/src/
├── api/                    # IndexedDB 异步读写封装，按模型分文件
│   ├── BrailleSymbol.ts / BrailleSymbolVersion.ts / Lesson.ts
│   ├── PracticeSession.ts / AnswerRecord.ts
├── db/                     # IndexedDB 连接、通用 CRUD、首次播种
│   ├── database.ts / stores.ts / seed.ts
├── services/               # 业务规则（事务边界）
│   ├── cardVersionService.ts      # 发布新版本 / 并发冲突检测 / 冲突裁决
│   ├── lessonRecalculation.ts     # 卡片更新后课程重算、待重练清除
│   ├── practiceSessionService.ts  # 会话开始冻结快照、判分、交卷、按当时版本解释
│   ├── legacyBackfill.ts          # 无版本标识旧数据的幂等兼容回填
│   └── dataRepository.ts          # 多实体打包读取/单事务提交
├── controllers/            # 控制器二次包装异常（ServiceError -> ControllerError）
│   ├── dataController.ts / cardController.ts
│   ├── practiceController.ts / lessonController.ts
├── stores/                 # Zustand：DataStore 单一数据源 + 四个实体 store 订阅同步
├── types/                  # 数据模型与枚举类型
├── constants/              # 枚举、日志模板、错误码、错误消息、状态文案
├── constructors/           # 默认对象 / 表单 / 响应 / 版本快照工厂（含旧数据 v1 工厂）
├── components/common/      # BrailleCell / LessonProgress / PracticePanel / ResultBadge /
│                           # ChartPanel / StatusBadge(VersionBadge,RepracticeBadge) / EmptyState / StatCard
├── hooks/                  # useBraillePattern / usePracticeSession / useIndexedDbStore
├── pages/                  # LearnPage / PracticePage / MistakesPage / ProgressPage
├── router/routes.ts
├── utils/                  # versioning(版本工具) / selectors / formatters / logger / ServiceError / ControllerError
├── mocks/seedData.ts       # 本地种子（含版本化与旧数据演示场景）
└── scripts/e2e-versioning.mts  # 版本化端到端校验脚本
```

## 数据模型与版本指针

- `BrailleSymbol`：卡片主表，冗余当前字形 + `current_version_id` / `current_version_no` / `has_conflict`。
- `BrailleSymbolVersion`（新增）：不可变版本快照，状态 `ACTIVE / SUPERSEDED / CONFLICT`，含 `parent_version_id`、`editor`、`note`、`created_at`。
- `PracticeSession`：`status`（IN_PROGRESS/FINISHED）、`card_snapshots: CardSnapshot[]`（开始时冻结）、`baseline_version_ids`、`editor`。
- `AnswerRecord`：`card_snapshot`（答题当时字形）、`superseded`（该题卡片此后是否已更新）。
- `Lesson`：`needs_repractice`、`stale_version_ids`、`recalculated_at`。
- `CardSnapshot`：会话/记录里冻结的版本内容副本，与版本表字段同源，即使将来版本行被清理也不影响历史解释。

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名与容器名前缀，默认 `braille-trainer`。
- `FRONTEND_PORT`：宿主机映射端口，容器内固定 80，默认 `20111`。

## Docker 部署说明

- 根 `docker-compose.yml` 不写 `version`，顶层 `name: braille-trainer`；容器名 `${COMPOSE_PROJECT_NAME:-braille-trainer}-frontend`；端口 `${FRONTEND_PORT:-20111}:80`。
- `frontend/Dockerfile` 为多阶段构建：Node 构建静态资源，最终用 Nginx 托管；`nginx.conf` 含 `try_files $uri $uri/ /index.html;`，任意目录名（含中文）均可构建启动。
- 纯前端应用无服务端数据库卷，学习数据在各浏览器的 IndexedDB 中，不随容器迁移。
- 常见问题：端口占用改 `.env` 的 `FRONTEND_PORT` 后 `docker compose up -d`；页面白屏先强制刷新确认静态资源；数据异常可在浏览器清除站点数据后重新播种。

## 枚举/常量出现位置清单

- **PracticeMode**（CELL_TO_TEXT/TEXT_TO_CELL/LISTENING/MIXED）：`constants/PracticeMode.ts`、`types/PracticeMode.ts`、`constructors/PracticeSessionConstructor.ts`、`PracticeSession.mode`（types/store）、`constants/logTemplates.ts`、`components/common/PracticePanel.tsx`（模式文案）、`pages/PracticePage.tsx`（模式筛选器）。
- **SymbolCategory**（LETTER/NUMBER/PUNCTUATION/CONTRACTION）：`constants/SymbolCategory.ts`、`types/SymbolCategory.ts`、`constructors/BrailleSymbolConstructor.ts`、版本快照工厂、`constants/logTemplates.ts`、`pages/LearnPage.tsx`（卡片筛选/字段展示）、种子数据。
- **MasteryLevel**（NEW/LEARNING/FAMILIAR/MASTERED）：`constants/MasteryLevel.ts`、`types/MasteryLevel.ts`、`constants/statusText.ts`、`pages/MistakesPage.tsx`（“标记已掌握”展示）。
- **SymbolVersionStatus**（ACTIVE/SUPERSEDED/CONFLICT，新增）：`constants/SymbolVersionStatus.ts`、`types/SymbolVersionStatus.ts`、`constants/statusText.ts`、`utils/versioning.ts`、`constructors/BrailleSymbolVersionConstructor.ts`、`services/cardVersionService.ts`、`constants/logTemplates.ts`、`constants/errorCodes.ts`（VERSION_CONFLICT）、`constants/errorMessages.ts`、`components/common/StatusBadge.tsx`（VersionBadge）、`components/common/ResultBadge.tsx`、`pages/LearnPage.tsx`（版本历史/冲突面板）、`pages/MistakesPage.tsx`、`pages/ProgressPage.tsx`、`utils/selectors.ts`、`mocks/seedData.ts`。
- **SessionStatus**（IN_PROGRESS/FINISHED，新增）：`constants/SessionStatus.ts`、`types/SessionStatus.ts`、`constants/statusText.ts`、`constructors/PracticeSessionConstructor.ts`、`services/practiceSessionService.ts`、`services/lessonRecalculation.ts`、`services/legacyBackfill.ts`、`pages/PracticePage.tsx`、`pages/ProgressPage.tsx`、`utils/selectors.ts`。
- **RepracticeStatus**（CURRENT/NEEDS_REPRACTICE，新增）：`constants/RepracticeStatus.ts`、`types/RepracticeStatus.ts`、`constants/statusText.ts`、`types/Lesson.ts`、`services/lessonRecalculation.ts`、`controllers/lessonController.ts`、`components/common/StatusBadge.tsx`（RepracticeBadge）、`components/common/LessonProgress.tsx`、`pages/PracticePage.tsx`、`pages/ProgressPage.tsx`。

写操作统一经 `utils/logger.ts` 渲染 `constants/logTemplates.ts` 的模板；异常经 `utils/ServiceError.ts`（service）与 `utils/ControllerError.ts`（controller）分层包装，错误码/消息集中在 `constants/errorCodes.ts`、`constants/errorMessages.ts`。

## 为什么会牵一发动全身

一次“老师改卡”要同时保证三种时间视角正确（新练习用新版、进行中会话用开始版、已交卷记录用答题版），改动必须贯穿：`types`（版本模型与版本指针）→ `constants`（版本/会话/重练枚举、日志模板、错误码与消息）→ `constructors`（版本快照工厂）→ `utils`（版本工具/选择器/格式化）→ `db + api`（版本表与事务）→ `services`（发版、冲突、重算、冻结出题、回填）→ `controllers`（异常包装）→ `stores`（统一数据源）→ 四个页面与共享组件。任何一层漏改都会让题目、错题解释或课程状态对不上历史，因此天然跨 3–5 个以上文件协同。

## License

MIT
