# Keel · 龙骨

### 文档不会过期，因为它不是第二份。

中文 · [English](README.en.md)

<p>
  <a href="https://github.com/Chaierss/keel/actions/workflows/validate.yml"><img src="https://github.com/Chaierss/keel/actions/workflows/validate.yml/badge.svg" alt="validate"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f172a" alt="license"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%E2%89%A518-0f172a" alt="node"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/dependencies-0-16a34a" alt="dependencies"></a>
  <a href="https://www.chaierss.fun"><img src="https://img.shields.io/badge/website-chaierss.fun-16a34a" alt="website"></a>
</p>

每个项目最后都会长出四类页面：**规则、组件、接口文档、Wiki**。它们几乎都是「手抄的第二份」，三个月后一定和代码分叉，然后没人敢信。

Keel 换了个做法：这四页直接读仓库里的那一份源文件——没有副本，就没有「记得同步」这一步。再配两个零依赖脚本，把它钉成发版门禁。

<p><img src="docs/assets/console.png" width="800" alt="开发模式下设置页的组件页：注册表指标、未登记组件告警条、每张卡片的源码路径"></p>

<sub>同一个页面，两拨读者。开发模式看得见那个还没登记的组件、以及它躺在哪个文件里；点一下左下角的徽章，这些内部债整体消失——页面还是那个页面，代码还是那份代码。</sub>

## 30 秒看懂，什么都不用装

**看它长什么样。** 把 [`console-demo.html`](skills/keel/templates/preview/console-demo.html) 下的文件存到本地，双击打开——单文件、断网也能跑。GitHub 上直接点只会看到源码，记得点 **Raw** 再另存。打开后点左下角的模式徽章。

**量一下你自己的项目。** 只读，只告诉你缺什么，一个字节都不改：

```bash
git clone --depth=1 https://github.com/Chaierss/keel keel-tmp
node keel-tmp/skills/keel/scripts/console-check.mjs --root .
```

**装上。**

```bash
npx skills add Chaierss/keel -g
```

任何认 `SKILL.md` 的 agent 都能用：Claude Code、Cursor、Codex、Windsurf、Trae、WorkBuddy。手动安装路径与上传用的 zip 见 [docs/publishing.md](docs/publishing.md)。

## 它挡住的三种事故

| 症状 | 真实代价 |
|---|---|
| 换一个 AI、换一个人，术语和禁令要重讲一遍 | 每次半天，而且解释得一次比一次不准 |
| 同一个卡片写了三遍，谁都不确定哪份是准的 | 改一次要改三处，漏掉的那处正好上线 |
| 文档写完三个月就过期，没人敢信 | 等于没有文档，新人只能读代码 |

## 「不会过期」是可验证的，不是形容词

一个页面只有同时满足三件事才算自更新：**真相源在仓库里**、**页面只读它**、**改它不需要第二步**。缺任意一条，你就又写了一份会过期的文档。

| 页面 | 唯一真相源 | 凭什么不落后 |
|---|---|---|
| 规则 | `keel/rules.json` | 页面直接读这个文件；同一份还能导出 Markdown 喂给 AI |
| 组件 | `keel/components.json` + 目录扫描 | 注册表说「批准了哪些」，目录说「实际有哪些」，对不上就报 |
| 接口文档 | 框架生成的 OpenAPI | 不存在手写接口清单，也就没有可落后的东西 |
| Wiki | `docs/wiki/*.md` | 直接挂仓库文件，无缓存、无搬运 |

![数据流：仓库源文件 → 设置页 → 模式开关 → 发版门禁](docs/assets/architecture.svg)

## 门禁

```bash
node keel/console-check.mjs --strict     # 12 项检查：四件套齐、没有未登记组件
node keel/preflight-scan.mjs --strict    # 17 条代码模式规则 + 文件级与产物级检查
```

`console-check` 的分级只按「机器能不能确定」来切：文件不存在、规则 id 重复、注册表指向空——`error`；组件零引用、文档太短——`warn`。它不假装知道判断不了的事，而且**把「扫到 0 个文件」判成 error**，因为空扫描给的绿灯比红灯更危险。

`preflight-scan` 覆盖私钥入库、硬编码凭证、云厂商密钥格式、动态执行、命令注入、不安全反序列化、关闭证书校验、XSS 注入点、调试残留、CORS 通配、SQL 拼接、默认口令、鉴权绕过、路径穿越、SSRF，外加一个**每条豁免都必须写原因**的 `.preflightignore`。

两个脚本都不替代渗透测试。它们的存在是为了让最便宜的那 80% 到不了线上。

## 和别的东西的分工

| | 它更强 | Keel 管什么 |
|---|---|---|
| Storybook | 组件隔离预览、交互控件、a11y | **谁在用、谁该删、准入由谁守** |
| Docusaurus | 全文搜索、版本化、SEO | **文档和代码同一次 PR**，不需要额外部署 |
| Notion / 飞书 | 非技术同学的编辑体验 | **可追溯**：谁在哪个 PR 改了这条规则 |
| Swagger | 接口文档事实标准 | 不替代它，内嵌它并解决同源 iframe、主题、离线三个坑 |
| 设计品味类技能 | 审美与视觉输出 | **内部事实的可访问性与准入**，不是更漂亮的界面 |

它不是 UI 组件库，不是文档站生成器，也不是 linter。

## 权限与安全声明

装任何第三方技能前都该先读这一段，所有技能都该写这一段。

- **只读。** 两个脚本只读文件，不写入、不删除、不改动项目里任何东西。
- **不联网。** 没有遥测，没有回连，离线与内网 CI 都能跑。
- **不读凭证。** 只做文本模式匹配，命中的内容原样打在终端上，不外传。
- **无安装钩子。** 没有 `postinstall`，没有 `preinstall`，没有 `node_modules`——技能本体零依赖。

仓库里有一条用例**逐字节**验证这个承诺：两个脚本各跑一遍，比对每个文件的大小与 mtime（[`tests/run-tests.mjs`](tests/run-tests.mjs)）。这四条有一条不成立就是漏洞，披露方式见 [SECURITY.md](SECURITY.md)。

## 什么时候不该装

- 单人项目、活不过三个月——你自己读代码更快。
- 团队没有 code review 习惯——门禁的前提是有人在意「未登记组件」。
- 只是想要一个好看的后台——这里没有 UI 组件。

把「不适用」写在前面是故意的：不合适的人省下两天，合适的人反而更信。

## 常见问题

<details>
<summary><b>我的项目不是 Vue，能用吗？</b></summary>

约束是「什么算合格」，与栈无关；示例和模板偏 Vue 3 + Arco + FastAPI。落地手法按目标框架替换：React 换目录扫描的扩展名，后端换你框架的 OpenAPI 生成入口。
</details>

<details>
<summary><b>四件套必须一次做完吗？</b></summary>

不必。[`references/quickstart.md`](skills/keel/references/quickstart.md) 是 15 分钟最小版，只装规则 + 组件，接口文档先用现成的 Swagger 顶。半套也比分叉强。
</details>

<details>
<summary><b>它会改我的文件、读我的密钥吗？</b></summary>

不会。两个脚本只读；命中的疑似密钥只报位置，不打印内容、不外传。这条有逐字节用例守着，不是口头承诺。
</details>

<details>
<summary><b>为什么不自动修（<code>--fix</code>）？</b></summary>

那会打破「只读」这条唯一的信任基础。宁可输出一条可复制的命令，让你自己执行。
</details>

<details>
<summary><b>为什么不做 SaaS 版？</b></summary>

与「不发任何网络请求」直接冲突。将来真要做，也只能是完全独立的产品，不污染技能本体。
</details>

## 目录结构

```
skills/keel/              ← 技能本体，也就是装给你 agent 的那部分
├── SKILL.md              ← 入口：五步落地、四件套判据、七条铁律、上线门禁
├── references/           ← 12 篇按需加载，不占用入口上下文
├── templates/            ← 拷进项目 keel/ 的骨架
│   └── preview/console-demo.html
└── scripts/              ← 零依赖可执行（Node ≥ 18）
    ├── console-check.mjs
    └── preflight-scan.mjs

tools/  tests/  docs/     ← 本仓库的工具链，不随技能分发
```

## 参与开发

```bash
node tests/run-tests.mjs        # 29 个用例，零依赖，几秒
node tools/package-skill.mjs    # dist/keel-<version>.zip，根目录就是 SKILL.md
node tools/install-local.mjs --list
```

改动该落在哪个文件、为什么每条新扫描规则都必须配一个会红的夹具，见 [CONTRIBUTING.md](CONTRIBUTING.md)。设计取舍（包括被否掉的方案）见 [docs/architecture.md](docs/architecture.md)。

## 已知局限

- **只有一个来源案例。** 从 Vue 3 + Arco + FastAPI 的项目里提炼，约束本身与栈无关，示例偏 Vue。
- **没有量化效果。** 还没有真实团队的 before/after 数据，现阶段所有收益都是设计论证，不是实验结论。
- **静态扫描有盲区。** `console-check` 对动态 import、字符串拼路径会漏，请预期 false negative。
- **需求未经验证。** 是先解决自己的真问题，不是先做访谈。

## 作者

**chaierss** · 架构 / 全栈

主页 [www.chaierss.fun](https://www.chaierss.fun) · GitHub [@Chaierss](https://github.com/Chaierss) · 反馈 [Issues](https://github.com/Chaierss/keel/issues)

## License

[MIT](LICENSE) © 2026 [chaierss](https://www.chaierss.fun)

拿去用、改、商用、闭源分发都行，保留版权声明即可。

如果它替你省下过一次「这个组件到底能不能删」的解释，点个 Star，让下一个人也能搜到。
