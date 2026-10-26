# 变更记录

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
这里的「破坏性变更」指**接入方已经拷贝走的文件**：改了 `rules.json` 字段结构、改了脚本退出码语义、删了模板文件，都算 major。

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
