# 接口文档

## 判定标准：能试调才算有

三个必须同时成立：

| 判定 | 具体表现 | 只有一半的样子 |
|---|---|---|
| 由代码生成 | OpenAPI/类型定义从路由与模型自动产出 | `docs/api.md` 里手写"GET /users 返回列表" |
| 能授权试调 | 页面上有 Authorize，填 token 就能发真实请求 | 有 Swagger，但所有接口都是灰的 |
| 与代码同步 | 加一个路由，刷新文档就出现 | 每次发版要人肉更新接口清单 |

**"有 Swagger 页面"和"有接口文档"是两件事。** 前者是框架送的，后者要接上鉴权与数据。

## 各栈方案

| 栈 | 自动产出 | 注意 |
|---|---|---|
| FastAPI | 自带 `/openapi.json` + `/docs`（Swagger UI） | 用 `openapi_url=None` 才能在对外产物里彻底关掉 |
| NestJS | `@nestjs/swagger` + `SwaggerModule.setup` | 装饰器要写全，否则 schema 是空的 |
| Express/Koa | `swagger-jsdoc` 扫注释 | 注释会漂，优先用 zod→openapi 方案 |
| Go | `swag init` 生成 swagger.json | 需要 CI 里跑生成，否则忘记更新 |
| tRPC | 类型即文档 | 用面板渲染 procedure 树，不做 OpenAPI 转换 |
| Django | `drf-spectacular` | |

**共同点**：真相源是"路由 + 类型/模型"，不是任何 markdown。

## 展示：三件事让它不是摆设

直接把 Swagger UI 塞进 iframe 是"有文档"，不是"能用文档"。按优雅原则里最硬的两条——**渐进披露**和**一屏一个主动作**——重排成三块：

| 块 | 解决什么 | 不这么做会怎样 |
|---|---|---|
| **左：分组导航** | 按 tag 分组 + 计数，先缩小到一段再看 | 40 个接口平铺成一列，人只会用浏览器搜索 |
| **右：接口详情** | 方法 + 路径 + **这个接口的坑** + 参数表 + 响应示例 | 只复述字段名，等于把 schema 念了一遍，读者本来就能看到 |
| **下：试调** | token 已注入，一个按钮发出去，结果原地显示 | 「请到 Swagger 页面自行调试」= 没人调过 |

三条具体约定：

1. **说明写「踩坑点」，不复述字段名。** 「连接测试失败时返回业务码而不落库」有用；「name 是字符串」没用——那是 schema 的事。写不出来就留空，别用废话填。
2. **响应示例用真实信封**（`code / message / requestId / data`），别贴裸对象。前端照示例写解包，示例错了他就跟着错。
3. **试调区必须显示当前身份与 scopes**。看不到"我用谁的权限在调"，调出来的结果没意义。

接口数量少于 10 个时，左栏可以退化成一段分组标题 + 平铺——分组是给"找得到"服务的，不是给形式服务的。

## 内嵌到设置页：三个必踩的坑

### 1. 同源 iframe 被安全头拦掉

全局安全中间件通常下发 `X-Frame-Options: DENY` 或 `frame-ancestors 'none'`，内嵌自己项目的 `/docs` 也会被拒，页面一片空白且**控制台报的是"拒绝显示"**，容易误判成文档挂了。

```python
# 对 /docs 单独放行同源，其余保持 DENY
if path in ('/docs', '/redoc'):
    headers['X-Frame-Options'] = 'SAMEORIGIN'
```

### 2. 主题不同步

`/docs` 是独立文档，拿不到主应用的 `<html data-theme>`，会固定白底——深色主应用里嵌进去就是一块刺眼白斑。

解法：文档页自己读**同一个 localStorage key**，并监听 `storage` 事件。

```js
// 主应用与文档页共用 key：'app.theme'
const theme = localStorage.getItem('app.theme') || 'light'
document.documentElement.dataset.theme = theme
window.addEventListener('storage', e => {
  if (e.key === 'app.theme') document.documentElement.dataset.theme = e.newValue || 'light'
})
```

iframe 外层容器背景色要用令牌（`var(--color-bg-container)`），不要写死白——写死会在文档外围留一圈白边。

### 3. 外网 CDN 依赖

Swagger UI 默认从 CDN 拉 JS/CSS。内网、离线、或 CDN 抖动时整页空白，而业务系统看起来是好的，极难排查。

**把 swagger-ui 的静态资源下到仓库里自托管**（`vendor/swagger-ui/`），文档页指向本地路径。顺带能把默认皮肤换成项目设计系统（主色、圆角、字体），看起来不像外挂。

## 给 agent 用的那一份

`/openapi.json` 是**机器可读真相源**。除了渲染文档，它还是：

- 其他 agent 生成请求代码的输入（比读 markdown 准确一个量级）；
- 前端 SDK 生成器（`openapi-typescript`、`orval`）的入口；
- 接口变更 diff 的依据（CI 里存上一版对比，能发现破坏性改动）。

**所以：不要因为"线上不给人看"就把 `openapi.json` 一起关掉。** 正确做法是它挂在内网/受权限保护的路径上，Swagger UI 才关。

## 按边界决定它们给谁看

接口文档是**身份层**的典型：数据一旦发到浏览器，前端藏起来就没意义了。

| 项 | 内部（有权限） | 对外 |
|---|---|---|
| `/docs` Swagger UI | 开 | 关（`DISABLE_DOCS=1` → `openapi_url=None`） |
| `/openapi.json` | 开 | 内网可达 / 需鉴权 |
| 设置页「接口文档」tab | 显示 | 这个产物里不存在（构建期剔除）或返回 401 |

关掉的方式要**一个开关控两处**（路由 + schema），不要只关页面还留着 json。

## 反模式

| 反模式 | 后果 |
|---|---|
| 手写 `docs/api.md` 接口清单 | 三个月后与代码完全分叉，没人敢信 |
| 内嵌 `<img>` 截图当文档 | 改一个字段就要重新截图，且不能试调 |
| 把 Swagger UI 直接挂在一级菜单 | 它是给开发者用的，不是业务功能 |
| 只关 `/docs` 不关 `/openapi.json` | 表面关了，结构照样裸奔 |
| 用 `try it out` 打生产库 | 文档页必须能区分环境，或强制二次确认 |

## 验收

- [ ] 新增一个接口，刷新文档页就出现，没有手动步骤
- [ ] 接口按 tag 分组可找；说明写的是踩坑点而不是字段名复述
- [ ] 响应示例用的是统一信封，不是裸对象
- [ ] 点 Authorize 填 token，能真实调通一个带鉴权的接口
- [ ] 试调区显示当前身份与 scopes
- [ ] 主应用切深色，iframe 里的文档跟着变，没有白边
- [ ] 断网/CDN 挂掉，文档页仍能打开（资源已自托管）
- [ ] 无权限身份请求 `/docs` 返回 404/401，且 `/openapi.json` 同样挡住（不是前端看不见）
