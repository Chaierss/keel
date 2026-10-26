# 上线前漏洞扫描

## 先说一个反常识的结论

**"上线的时候扫一遍"这个动作，单独存在时几乎必然失效。**

因为它是一次性仪式：这次扫了，下次赶进度就跳过；扫完没人看报告；发现了问题但已经到发布窗口，于是"下个版本修"。

正确形态是：**它是一次可以重复执行的预检（preflight），平时在 CI 里跑，发布前再跑一次确认**。区别在于——平时跑，问题会在写代码的当天暴露，而不是在发布前两小时。

所以这份文档给的不是"上线检查清单"，是**一条能挂进流水线的门禁**。

## 四层扫描

| 层 | 查什么 | 工具 | 阻断级别 |
|---|---|---|---|
| L1 供应链 | 依赖漏洞、锁文件、通配版本 | `npm audit` / `pip-audit` / `cargo audit` | high 及以上必阻断 |
| L2 密钥与配置 | 硬编码密钥、.env 入库、前端产物含密钥 | `preflight-scan.mjs` | 必阻断 |
| L3 代码模式 | 注入、反序列化、XSS、关闭证书校验 | `preflight-scan.mjs` | 必阻断（部分误报可豁免） |
| L4 暴露面 | 文档页、调试端点、CORS、安全头、默认口令 | `preflight-scan.mjs` + 人工 | 必阻断 |

L5「权限与业务逻辑」工具查不出来，只能人工，见下面单独一节。

## 怎么跑

```bash
node keel/preflight-scan.mjs                  # 人读报告，恒为退出码 0
node keel/preflight-scan.mjs --strict         # error > 0 时退出码 1，CI / pre-release 用
node keel/preflight-scan.mjs --json           # 机器可读，接 dashboard 或评论到 PR
node keel/preflight-scan.mjs --include-dist   # 连 dist/ build/ 一起扫，查前端泄露的密钥
node keel/preflight-scan.mjs --dirs src,packages/api   # 覆盖扫描目录（monorepo / 后端在 backend 之外）
```

默认扫描目录来自 `keel/console.config.json` 的 `scanDirs`；没有配置时退化为「存在才扫」的 `src` / `backend` / `frontend` / `app` / `server` / `api`。
目录一个都不存在时脚本会扫 0 个文件——这种情况它判 **SEC-00 error**，而不是报「通过」。**扫 0 个文件的绿灯是假绿灯，比报错更危险**，所以脚本宁可拦住你。

## L1 供应链

```bash
npm audit --audit-level=high        # Node
pip-audit -r requirements.txt       # Python
cargo audit                         # Rust
govulncheck ./...                   # Go
```

三条纪律：

1. **锁文件必须提交**（`package-lock.json` / `poetry.lock` / `go.sum`）。没有锁文件，今天过的审计明天就变了。
2. **禁止通配版本**（`"lib": "*"`, `>=1.0`）。它会让构建不可复现，也让审计失去意义。
3. **不自动 `audit fix --force`**。它会引入大版本跳跃，把安全问题换成线上事故。该做的是单独排期升级。

## L2 密钥与配置

最常见的真实泄露，不是被黑客挖出来的，是**提交进仓库的**。

| 检查 | 说明 |
|---|---|
| 硬编码密钥 | `api_key = "sk-..."`、`password: "..."` 这类赋值 |
| 私钥文件 | `-----BEGIN PRIVATE KEY-----` |
| 云厂商特征 | `AKIA...`（AWS）、`sk-...`（OpenAI）、`ghp_...`（GitHub） |
| `.env` 是否入库 | 文件存在但没写进 `.gitignore` → 高危 |
| 前端产物含密钥 | 构建后 grep `dist/`。任何 `NEXT_PUBLIC_*` / `VITE_*` 都是公开的 |

**关键认知**：前端打包进去的"密钥"就是公开的。该走服务端代理，不是换个变量名。

## L3 代码模式

`preflight-scan.mjs` 覆盖的规则（详见脚本头部注释）：

| 类别 | 典型模式 | 危险原因 |
|---|---|---|
| 代码执行 | `eval(`、`new Function(`、`exec(` | 用户输入即任意代码执行 |
| 命令注入 | `shell=True`、`os.system(` | 拼接的命令串可被注入 |
| SQL 注入 | 字符串拼接 + `SELECT/INSERT/UPDATE/DELETE` | 参数化查询能解决 99% |
| 反序列化 | `pickle.loads`、`yaml.load(` 无 SafeLoader | 反序列化即 RCE |
| XSS | `innerHTML`、`v-html`、`dangerouslySetInnerHTML` | 标记为检查点而非一律禁止 |
| 关闭校验 | `verify=False`、`rejectUnauthorized: false`、`InsecureSkipVerify` | 中间人攻击 |
| 调试残留 | `DEBUG = True`、`breakpoint()`、`pdb.set_trace()` | 线上可被利用的入口 |

**这些是"检查点"不是"一律禁止"**。`innerHTML` 在对静态常量使用时没问题——所以脚本给 warn，需要人看一眼并在豁免清单里登记。

## L4 暴露面

| 项 | 合格标准 | 扫法 |
|---|---|---|
| 接口文档 | 线上关闭 `/docs`，`/openapi.json` 不对外 | 配置检查 + 发布后 curl |
| 调试端点 | 无 `/debug`、`/__test`、`/actuator` 暴露 | 路由清单人工过一遍 |
| CORS | 不用 `allow_origins=["*"]` 配 `credentials=True` | 脚本检测 |
| 安全头 | `X-Content-Type-Options`、`X-Frame-Options`、HSTS | 发布后 curl -I |
| 默认口令 | 无 `admin/admin`、`changeme` | 脚本检测 + 初始化流程检查 |
| 错误信息 | 线上不返回堆栈 | 模式开关（见 `modes.md`） |
| 目录列表 | 静态服务关闭 autoindex | 配置检查 |

## L5 工具查不出来的五件事（必须人工）

这一节比上面四层更值钱，因为**真实事故大多在这里**。

1. **越权（IDOR）**：接口有鉴权，但只验"登录了"，没验"这个资源是不是你的"。换一个 id 就能看别人的数据。
   查法：用 A 账号的 token 请求 B 账号的资源 id，应返回 403 而不是 200。

2. **权限只在前端**：按钮隐藏了，接口没校验。直接调接口就能越权。
   查法：前端隐藏的每个"危险按钮"，对应接口用无权限账号直接调。

3. **业务逻辑绕过**：优惠券能用两次、金额可以为负、状态机可以跳步。
   查法：把正常流程的请求重放一遍，改关键字段。

4. **文件上传**：只校验扩展名不校验内容；上传目录可执行；文件名路径穿越 `../`。
   查法：传一个 `.jpg` 但内容是脚本；传文件名带 `../`。

5. **SSRF**：接受用户提供的 URL 去请求（webhook、图片抓取、数据源连接）。
   查法：填 `http://127.0.0.1:22` 或内网地址，看是否被请求。

**这五项每项 5 分钟，比跑十个扫描器有用。**

## 与"切线上模式"的关系

发布顺序固定成这样，不许颠倒：

```
1. console-check.mjs --strict      四件套完整（内部债清零）
2. preflight-scan.mjs --strict     静态安全（error 清零）
3. 依赖审计                        high 及以上清零
4. 人工五项（L5）                   记录到发布说明
5. 构建产物扫描                    dist/ 里无密钥
6. 切线上模式 / 打 release tag
```

第 1 步在前，是因为四件套不完整时，你不知道自己漏了什么。第 6 步在最后，是因为模式一开，内部事实就看不见了——扫完再关。

## 误报怎么处理

新建 `.preflightignore`（放项目根），两种写法：

```
# 按规则豁免整个文件
SEC-09  src/lib/markdown.ts        # 这里渲染的是受信任的本地文档

# 按路径豁免全部规则
path: tests/fixtures/
```

**豁免必须写原因。** 没有原因的豁免等于关闭检测——三个月后没人敢删它，也没人知道为什么留着。

## 结果要归档、要能比

每次发布把 `--json` 结果存一份（`release/preflight-YYYY-MM-DD.json`），下次对比：

- 新增的 error → 必须先修
- 新增的 warn → 记录，排期
- 消失的 → 确认不是靠豁免"修"掉的

**只看当次报告，等于每次都从零开始。**

## 时间预算

小项目（< 5 万行）：全套 10 分钟。其中机器 2 分钟，人工五项 8 分钟。

如果你的预检要半天，说明你在做渗透测试，那应该请人专门做——但**日常门禁仍然要保留快速版**，否则一定会被跳过。

## 验收

- [ ] `preflight-scan.mjs --strict` 在 CI 里跑，且失败会真的挡住合并
- [ ] 仓库内 `git log --all -- '*.env'` 为空（历史上从未提交过）
- [ ] 构建产物 `dist/` 扫过一遍，无密钥特征
- [ ] L5 五项各做过一次，并记录了结果（不是"应该没问题"）
- [ ] `.preflightignore` 每条都有原因
- [ ] 发布说明里能看到本次的 error/warn 数量与豁免清单
