# 上架与分发

三个渠道，三套动作。**先做 GitHub 仓库，再做 `npx skills`，最后做需要审核的平台**——顺序反了会在等待审核时无事可做。

各平台要粘的文案（仓库 About、Topics、市场卡片、社交三条）已经写在 [launch.md](launch.md)，直接取用，不要临场编。

## 0. 发布前自检

```bash
node tests/run-tests.mjs                 # 36 个用例全绿
node skills/keel/scripts/preflight-scan.mjs --root . --dirs skills,tools,tests --strict
git tag v2.0.0 && git push --tags
```

只有在要往「上传技能」的平台（WorkBuddy、Trae）发布时，才需要 `node tools/package-skill.mjs` 打个包：

```bash
node tools/package-skill.mjs --out dist/keel.zip
```

GitHub 从来不需要这个包——`npx skills add` 读的是仓库本身。zip 只在没法从仓库直接装的地方才有意义。

zip 的三条硬性要求，任何一条不满足都会导致"上传成功但用不了"：

1. **`SKILL.md` 在 zip 根目录**，不能多套一层 `keel/`。
2. frontmatter 的 `name` 与目录名一致，且只含小写字母、数字、连字符。
3. `description` ≤ 1024 字符，且**前 40 个字就要说清"什么时候用我"**——很多平台只展示这一段。

## 1. GitHub（所有渠道的基础）

仓库结构必须让 skill 可被机器发现。本项目采用 `skills/<name>/SKILL.md`：

```
keel/
├── skills/keel/SKILL.md    ← 技能在这里
├── tools/  tests/  docs/
└── .github/workflows/validate.yml
```

仓库设置里补齐这几项，转化率差别很大：

- **About**：描述一行 + Topics（`agent-skill` `claude-code` `cursor` `trae` `workbuddy` `design-system` `code-quality`）。
  现成的文案在 [launch.md](launch.md)，直接粘。
- **Social preview 图**：1280×640，用 [`docs/assets/social-preview.png`](docs/assets/social-preview.png)，上传位置在
  Settings → General → Social preview。**跳过这步，所有转发场景都显示 GitHub 默认灰图。**
- **Releases**：只放变更说明，**不挂 zip**。装技能走仓库，多挂一个压缩包只会让人以为必须下载它。
  正文由 `.github/workflows/release.yml` 调 `tools/release-notes.mjs` 从 `CHANGELOG.md` 生成，推 tag 即完成。
- **README 首屏**：一句话定位 + "30 秒演示" + 安装命令。**不要以"背景与动机"开头**。

### 在线演示（已启用）

```
https://chaierss.github.io/keel/skills/keel/templates/preview/console-demo.html
```

仓库里的 `.html` 点开只显示源码，所以「30 秒看效果」在仓库里是断的。Pages 直接静态服务整仓，路径与仓库一致，**不存在第二份副本**——改了 `console-demo.html`，线上演示跟着变。

**开启方式**：Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`。

**为什么不能自动开**：试过 `actions/configure-pages@v5` 的 `enablement: true`，它在 `configure-pages` 那一步失败——该参数需要 `administration` 权限，而 `GITHUB_TOKEN` 拿不到（只有 PAT 或 GitHub App 能给）。所以首次启用必须人工一次，之后永久不用管。

根目录那个 `.nojekyll` 不要删：它让 Pages 跳过 Jekyll 直接静态服务。没有它，Jekyll 会尝试处理整仓并可能把带下划线的路径吞掉，构建还会慢一倍。

## 2. `npx skills`（覆盖 79 个 agent）

Vercel Labs 的 `skills` CLI 会自动扫描仓库里的 `SKILL.md`，所以只要仓库结构对，用户一条命令就能装：

```bash
npx skills add Chaierss/keel            # 交互选择要装到哪个 agent
npx skills add Chaierss/keel -g         # 全局
npx skills add Chaierss/keel --list     # 只列出仓库里有哪些技能，不安装
```

发布方要做的事只有一件：**保证 `SKILL.md` 能被扫到、`name` 唯一**。多技能仓库（一个仓库多个 skill）也能被识别，用 `--skill <name>` 指定。

自测方法（发布前一定跑一次）：

```bash
npx skills add Chaierss/keel --list
```

如果列表里看不到 `keel`，先查 `SKILL.md` 是否在仓库里、frontmatter 是否合法（`node tests/run-tests.mjs` 里有这条用例）。

## 3. WorkBuddy

### 上传

1. 应用内：**专家·技能·连接器 → 技能 → 添加技能 → 上传技能**，选 `dist/keel-<version>.zip`。
2. 校验通过后会出现在技能列表，`name` 和描述来自 `SKILL.md` 的 frontmatter。

### 要发布到市场（开放平台）

1. 实名认证（个人或企业）。
2. 建开发者主页：头像用 [`docs/assets/icon-512.png`](docs/assets/icon-512.png)（512×512）、昵称 2–20 字、简介 20–120 字，**个人网站填 `https://www.chaierss.fun`**（审核会看
   主页是否真实存在，也是所有卡片上的署名落点）。
3. 发布管理 → 新建 → 上传技能包 → 选服务类目（1–5 个）。
4. 过三道审核：**安全扫描 → AI 审核 → 人工抽检**。

常见被拒原因，提前规避：

| 原因 | 规避方式 |
|---|---|
| 包里有多余目录（`assets/`、`docs/`） | 只有 `SKILL.md` / `references/` / `scripts/` / `templates/` 是约定目录，其余内容不会进包或被判为垃圾 |
| 描述里堆触发词 | 写清"什么时候用我"，不是"我能干一百件事" |
| 无 LICENSE | 仓库根放 LICENSE，技能目录也放一份 |
| 运行时联网 | 本技能不发请求，属于加分项；但要在描述里写明，否则会被默认为可疑 |

> **上架付费前必须确认一件事**：付费技能的运行环境是否还能读到用户本地文件。本技能的两个脚本价值全在"读用户项目"，如果付费版跑在拿不到文件权限的沙箱里，核心能力等于失效。这一点只能找平台确认，不要假设。

## 4. Trae

Trae 认两种位置：

- 项目级：`<项目>/.trae/skills/keel`
- 全局：`%userprofile%/.trae-cn/skills/keel`（Windows）

它同时支持开放约定 `.agents/skills/`。分发方式：**上传含 `SKILL.md` 的 zip**，或直接让用户把目录放进去。

`node tools/install-local.mjs --target trae` 会同时处理全局路径；项目级加 `--project <目录>`。

## 5. 一条命令装全（推荐给用户的自述）

README 里给三条命令就够了：`npx skills add`、`tools/install-local.mjs`、`tools/package-skill.mjs`。**不要列十种安装方式**——选择成本比安装成本高。

## 6. 可发现性：让别人搜得到

流量不来自「写得好」，来自「被搜到」。前两处决定 GitHub 站内能不能找到你。

### Topics（GitHub 搜索与推荐的主入口）

仓库首页右侧 ⚙️ → Topics，粘贴这一串（逗号分隔）：

```
agent-skill, ai-agents, claude-code, cursor, codex, trae, workbuddy, developer-tools, documentation, docs-as-code, design-system, component-registry, code-quality, security-scanner, single-source-of-truth
```

选词是三层结构，缺一层就少一类入口：

| 层 | 词 | 吃什么样的搜索 |
|---|---|---|
| 平台名 | `claude-code` `cursor` `codex` `trae` `workbuddy` | 「我在用 X，有没有好用的技能」 |
| 问题词 | `docs-as-code` `component-registry` `documentation` `code-quality` | 「我在解决什么问题」 |
| 品类词 | `agent-skill` `ai-agents` `single-source-of-truth` `developer-tools` | 逛分类页的人 |

不要为凑数塞无关热词——GitHub 会判滥用，而且点进来的人立刻划走，反而拉低推荐权重。

### Description 与 Website

一句话里要有「是什么 + 治什么病 + 关键约束」，不要只写名词。现成文案在 [launch.md](launch.md) 第一节，直接粘。

Website 填 `https://www.chaierss.fun`——它是所有卡片上的署名落点，也是审核时判断「这人是不是真的在做东西」的依据。

### npm keywords

`package.json` 的 `keywords` 与 Topics 保持同一套词。本包不发 npm，但 `npx skills`、各类市场爬虫与编辑器插件都读它做索引。

### 站外

- 给 `awesome-*` 列表提 PR（搜 `awesome ai agents`、`awesome claude code`），一次合并带来的长期流量高于一条推文
- 写文章时**主题是问题，不是项目**：「我为什么不再手写第二份文档」，末尾附仓库

## 版本与更新

- 改完代码 → 改 `skills/keel/SKILL.md` 的 `version` → 更新 `CHANGELOG.md` → 打 tag（`v2.0.0`）。GitHub 这边就结束了。
- **发版不打包**。Release 页只有变更说明，没有附件：装技能读的是仓库，zip 只在往 WorkBuddy / Trae 上传时才临时跑一次 `node tools/package-skill.mjs`。
- **Release 正文由 `CHANGELOG.md` 决定**：`.github/workflows/release.yml` 调 `tools/release-notes.mjs`，按 tag 版本号抽出对应段落，再加上安装命令与破坏性变更警示。`--generate-notes` 在纯本地直推、没有 PR 的仓库里只会输出一句 compare 链接，所以只作为兜底——CHANGELOG 里漏写当前版本时 workflow 会打一条 warning 并退回自动生成，不会卡住发版。
- 想本地先看正文长什么样：`node tools/release-notes.mjs 2.1.0 2.0.0`（可一次带多个版本，第一段用 `##`，后面的标「更早」）。跨大版本发版时把中间版本一起传进去，读的人才知道要不要迁移。
- 平台上的包需要**重新上传**才会更新，没有自动同步。也就是说：GitHub 一次推 tag 就完事，但平台上那份要人手动传。

## 分发渠道一览

| 渠道 | 动作 | 需要审核 | 能触达谁 |
|---|---|---|---|
| GitHub | push + tag + Release | 否 | 会用 git 的人 |
| `npx skills` | 结构对就行，无需注册 | 否 | Claude Code / Cursor / Codex / Trae 等 79 个 agent |
| WorkBuddy 市场 | 开发者主页 + 发布管理 | 是（三重） | WorkBuddy 用户 |
| Trae 技能 | 上传 zip 或放目录 | 视版本而定 | Trae 用户 |
| 自己发文章 | 讲一个具体问题，附仓库链接 | 否 | 最有效的冷启动 |
