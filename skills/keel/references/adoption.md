# 接入与体检

## 先判断项目阶段

阶段决定优先级，别把内部工具做成对外交付的样子。

| 阶段 | 特征 | 优先级 |
|---|---|---|
| 内部工具 / 单人 | 只有自己用，随时可改 | 模式 + 规则 即可；组件页可以晚点 |
| 团队协作 | 3 人以上，有 PR 评审 | 四件套全上，组件门禁是必需品 |
| 对外交付 | 客户会用，可能要私有化部署 | 线上模式的隐藏/脱敏是 P0，不是 P2 |

## 30 秒探测（接手陌生项目时）

```bash
# 1. 有没有设置中枢
grep -rl "系统设置\|Settings\|设置" src/ --include=*.vue --include=*.tsx | head

# 2. 有没有模式判定（还是散落的环境判断）
grep -rn "NODE_ENV\|import.meta.env.DEV\|process.env.DEBUG" src/ | wc -l

# 3. 四件套痕迹
ls keel/ docs/wiki/ 2>/dev/null
grep -rn "openapi\|swagger" --include=*.py --include=*.ts -l . | head

# 4. 组件是否统一出口
ls src/components/ui/index.ts src/components/index.ts 2>/dev/null
```

判读：

- 环境判断命中 **> 3 处**，且没有统一函数 → 模式这块是坏的。
- 组件清单靠人写、目录里有一堆没被引用 → 组件页是假的。
- 有 `docs/` 但前端读不到 → Wiki 等于没有。
- 有 swagger 但没有 Authorize → 接口文档"有但不能用"。

## 四步接入（每步独立可验收）

### 第 1 步：定模式（约半小时）

1. 建 `keel/console.config.json`（照抄 `templates/`）。
2. 加 `devMode.ts`（照抄模板，改构建变量名）。
3. 全局搜环境判断，全部换成 `isDev()`。
4. 界面加模式角标。

**验收**：搜 `NODE_ENV` 只剩 0 处；角标能说清来源。

### 第 2 步：建四件套骨架

先建文件，别先写页面：

```
keel/{console.config.json, rules.json, components.json, wiki.json}
docs/wiki/{README,architecture,backend,frontend,operations}.md
```

`rules.json` 里先写**三条**就够启动：

1. 一条页面形态（你的项目最独有的那个叫法，如"专注模式"）；
2. **P-01 设计优雅原则**（必带，十条判定条款见 `elegance.md`）；
3. **S-01 上线前漏洞扫描**（必带，见 `preflight.md`）。

后两条不是可选项。优雅原则定"什么叫做好"，上线门禁定"什么时候可以发"——缺了它们，其余规则都只是细节堆砌。

**验收**：四个文件都能被 JSON.parse 通过；`console-check.mjs` 跑出报告（此时会有一堆 missing，正常）；`rules.json` 里能搜到 `P-01` 与 `S-01`。

### 第 3 步：逐页实现（顺序不能换）

| 顺序 | 页面 | 为什么这个顺序 |
|---|---|---|
| 1 | 规则 | 它定术语，后面三页的文案才有共同语言 |
| 2 | 组件 | 依赖规则里的分层约定；也是唯一需要扫目录的 |
| 3 | 接口文档 | 通常只是嵌一个 iframe + 修安全头，最快见效 |
| 4 | Wiki | 最后做，因为它要给前三页写"地图" |

每页做完就过该页 reference 末尾的验收清单，别攒着。

### 第 4 步：挂门禁

```bash
node keel/console-check.mjs --strict
```

- 本地：`pre-commit` / `pre-push` 跑一次，未登记组件直接拦。
- CI：加一个 job，`--strict` 退出码非 0 则失败。
- 开发模式页面：把报告里的 `unregistered` / `unused` 渲染成告警条。

**验收**：故意塞一个未登记组件，`--strict` 退出码为 1。

### 第 5 步：上线门禁（发布前必须）

```bash
node keel/console-check.mjs --strict      # 四件套完整
node keel/preflight-scan.mjs --strict     # 静态漏洞，error 清零
npm audit --audit-level=high                     # 依赖（或 pip-audit）
node keel/preflight-scan.mjs --include-dist  # 构建产物无密钥
```

然后人工过五项：越权 IDOR、权限只做在前端、业务逻辑绕过、文件上传、SSRF。六步全绿才切线上模式。

**为什么顺序是"先扫、后关"**：切到线上模式后，告警条、源码路径、Swagger 全部隐藏，扫晚了一无所获。

**验收**：在测试分支上故意加一个 `apiKey = "sk-..."`，`--strict` 退出码为 1。

## 体检脚本

零依赖，Node ≥ 18，项目语言无关（只读文本）。

```bash
node keel/console-check.mjs                    # 人读报告
node keel/console-check.mjs --strict           # 有 error 级问题则退出码 1
node keel/console-check.mjs --json             # 机器可读，给页面/CI 用
node keel/console-check.mjs --root ../proj     # 指定项目根
```

检查项：

| ID | 级别 | 内容 |
|---|---|---|
| MODE-01 | error | `keel/console.config.json` 存在且合法 |
| RULE-01 | error | `rules.json` 可解析，含 `version` 与 `pageModes`/`rules` |
| RULE-02 | error | 规则 `id` 唯一、必填字段齐全、`category`/`severity` 合法 |
| RULE-03 | error | 术语词条含 `definition` / `signal` / `avoid`（缺 `avoid` 记 warn） |
| COMP-01 | error | 注册表每条 `path` 真实存在 |
| COMP-02 | error | 目录里的组件全部已登记（否则列出未登记文件） |
| COMP-03 | warn | 声明了 `demo` 但文件不存在 |
| COMP-04 | warn | 已登记但未被任何文件引用（候选下架） |
| WIKI-01 | error | `wiki.json` 里每个文件存在且非空 |
| WIKI-02 | warn | 目录里有多余的 `.md` 未登记 |
| API-01 | info | 探测到 OpenAPI 生成入口（仅提示，不判定） |

`--strict` 只让 **error** 级失败。未使用组件是 warn —— 它需要人判断，不能让 CI 替你决定删不删。

## 常见坑（按主题）

| 坑 | 表现 | 解法 |
|---|---|---|
| 组件扫描用了框架特性 | React 项目里硬套 `import.meta.glob` | 扫描放构建/体检脚本里，用 `fs`，框架无关 |
| 预览靠巨型 switch | 新增组件必须改预览文件 → 永远漏 | 同目录 `*.demo.*` 自动发现 |
| 深度链接丢状态 | 分享 `?tab=components` 打开是规则页 | tab 由 URL query 驱动，优先级高于本地状态 |
| 切 tab 重新加载 | 每次切回都重新请求、丢筛选 | 同容器 `KeepAlive` / 状态提升 |
| 线上包能用 `?mode=dev` | 内部结构裸奔 | 升权必须过权限校验 |
| Wiki 缓存 | 改了看不到 | 服务端 `no-store` + 前端 `cache: 'no-store'` 双保险 |
| 规则页文案与 JSON 不一致 | 页面写死了一段说明 | 页面禁止内联文案，全部来自数据 |
| 文档打进 bundle | 改文档要发版 | 运行时挂载，不进构建产物 |
| 设置做成弹窗 | 不能深链、刷新丢、无法分享 | 做成整屏路由页 |

## 交付前总检查

- [ ] 四件套四页都在，且都在设置中枢里（不是一个散落在顶栏、一个在弹窗）
- [ ] 每页都能回答"改了源文件之后它为什么自动变"
- [ ] `console-check.mjs --strict` 退出码 0
- [ ] 线上形态过一遍：无告警条、无源码路径、无堆栈、`/docs` 关
- [ ] 导出规则 Markdown，找一个没读过代码的 agent，问它"专注模式是不是全屏"——答对才算过
- [ ] 新增一个组件，走五步，全程没改任何已存在的文件
