# keel · 项目唯一真相源

这个目录是**Keel（龙骨）的唯一真相源**。任何 agent / 新同事接手项目，先读这里，再读代码。

## 里面有什么

| 文件 | 是什么 | 谁消费 |
|---|---|---|
| `console.config.json` | 扫描范围（源码目录、组件目录、wiki 目录） | 体检脚本 |
| `rules.json` | 项目规则 + 页面形态术语 | 设置页「规则」→ 也会被导出成 AI 上下文 |
| `components.json` | 前端组件注册表 | 设置页「组件」+ 体检脚本 |
| `wiki.json` | wiki 导航清单 | 设置页「Wiki 文档」 |
| `console-check.mjs` | 四件套完整性体检 | 本地钩子 / CI |
| `preflight-scan.mjs` | 上线前漏洞扫描 | 发布门禁 / CI |

接口文档**不在这里**：它的真相源是后端路由与类型定义，由框架自动生成 OpenAPI，页面直接内嵌。

## 三条不能破的约定

1. **改内容只改这里的文件**，页面里不写任何文案副本。页面出现与这里不一致的内容，视为 bug。
2. **新增组件必须登记 `components.json`**，否则体检脚本报错、设置页出告警条。
3. **改了源文件刷新就能看到**。如果需要"点一下同步"才能看到，说明管道断了，去修管道而不是加同步按钮。

## 日常命令

```bash
node keel/console-check.mjs           # 四件套体检
node keel/console-check.mjs --strict  # 提交前后跑，未登记组件直接拦
node keel/console-check.mjs --json    # 给页面 / CI 消费

node keel/preflight-scan.mjs          # 漏洞扫描报告
node keel/preflight-scan.mjs --strict # 发布前：error 必须为零
node keel/preflight-scan.mjs --include-dist  # 连 dist/ 一起扫，查前端泄露密钥
```

**发布顺序**：四件套体检 → 漏洞扫描 → 依赖审计 → 人工五项（越权/权限/逻辑/上传/SSRF）→ 产物扫描 → 切线上模式。顺序不可颠倒，详见 `references/preflight.md`。

## 加东西的流程

**加一条规则** → 改 `rules.json` 的 `rules` 数组 → 刷新设置页。注意填 `source`（指向真实文件），否则没人敢执行这条规则。

> 两条必带：**P-01 设计优雅原则**（判定"什么叫做好"）和 **S-01 上线前漏洞扫描**（判定"什么时候能发"）。删掉它们，其余规则都只是细节堆砌。

**加一个术语** → 改 `rules.json` 的 `pageModes`。四个字段别省：`definition`（是什么）、`signal`（怎么一眼认出）、`codeHint`（代码落点）、`avoid`（最容易混的说法）。旧称放进 `aliases` 保留，别删。

**加一个组件** → 写组件 → 同目录写 `Xxx.demo.vue` → 在 `components.json` 加一条。**不要修改任何已存在的文件**（这是设计是否成立的自检点）。

**加一篇 wiki** → 写 `docs/wiki/xxx.md` → `wiki.json` 加一行 → 刷新即可见。

## 为什么用 JSON 而不是 TS

跨 agent、跨语言可读。新接手的 agent 不需要理解 Vue/Python 就能读懂约束，脚本也不用解析源码。需要类型安全就加一层薄包装，但真相源仍是 JSON。
