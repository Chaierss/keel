# 参与开发

先谢过。这个仓库比一般技能项目多一层约束：**技能本体（`skills/keel/`）是交付物，其他目录是它的工具链**。改之前先分清你在改哪一层。

## 先跑一遍

```bash
git clone https://github.com/Chaierss/keel.git
cd keel
node tests/run-tests.mjs      # 30 个用例，零依赖，几秒
```

不需要 `npm install`，这个仓库没有依赖，也请保持没有依赖。

## 改什么去哪里

| 你想改 | 改这个文件 | 注意 |
|---|---|---|
| 技能的触发条件、能力描述 | `skills/keel/SKILL.md` 的 frontmatter | `description` 上限 1024 字符，塞不进的东西改用正文或 references |
| 落地步骤、铁律、验收清单 | `skills/keel/SKILL.md` 正文 | 200 行是硬上限，测试会拦。细节下沉到 `references/` |
| 某个概念的完整解释 | `skills/keel/references/*.md` | 必须被 `SKILL.md` 引用，否则测试红（孤儿文档 agent 永远读不到） |
| 拷进项目的初始规则/注册表 | `skills/keel/templates/*.json` | 测试会校验 JSON 可解析、初始规则含 `P-01` 与 `S-01` |
| 四件套体检逻辑 | `skills/keel/scripts/console-check.mjs` | 只有「机器能确定错了」的才是 error |
| 漏洞扫描规则 | `skills/keel/scripts/preflight-scan.mjs` 的 `RULES` | 加规则必须同时加反例用例，见下 |
| 演示页 | `skills/keel/templates/preview/console-demo.html` | 必须单文件、断网可用、不引外部资源（测试会拦） |
| 打包 / 安装工具 | `tools/*.mjs` | 零依赖，只用 `node:` 内置模块 |
| 测试 | `tests/run-tests.mjs` | 断言规则 id 和退出码，别断言中文措辞 |

## 加一条扫描规则

`preflight-scan.mjs` 的每条规则都必须能回答「误报了怎么办」。四步：

1. 在 `RULES` 数组加一条：`id` / `level` / `title` / `re` / `why` / `fix`（需要时加 `exts` / `unless` / `perFile`）。
2. 在 `tests/run-tests.mjs` 的 `VULN_PROJECT` 里加一个会命中的样本文件（或单开一个用例）。
3. 在 `tests/run-tests.mjs` 的期望列表里加上这个 id —— **不加就等于没加规则**。
4. 在 `references/preflight.md` 的规则表里补一行，说明危险原因。

`level` 的选择标准：

- `error` —— 命中基本等于真漏洞，必阻断（硬编码凭证、命令注入、关闭证书校验）。
- `warn` —— 可能是误报，需要人看一眼（`innerHTML`、SQL 拼接、路径穿越）。
- `info` —— 只是提示存在性（安全响应头）。

规则正则不要写得太宽。宁可漏报一条，也不要每天刷屏——**刷屏的扫描器会被整体关掉，那才是最大的漏报**。

## 加一种页面形态

页面形态（专注/沉浸/主从/画布…）是团队沟通用的词汇表，加一条等于给团队多一个共识。要求：

1. 在 `references/page-modes.md` 的表格里加：定义、适用场景、**代码信号**（靠什么特征认出它）、**不要怎么叫它**。
2. 在 `templates/rules.json` 的 `pageModes` 里加同样的内容（`avoid` 字段是必填，测试会查）。
3. 更新 `references/page-modes.md` 末尾的选型决策树——**一个新的形态如果进不了决策树，说明它和已有形态重复**。

判断标准很朴素：新同事听到这个词，能不能凭「代码信号」在十秒内判断这个页面属于哪种形态？不能就说明定义太虚。

## 提交规范

```
feat(scan): 新增 SEC-23 构建产物密钥扫描
fix(check): --fail-on-unused 单用时退出码仍是 0
docs(preflight): 补 --dirs 用法
test: 补 SEC-00 空目录用例
```

- 一个提交只做一件事，能单独回滚。
- 提交正文用中文写「为什么」，代码注释写「为什么」，不要写「做了什么」——diff 已经说了。
- 破坏性变更（改了脚本参数语义、改了 `rules.json` 字段结构）在提交正文里以 `BREAKING CHANGE:` 开头，并更新 `CHANGELOG.md`。

## PR 检查项

提 PR 前自查，CI 会跑同样的东西：

- [ ] `node tests/run-tests.mjs` 全绿
- [ ] `node tools/package-skill.mjs` 能成功打出 zip，且根目录是 `SKILL.md`
- [ ] `node skills/keel/scripts/preflight-scan.mjs --root . --dirs skills,tools,tests --strict` 通过
- [ ] 新加的行为有对应用例；修 bug 的 PR 带一个「不修就会红」的用例
- [ ] 没有引入任何运行时依赖（`skills/keel/` 下出现 `node_modules` 直接拒）
- [ ] 没有把密钥、内网地址、真实项目名带进来

## 不要做的事

- **不要给技能本体加依赖。** 它要能在一个只有 Node 的干净容器里跑起来。
- **不要把 `SKILL.md` 写长。** 它是入口不是手册，涨到 200 行就该拆。
- **不要在 `templates/` 里放业务逻辑。** 模板是骨架，读的人会以为那是约定。
- **不要给扫描器加需要联网的规则。** 内网环境和 CI 沙箱里都要能跑。
- **不要为了「覆盖更多场景」把 `description` 的触发词堆到两千字。** 触发词过多的技能反而不会被选中。

## 版本与发布

语义化版本，但这里的「破坏性」指**接入方的拷贝**：

- `patch` —— 文档修正、误报修正、措辞改进。
- `minor` —— 新增规则 / 新增形态 / 新增脚本参数，旧用法仍然有效。
- `major` —— 改了 `rules.json` 字段结构、改了脚本退出码语义、删了模板文件。

发布步骤：改 `skills/keel/SKILL.md` 的 `version` → 更新 `CHANGELOG.md` → `node tools/package-skill.mjs` →
打 tag（`v2.0.0`）→ 上传 zip 到各平台（见 `docs/publishing.md`）。

---

**English (short)** — Keep the skill dependency-free and `SKILL.md` under 200 lines; put detail in `references/`. Every
new scan rule needs a failing fixture in `tests/run-tests.mjs`, otherwise it is not really added. Run
`node tests/run-tests.mjs` before opening a PR. Commits follow `type(scope): summary`; explain *why* in the body.
