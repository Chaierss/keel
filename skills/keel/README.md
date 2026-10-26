# Keel · 龙骨

> **给项目装一副不会散架的脊梁。**
> 规则、组件、接口文档、Wiki 四件套收进同一个设置页，全部从仓库源文件自动生成；开发/线上模式决定内部事实给谁看；两个零依赖脚本把它们钉成门禁。

*A self-updating skeleton for software projects — see the English summary at the bottom.*

## 它治什么病

三个真实场景，每个都有人正在经历：

| 症状 | 真实代价 |
|---|---|
| 换一个 AI / 换一个人，就要把术语和禁令重讲一遍 | 每次半天，且解释得一次比一次不准 |
| 同一个卡片写了三遍，没人确定哪份是准的 | 改一次要改三处，漏一处就是线上样式不一致 |
| 文档写完就过期，三个月后没人敢信 | 等于没有文档，新人只能读代码 |

## 先看效果（30 秒，不用装）

用浏览器打开 [`templates/preview/console-demo.html`](templates/preview/console-demo.html)，双击即可，无网络依赖。

**点左下角的模式徽章**：

- 开发模式：未登记告警条、组件源码路径、"待下架"清单全都在。
- 线上模式：这些全部消失，接口文档整块变成"仅内网可达"。

这个切换就是本项目的核心——不是做四个文档页，是给内部事实装一个开关。

## 安装

```bash
# 任何支持 Agent Skills 规范的 agent（Claude Code / Cursor / Codex / Trae / Windsurf…）
npx skills add chaierss/keel -g

# Trae
# 设置 → 技能与命令 → 创建 → 上传含 SKILL.md 的 zip
# 或直接把本目录放进 %userprofile%/.trae-cn/skills/

# WorkBuddy
# 专家·技能·连接器 → 技能 → 添加技能 → 上传技能（zip）
```

## 里面有什么

| | 内容 |
|---|---|
| `SKILL.md` | 入口。五步落地、四件套判据、七条铁律、上线门禁 |
| `references/` | 12 篇：模式边界、四件套总纲、优雅原则、形态词汇表（11 布局 + 9 交互）、逐页实现、漏洞预检、15 分钟最小版、和现成方案的边界 |
| `templates/` | 可直接拷进项目的 `rules.json` / `components.json` / `wiki.json` / `devMode.ts` / 设置页外壳 |
| `scripts/` | `console-check.mjs`（四件套完整性体检）、`preflight-scan.mjs`（上线前漏洞扫描，17 条规则） |

两个脚本都是**零依赖、Node ≥ 18**，不需要 `npm install`。

## 权限与安全声明

审阅第三方技能时先看这一段，本项目也建议所有技能都写：

- **两个脚本只读文件**。不写入、不删除、不改动任何项目文件。
- **不发任何网络请求**。没有遥测，没有回连，断网可用。
- **不读取凭证**。只做文本模式匹配，命中的内容原样打印到终端，不外传。
- **无 `postinstall` / `preinstall`**，没有安装钩子。

`preflight-scan.mjs` 会扫出项目里的疑似密钥——它只报告位置，不会把内容发到任何地方。

## 和别的东西的分工

| | 它更强 | 本项目的定位 |
|---|---|---|
| Storybook | 组件隔离预览、交互控件、a11y | 我管**谁在用、谁该删、准入由谁守** |
| Docusaurus | 全文搜索、版本化、SEO | 我管**文档和代码同一次 PR**，不需要额外部署 |
| Notion / 飞书 | 编辑体验、非技术也能写 | 我管**可追溯**：谁在哪个 PR 改了这条规则 |
| Swagger | 接口文档事实标准 | 我不替代，我内嵌并解决同源 iframe / 主题 / 离线三个坑 |
| 设计品味类技能 | 审美与视觉输出 | 我管**项目内部事实的可访问性与准入门禁**，不管生成好看的界面 |

## 什么时候不该装

- 单人项目、生命周期少于 3 个月 —— 你自己读代码更快。
- 团队没有代码评审习惯 —— 门禁的前提是有人在意"未登记组件"。
- 只是想要一个好看的后台 —— 本项目不提供 UI 组件库。

## 目录结构

```
keel/
├── SKILL.md
├── LICENSE                  # MIT
├── README.md
├── references/              # 12 篇按需加载
├── templates/               # 拷进项目 keel/ 的骨架
│   └── preview/console-demo.html
└── scripts/                 # 零依赖可执行
    ├── console-check.mjs
    └── preflight-scan.mjs
```

## 来源

模式提炼自 [chaierss](https://github.com/chaierss)（Vue3 + Arco + FastAPI）的系统设置实现，但技能**不绑定该仓库、不绑定 Vue、不绑定 Python**。它约束"什么算合格"，落地手法按目标栈替换。

---

**English summary** — Keel gives a codebase a self-updating console with four single-source-of-truth surfaces: rules and terminology, a component registry with usage detection, API docs generated from code, and a wiki served straight from the repo. It adds a dev/prod visibility switch so internal debt stays internal, a vocabulary of page modes, testable elegance criteria, and a pre-release security gate. Two dependency-free Node scripts enforce it in CI. It does not replace Storybook, Docusaurus or Swagger — it covers the gap between them: who uses what, what should be deleted, and where the front door is. MIT licensed.
