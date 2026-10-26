# Keel · 龙骨

**给项目装一副不会散架的脊梁。**

[![license](https://img.shields.io/badge/license-MIT-0f172a)](LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-0f172a)](https://nodejs.org)
[![skill](https://img.shields.io/badge/agent%20skill-SKILL.md-4f46e5)](skills/keel/SKILL.md)
[![tests](https://img.shields.io/badge/tests-27%20passing-16a34a)](tests/run-tests.mjs)

[English →](README.md)

规则、组件、接口文档、Wiki 四件套收进同一个设置页，全部从仓库源文件自动生成、禁止手写副本；**开发模式 / 线上模式**决定这些内部事实给谁看；两个零依赖脚本把它们钉成门禁。

> 龙骨是船底那根贯穿首尾的脊梁。它不生成动力、不挂帆、在甲板上看不见——但整条船靠它不散。

**先看效果（30 秒，不用装）**：浏览器打开 [`skills/keel/templates/preview/console-demo.html`](skills/keel/templates/preview/console-demo.html)，双击即可，无网络依赖。点左下角的模式徽章切换开发/线上。

## 它治什么病

| 症状 | 真实代价 |
|---|---|
| 换一个 AI / 换一个人，就要把术语和禁令重讲一遍 | 每次半天，且解释得一次比一次不准 |
| 同一个卡片写了三遍，没人确定哪份是准的 | 改一次要改三处，漏一处就是线上样式不一致 |
| 文档写完就过期，三个月后没人敢信 | 等于没有文档，新人只能读代码 |

## 你会得到什么

![Keel 数据流：仓库源文件 → 设置页四件套 → 模式开关 → 上线门禁](docs/assets/architecture.svg)

四件套各有一个唯一真相源。**「自动更新」只在三个条件同时成立时才成立**：真相源在仓库里、页面只读它、改它不需要第二步。缺一条，你就又写了一份会过期的文档。

| 项 | 唯一真相源 | 凭什么不落后于代码 |
|---|---|---|
| 规则 | `keel/rules.json` | 页面直接读同一份；同一份还能导出 Markdown 喂给 AI |
| 组件 | `keel/components.json` + 目录扫描 | 注册表说「批准了哪些」，目录说「实际有哪些」，对不上就报 |
| 接口文档 | 后端框架生成的 OpenAPI | 不存在手写接口清单这一步 |
| Wiki | `docs/wiki/*.md` | 直接挂仓库文件，无缓存、无搬运 |

然后两个脚本把它变成门禁：

```bash
node keel/console-check.mjs --strict     # 四件套完整、没有未登记组件
node keel/preflight-scan.mjs --strict    # 17 条安全规则，error 清零才允许发版
```

两个脚本都是**零依赖、只读、不发网络请求**——所以能被放进 CI，而不是靠自觉。

## 安装

```bash
# 任何支持 Agent Skills 规范的 agent（Claude Code / Cursor / Codex / Trae / Windsurf…）
npx skills add Chaierss/keel -g

# 或者克隆后装到指定 agent 的技能目录
git clone https://github.com/Chaierss/keel.git
node keel/tools/install-local.mjs --list
node keel/tools/install-local.mjs --target workbuddy    # 也支持 claude | trae | agents | all

# 或者打成可直接上传的 zip（根目录就是 SKILL.md）
node tools/package-skill.mjs
```

<details>
<summary>手动安装位置</summary>

| 平台 | 用户级 | 项目级 |
|---|---|---|
| WorkBuddy | `~/.workbuddy/skills/keel` | `.workbuddy/skills/keel` |
| Claude Code | `~/.claude/skills/keel` | `.claude/skills/keel` |
| Trae | `~/.trae-cn/skills/keel`（Windows）/ `~/.trae/skills/keel` | `.trae/skills/keel` |
| 开放约定 | `~/.agents/skills/keel` | `.agents/skills/keel` |

WorkBuddy 与 Trae 也可以直接用 `tools/package-skill.mjs` 产出的 zip 走上传弹窗。
</details>

## 15 分钟接入

不必一次做完四件套。先做规则 + 组件，接口文档继续用现成的 Swagger 顶着。

```bash
mkdir -p keel && cp skills/keel/templates/*.{json,ts} keel/
cp skills/keel/scripts/*.mjs keel/
node keel/console-check.mjs
```

然后按顺序来（跳步的代价：先做视觉、后补地基，四件套一定半残）：

1. **定模式** —— 一个判定函数、一个常驻模式角标、一份可见性矩阵。
2. **建四件套骨架** —— 先定唯一真相源在哪个文件，再写页面。初始规则必须含 `P-01`（设计优雅原则）与 `S-01`（上线前安全扫描）。
3. **逐页实现** —— 规则 → 组件 → 接口文档 → Wiki。顺序有讲究：规则定术语，后三页才有共同语言。
4. **挂门禁** —— `console-check.mjs --strict` 进 CI 或提交前钩子。
5. **发布前预检** —— 漏洞扫描 + 依赖审计 + 五项人工，全绿才切线上模式。

细节看 [`skills/keel/SKILL.md`](skills/keel/SKILL.md)，只想做一半看 [`references/quickstart.md`](skills/keel/references/quickstart.md)。

## 仓库结构

```
keel/
├── skills/keel/          # 技能本体，zip 打包的就是这个目录
│   ├── SKILL.md          # 入口：五步落地、四件套判据、七条铁律、上线门禁
│   ├── references/       # 12 篇：模式边界、优雅原则、形态词汇表、逐页实现、漏洞预检…
│   ├── templates/        # 可直接拷进项目的骨架 + 单文件交互演示
│   └── scripts/          # console-check.mjs / preflight-scan.mjs，零依赖
├── tools/
│   ├── package-skill.mjs # 打 zip（纯 Node 写 ZIP 字节，三平台一致、可复现）
│   └── install-local.mjs # 装到各 agent 的技能目录
├── tests/run-tests.mjs   # 27 个用例，夹具从 templates/ 生成
├── docs/                 # 架构决策、各平台发布手册、架构图
└── .github/workflows/    # 三版本 Node 自测 + 打包 + 不夹带私货
```

## 权限与安全声明

审阅第三方技能时先看这一段，本项目也建议所有技能都写：

- **两个脚本只读文件。** 不写入、不删除、不改动任何项目文件。
- **不发任何网络请求。** 没有遥测，没有回连，断网可用。
- **不读取凭证。** 只做文本模式匹配，命中的内容原样打印到终端，不外传。
- **无 `postinstall` / `preinstall`**，技能本体零依赖，没有 `node_modules`。

`preflight-scan.mjs` 会扫出项目里的疑似密钥——它只报告位置，不会把内容发到任何地方。
仓库里有一条用例逐字节验证「脚本跑完目录不变」（[`tests/run-tests.mjs`](tests/run-tests.mjs) 的「只读承诺」）。

## 和别的东西的分工

| | 它更强 | Keel 管什么 |
|---|---|---|
| Storybook | 组件隔离预览、交互控件、a11y | **谁在用、谁该删、准入由谁守** |
| Docusaurus | 全文搜索、版本化、SEO | **文档和代码同一次 PR**，不需要额外部署 |
| Notion / 飞书 | 编辑体验、非技术也能写 | **可追溯**：谁在哪个 PR 改了这条规则 |
| Swagger | 接口文档事实标准 | 不替代，内嵌它并解决同源 iframe / 主题 / 离线三个坑 |
| 设计品味类技能 | 审美与视觉输出 | **项目内部事实的可访问性与准入门禁**，不管生成好看的界面 |

它不是 UI 组件库，不是文档站生成器，也不是 linter。

## 什么时候不该装

- 单人项目、生命周期少于 3 个月 —— 你自己读代码更快。
- 团队没有代码评审习惯 —— 门禁的前提是有人在意「未登记组件」。
- 只是想要一个好看的后台 —— 本项目不提供 UI 组件。

## 参与开发

```bash
node tests/run-tests.mjs        # 27 个用例，零依赖，秒级
node tools/package-skill.mjs    # 打 dist/keel-<version>.zip
node tools/install-local.mjs --list
```

流程与提交规范见 [CONTRIBUTING.md](CONTRIBUTING.md)，设计取舍见 [docs/architecture.md](docs/architecture.md)，
上架各平台的步骤见 [docs/publishing.md](docs/publishing.md)。

## 已知局限

- **只有一个来源案例。** 从 Vue 3 + Arco + FastAPI 的项目里提炼，约束本身与栈无关，示例代码偏 Vue。
- **没有量化效果。** 还没有真实团队的 before/after 数据，现阶段所有收益都是设计论证。
- **静态扫描有盲区。** `console-check` 对动态 import、字符串拼路径会漏，必须有 false negative 的心理准备。
- **需求未经验证。** 是先解决自己的真问题，不是先做访谈。

## License

MIT © [chaierss](https://github.com/Chaierss)
