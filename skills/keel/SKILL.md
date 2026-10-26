---
name: keel
version: 1.0.0
author: chaierss
agent_created: true
description: 给项目装一副自更新骨架 Keel（龙骨）——先用开发模式/线上模式划清信息边界，再把规则、组件、接口文档、Wiki 四件套放进设置页，全部从仓库源文件自动生成、禁止手写副本。附带页面形态词汇表（专注模式/沉浸模式/主从/画布等）、可判定的设计优雅原则、上线前漏洞扫描门禁，以及两个零依赖脚本。用在项目开荒、接手陌生代码、多个 AI 接力开发、发布前自查。触发词：keel、龙骨、开发模式、线上模式、设置页、系统设置、规则页、术语表、命名约定、设计模式、专注模式、沉浸模式、主从模式、组件统一管理、组件未使用、接口文档、wiki文档、自动更新、单一真相源、漏洞扫描、上线检查、项目体检。
description_zh: 给项目装一副自更新骨架：规则、组件注册表、接口文档、Wiki 四件套收进同一个设置页，全部从仓库源文件自动生成；用开发/线上模式决定内部事实给谁看，两个零依赖脚本钉成门禁。
description_en: A self-updating skeleton for software projects. Rules, a component registry, API docs and a wiki live in one settings console, all generated from repo sources. Adds dev/prod visibility modes, a page-mode vocabulary, testable elegance criteria and a pre-release security gate.
---

# Keel · 龙骨

> **龙骨**是船底那根贯穿首尾的脊梁。它不生成动力、不挂帆、在甲板上看不见——但整条船靠它不散。
>
> 这个技能就是项目的龙骨：规则定对错、术语定叫法、注册表定准入、门禁定何时能发。没有一条会多出一个业务按钮，缺一条项目就散架。

一个项目要能被**不同 AI、不同人**接力开发，必须先有三样东西：**模式边界、单一真相源、自更新骨架**。

技能做的事很具体：先在设置页装齐**规则 / 组件 / 接口文档 / Wiki** 四件套，四者全部从仓库源文件自动反映最新事实；再用**开发模式 / 线上模式**决定这些内部事实给谁看；最后用两个脚本把它们钉成门禁。

来源项目是 `chaierss`（Vue3 + Arco + FastAPI），但技能**不绑定该仓库、不绑定 Vue、不绑定 Python**。它约束"什么算合格"，落地手法按目标栈替换。

## 先看效果（30 秒，不用装）

打开 `templates/preview/console-demo.html`，双击即可。**点左下角的模式徽章**：

- 开发模式：未登记告警条、组件源码路径、待下架清单全都在。
- 线上模式：这些全部消失，接口文档整块变成"仅内网可达"。

这个切换就是技能的核心——不是做四个文档页，是给内部事实装一个开关。看完再决定要不要装。

## 它治的三个具体病

| 症状 | 真实代价 |
|---|---|
| 换一个 agent 就重新解释一遍术语 | 每次半天，且解释得一次比一次不准 |
| 同一个卡片写了三遍，谁都不确定哪份是准的 | 改一次要改三处，漏一处就是线上样式不一致 |
| 文档写完就过期，三个月后没人敢信 | 等于没有文档，新人只能读代码 |

## 五步落地（不许跳步）

跳步的代价：先做视觉、后补地基，四件套一定半残。

| 步骤 | 做什么 | 读哪份 |
|---|---|---|
| 1 | 定模式：一个判定函数 + 一个模式角标 + 一份可见性矩阵 | `references/modes.md` |
| 2 | 建四件套骨架：先定唯一真相源在哪个文件，再写页面。**初始规则必须含 P-01 优雅原则与 S-01 上线门禁** | `references/pillars.md`、`elegance.md` |
| 3 | 逐页实现：规则 → 组件 → 接口文档 → Wiki（顺序有讲究，规则定术语，后面三页才有共同语言） | `references/rules.md`、`components.md`、`api-docs.md`、`wiki.md` |
| 4 | 挂门禁：脚本体检 + CI/提交前钩子 | `references/adoption.md`、`scripts/console-check.mjs` |
| 5 | 发布前预检：漏洞扫描 + 依赖审计 + 五项人工，全绿才切线上模式 | `references/preflight.md`、`scripts/preflight-scan.mjs` |

只想先做一半？看 `references/quickstart.md`（15 分钟，只装规则 + 组件，接口文档先用现成 Swagger 顶）。

## 四件套的判据：**有 ≠ 能用**

每一行都要能回答"它凭什么不落后于代码"。

| 项 | 唯一真相源（必须在仓库里） | "自动更新"怎么成立 | 不合格的信号 |
|---|---|---|---|
| **规则** | 结构化数据文件 `rules.json` | 页面直接读同一份；另可导出 Markdown 给 AI | 页面里内联文案；改规则要同步改三处 |
| **组件** | 注册表 + 目录扫描 | 构建期扫描真实文件与注册表对比，**多出来的直接告警**；样式预览来自同目录 demo 文件 | 手写组件清单；预览是截图；没人知道哪些已废弃 |
| **接口文档** | 代码本身（路由 + 类型） | 框架生成 OpenAPI 并内嵌，**能填 token 试调** | 手写 Markdown 接口清单；有 Swagger 但没 Authorize |
| **Wiki** | 仓库里的 `.md` | 无缓存挂载 + 前端 `no-store`，**改文件刷新即生效** | 文档打进前端产物，改一句要重新构建 |

一句共同判据：**改动源文件后，页面不需要任何"同步文档"的额外动作就能看到新事实。** 需要第二步的，一律算违规。

## 七条铁律

1. **模式只有一个判定函数。** 全项目只有 `resolveMode()` 知道 dev 还是 prod，任何组件不得自己读 `NODE_ENV`。判定点一散落，切线上时必然漏掉第七处。
2. **四件套禁止手写副本。** 页面上每一条内容都要能追溯到一个仓库文件。手写清单是"过期"的唯一来源。
3. **规则页首先是给 AI 看的。** 验收标准不是"人觉得清楚"，而是"新 agent 只读导出的 Markdown 就不误解术语"。所以每条术语必须写清**它不是什么**。
4. **组件未登记就不存在。** 注册表是准入名单，不是说明书。目录里有、注册表没有 = 构建告警。
5. **接口文档只能由代码生成。** 判定"有文档"的标准是能授权试调，不是页面上有字。
6. **"优雅"必须能回答是/否。** 优雅不是好看，是"少了它会觉得不方便"。所有取舍过一遍十条判定问题，评审时不许用"我觉得"下结论。
7. **上线门禁不可跳过。** 顺序是"先扫、后关"——模式一开，内部事实就看不见了，扫晚了一无所获。

## 上线前门禁

```bash
node keel/console-check.mjs --strict        # 1 四件套完整
node keel/preflight-scan.mjs --strict       # 2 静态漏洞（17 条规则）
npm audit --audit-level=high                       # 3 依赖
# 4 人工五项：越权 IDOR / 权限只在前端 / 逻辑绕过 / 上传 / SSRF
node keel/preflight-scan.mjs --include-dist # 5 产物无密钥
# 6 切线上模式 / 打 tag —— 必须在最后
```

**"上线时扫一遍"单独存在时必然失效**：它是一次性仪式，赶进度时第一个被跳过。所以脚本得挂进 CI，平时就跑。

工具查不出的那五项才是真实事故集中地，每项 5 分钟，比跑十个扫描器有用。详见 `references/preflight.md`。

## 不要做的事

- ❌ 不要为四件套另做一套文档站 —— 两份必然分叉。
- ❌ 不要把设置做成弹窗 —— 四件套是页面级内容，需要深链、刷新保持。
- ❌ 不要用 `NODE_ENV` 当开发模式 —— 它表达构建方式，不表达"要不要给用户看内部事实"。
- ❌ 不要让组件预览靠巨型 `v-if` 列举 —— 新增组件得回去改预览文件，必然漏。用同目录 demo。
- ❌ 不要为了"优雅"砍掉正确性、可访问性、可维护性 —— 那三种情况该说"错了"，不是"不够优雅"。
- ❌ 不要写没有原因的 `.preflightignore` 豁免 —— 等于关掉检测。

## 验收

- [ ] `resolveMode` 之外没有第二处读环境变量做功能分支，界面上有模式角标且能说清来源
- [ ] 四件套每页都能回答"改了源文件之后，这里为什么会自动变"
- [ ] 组件页能列出**未登记**与**未被引用**两类名单
- [ ] 新增一个共享组件，不改任何已存在的文件，页面上就能看到它
- [ ] 导出规则 Markdown，交给一个没读过代码的 agent，它能正确使用"专注模式"这个词
- [ ] 初始 `rules.json` 含 **P-01 设计优雅原则** 与 **S-01 上线前扫描**
- [ ] 两个脚本 `--strict` 退出码为 0，`.preflightignore` 每条都写了原因

## 资源

**先看**
- `templates/preview/console-demo.html` — 单文件演示，双击打开，切换模式看差异
- `references/quickstart.md` — 15 分钟最小版（只装两件）
- `references/vs-alternatives.md` — 和 Storybook / Docusaurus / Notion 的边界，同类 agent 技能的分工，以及本项目的**已知局限**

**方法与约束**
- `references/modes.md` — 两种模式的定义 / 不是什么 / 可见性矩阵 / 角标 / 切换
- `references/pillars.md` — 四件套总纲、自动更新的三个成立条件、各栈实现对照
- `references/elegance.md` — 设计优雅原则：十条可判定条款、代价与收益的天平
- `references/adoption.md` — 四步接入、脚本用法、分阶段验收、按栈常见坑

**词汇表**
- `references/page-modes.md` — 11 种布局形态 + 9 种交互模式 + 选型决策树

**逐页实现**
- `references/rules.md` / `components.md` / `api-docs.md` / `wiki.md`

**发布**
- `references/preflight.md` — 四层机器扫描 + 五项人工检查

**模板（`templates/`，拷进项目 `keel/`）**
`devMode.ts` · `console.config.json` · `rules.json` · `components.json` · `wiki.json` · `README.md` · `SettingsConsole.skeleton.vue`

**脚本（`scripts/`，零依赖，Node ≥ 18）**
- `console-check.mjs` — 四件套完整性体检（`--strict` / `--json`）
- `preflight-scan.mjs` — 上线前漏洞预检，17 条规则 + `.preflightignore` 豁免
