# 变更记录

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
这里的「破坏性变更」指**接入方已经拷贝走的文件**：改了 `rules.json` 字段结构、改了脚本退出码语义、删了模板文件，都算 major。

## [2.0.0] — 2026-10-27

概念换掉，不是调整。1.x 的「开发模式 / 线上模式」被整套删除，因为那个词会把人骗到前端。

### 破坏性变更

- **删除 `templates/devMode.ts`**。接入方如果已经拷走，`resolveMode` / `isDev` / `useModeBadge` / `setMode` / `MODE_VISIBILITY` 全部不再提供。迁移表见 `references/visibility.md` 末节。
- **`references/modes.md` → `references/visibility.md`**，内容重写（96 行 → 约 130 行），旧文件名不再存在。
- **`console-check` 的 `MODE-01` 改名 `CFG-01`**。它原本只检查 `console.config.json` 是否存在、是否可解析，和「模式」没有关系——名不副实比没有检查更容易让人误以为已被守住。检查逻辑与退出码语义未变。

### 新增

- **可见性边界模型**：三层（产物 / 身份 / 字段）、四问（哪些产物、谁能开、哪些字段、最坏后果），力度由第 4 问决定——不好看只动前端、泄露内部必须动服务端、收不回来必须动构建期。
- 三种典型项目（桌面端 + web 双产物、纯 web 带 RBAC、纯内网）各自的边界写法示例，以及每种该修在哪一层。
- 「从 1.x 迁过来」对照表：角标删掉、`canElevate` 与 `?mode=dev` 删掉、`MODE_VISIBILITY` 按后果重新分三列。

### 变更

- **不做模式角标、不做切换**。形态由构建配置决定，读者身份由服务端鉴权决定，两者都不该变成一个页面上的小开关。
- 演示页把左下角徽章换成页面框外的「演示对照」，并写明**真实项目里没有这个开关**；`data-mode` 改为 `data-vis`，避免读者照着抄一个模式开关。
- `SettingsConsole.skeleton.vue` 去掉角标与 `canElevate` 属性，改为「容器不挂权限、权限下沉到每个 tab」的注释说明。
- 发版流程措辞从「切线上模式 / 打 tag」改为「打 tag / 发版」，并把人工项从五项扩到「五项 + 边界四问」。
- `docs/assets/architecture.svg` 第三列整列重画（模式开关 → 三层）。README 两份、`docs/architecture.md`、`docs/launch.md`、`references/` 全部换口径。

### 修复

- `SKILL.md` 铁律第 7 条原写「先扫、后关」——没有「关」这个动作了，改为「先扫、后发」：产物一旦出去就收不回来。
- 技能自己说过「模式管内部事实，权限管业务数据」，却在实现里把两者混成一个开关。这一版把两者彻底分开。

## [1.0.1] — 2026-10-26

门面版本。脚本行为一行未改，只解决一件事：第一次点进来的人，会不会装。

### 新增

- **`README.en.md`**：英文版独立成文件；`README.md` 改为**中文主版**。首屏顺序改成「标语 → 产品图 → 三种零安装入口」，完整版另加常见问题、目录结构、作者与 Star 引导。
- **`docs/assets/icon-512.png`**：512×512 技能图标（深底 + 龙骨符号），WorkBuddy / Trae 上架可直接用，圆形裁切不会切到主体。
- **全仓署名**：作者 `chaierss`、主页 `www.chaierss.fun` 写进 `package.json`（`author` / `homepage`）、两份 `LICENSE`、`SKILL.md` frontmatter、两份 README、市场与社交文案模板。

### 变更

- `docs/assets/social-preview.png` 重做为标准 **1280×640**，中文标语 + 产品截图 + 署名落款。原先是 1088×546，上传后会被平台二次裁切。
- 中文 README 与 English README 顶部互链，替代原先的 `README.md`（英）+ `README.zh-CN.md`（中）双文件方案。
- 用例数表述统一为 29（`CONTRIBUTING.md`、`docs/publishing.md` 原写 27）。

### 修复

- `docs/launch.md`、`docs/publishing.md` 里的社交预览图路径写成 `assets/social-preview.png`，实际文件在 `docs/assets/`——照文档操作会找不到图。
- `docs/launch.md` 的头像项原写「上架前需要单独设计一张」，等于发布流程缺一个必交物料；现已提供成品文件。

## [1.0.0] — 2026-10-26

首个可用版本。目标不是「一个文档页」，而是给项目装一副**可执行的门禁骨架**。

### 新增

- **技能本体 `skills/keel/`**
  - `SKILL.md`：五步落地、四件套「有 ≠ 能用」判据、七条铁律、上线门禁六步、验收清单。139 行，细节全部下沉。
  - `references/` 12 篇：模式边界、四件套总纲、设计优雅原则（10 条可判定问题 + 3 条不可越的线）、页面形态词汇表（11 布局 + 9 交互 + 选型决策树）、逐页实现 4 篇、漏洞预检、15 分钟最小版、接入四步、与同类方案的边界。
  - `templates/`：`rules.json`（含必带的 P-01 优雅原则与 S-01 上线门禁）、`components.json`、`wiki.json`、`console.config.json`、`devMode.ts`、`SettingsConsole.skeleton.vue`。
  - `templates/preview/console-demo.html`：单文件可交互演示，双击即开，无网络依赖，可切开发/线上模式与深浅色。

- **`scripts/console-check.mjs`** — 四件套完整性体检，零依赖。
  - 检查项：`MODE-01` 模式配置、`RULE-01~04` 规则与术语、`COMP-01~04` 注册表 / 未登记 / demo 缺失 / 未使用、`WIKI-01~02` 清单与孤儿文档、`API-01` OpenAPI 生成入口探测。
  - 组件使用检测三路命中：路径导入、具名导入、`manualUsage` 手工登记。
  - 参数：`--root` / `--strict` / `--json` / `--fail-on-unused`。

- **`scripts/preflight-scan.mjs`** — 上线前漏洞扫描，零依赖，17 条规则 + 文件级与产物级检查。
  - `SEC-01~17` 代码模式（私钥、硬编码凭证、云密钥特征、动态执行、命令注入、反序列化、关闭证书校验、XSS、调试残留、CORS 通配、SQL 拼接、默认口令、认证绕过、路径穿越、SSRF、安全头）。
  - `SEC-20~22` 文件级（`.env` 未忽略、缺 `.gitignore`、缺锁文件）、`SEC-30` 构建产物。
  - `.preflightignore` 豁免，每条必须写原因。

- **`tools/package-skill.mjs`** — 纯 Node 按 ZIP 规范写字节，产出根目录即 `SKILL.md` 的上传包；固定时间戳，同输入同字节，可复现。
- **`tools/install-local.mjs`** — 一条命令装到 WorkBuddy / Claude Code / Trae / 开放约定，支持用户级与项目级。
- **`tests/run-tests.mjs`** — 27 个用例，零依赖。夹具从 `templates/` 真实生成，模板写坏直接红；含一条逐字节验证「脚本只读」的用例。
- **CI** — Node 18/20/22 三版本自测、打包、用自家扫描器扫自己、拦 1MB 以上文件。
- `README.md`（英文）+ `README.zh-CN.md`（中文）、`CONTRIBUTING.md`、`docs/architecture.md`、`docs/publishing.md`、架构图 SVG。

### 变更

- 模板目录从 `assets/templates/` 提到根级 `templates/`。**这是上架硬阻塞**：WorkBuddy 只打包技能根级目录，`assets/` 下的内容不会进包，装完等于没有模板。
- `console-check.mjs --fail-on-unused` 现在**隐含 `--strict`**。原先单独使用时退出码仍是 0，是最坏的一类静默失守：以为挂了门禁，其实一直在放行。
- `preflight-scan.mjs` 新增 `--dirs`，覆盖 `console.config.json` 的 `scanDirs`，用于 monorepo 或源码不在 `src` 的项目。
- `preflight-scan.mjs` 扫到 0 个文件时判 `SEC-00` error。原先会报「通过」——目录配错时的假绿灯比报错更危险。
- `rules.json` 与 `components.json` 里的示例从 TS 常量改为 JSON，跨 agent、跨语言可读，不需要先编译。

### 修复

- `console-check.mjs` 与 `preflight-scan.mjs` 读取 JSON 时统一剥离 UTF-8 BOM。Windows 编辑器常写带 BOM 的文件，`JSON.parse` 会直接抛异常，等于整份规则读不出来。
- 演示页在 `data-mode="prod"` 初始状态下徽章仍显示「开发模式」，违反技能自己写的「刷新可保持」。
- 演示页状态标签使用了与业务标签不一致的带边框样式。
- `.preflightignore` 无法豁免根级 `.env`：`collectFiles` 只扫 `scanDirs`，未把根目录的 `.env` 系列纳入。
