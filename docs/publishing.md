# 上架与分发

三个渠道，三套动作。**先做 GitHub 仓库，再做 `npx skills`，最后做需要审核的平台**——顺序反了会在等待审核时无事可做。

## 0. 发布前自检

```bash
node tests/run-tests.mjs                 # 27 个用例全绿
node tools/package-skill.mjs --out dist/keel.zip
node skills/keel/scripts/preflight-scan.mjs --root . --dirs skills,tools,tests --strict
git tag v1.0.0 && git push --tags
```

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
- **Social preview 图**：1280×640，放架构图或演示页截图。
- **Releases**：每个 tag 附上 `dist/keel-<version>.zip`，让不会用命令行的人也能下载。
- **README 首屏**：一句话定位 + "30 秒演示" + 安装命令。**不要以"背景与动机"开头**。

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
2. 建开发者主页：头像 512×512、昵称 2–20 字、简介 20–120 字。
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

## 版本与更新

- 改完代码 → 改 `skills/keel/SKILL.md` 的 `version` → 更新 `CHANGELOG.md` → `node tools/package-skill.mjs`。
- 打 tag（`v1.0.1`），Release 附 zip。
- 平台上的包需要**重新上传**才会更新，没有自动同步。

## 分发渠道一览

| 渠道 | 动作 | 需要审核 | 能触达谁 |
|---|---|---|---|
| GitHub | push + tag + Release | 否 | 会用 git 的人 |
| `npx skills` | 结构对就行，无需注册 | 否 | Claude Code / Cursor / Codex / Trae 等 79 个 agent |
| WorkBuddy 市场 | 开发者主页 + 发布管理 | 是（三重） | WorkBuddy 用户 |
| Trae 技能 | 上传 zip 或放目录 | 视版本而定 | Trae 用户 |
| 自己发文章 | 讲一个具体问题，附仓库链接 | 否 | 最有效的冷启动 |
