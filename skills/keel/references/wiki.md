# Wiki 文档

## 定义

**仓库里的 `.md` 文件，被应用以"改文件即生效"的方式渲染出来。**

三个要件缺一不可：

| 要件 | 具体做法 | 缺了会怎样 |
|---|---|---|
| 源文件在仓库 | `docs/wiki/*.md` 与代码同仓库、同 PR 审阅 | 文档在别处（飞书/Notion），改代码的人不知道要改它 |
| 运行时挂载 | 后端静态挂载该目录 | 文档被打进前端 bundle，改一个字要重新发版 |
| 禁缓存 | `Cache-Control: no-store` + 前端 `fetch(..., {cache:'no-store'})` | 改了看不到，开始怀疑人生 |

**Wiki 和"用户手册"不是一回事。** 这里的 Wiki 是给开发者看的代码地图：架构、后端地图、前端地图、运行与扩展。用户手册属于产品。

## 最小可用方案（别一上来就自建文档站）

```
docs/wiki/
├── README.md          # 总览与导航
├── architecture.md    # 整体架构与关键决策
├── backend.md         # 后端代码地图（哪个目录管什么）
├── frontend.md        # 前端代码地图
└── operations.md      # 怎么跑、怎么验证、怎么扩展
```

五篇就够。**目录结构 = 新人接手的路径**：先看架构，再按前后端分流，最后看怎么跑起来。

判据：**新人只靠这五篇，能不能把项目跑起来并改对第一个需求。** 不能，说明 `operations.md` 写得太省。

## 服务端挂载

```python
# FastAPI 示例：目录存在才挂，禁缓存
class NoCacheStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers['Cache-Control'] = 'no-store, must-revalidate'
        return response

if os.path.isdir(wiki_dir):
    app.mount('/wiki', NoCacheStaticFiles(directory=wiki_dir), name='wiki')
```

其他栈同理：Nest `ServeStaticModule`、Express `express.static` + 中间件覆写头、Go `http.FileServer`。

挂载路径与前端拉取路径必须一致（`/wiki/<file>.md`），别一个 `/docs` 一个 `/wiki` 混着来。

## 前端渲染

```ts
const res = await fetch(`/wiki/${activeFile}`, { cache: 'no-store' })
const html = marked.parse(await res.text())
```

三个细节：

1. **导航清单只在一处**（`wiki.json`）：文件列表、标题、排序。新增文档只加一行。
2. **链接拦截**：正文里的 `[架构](architecture.md)` 要在应用内切文件，不是整页跳走。用 `isWikiFile()` 判断，不认识的文件名忽略（保持当前页，不要跳 404）。
3. **渲染安全**：markdown 里的 HTML 要过消毒（`DOMPurify` 或 marked 的 sanitize 选项）。Wiki 虽然是内部文档，但它在应用同源下渲染，一个 `<script>` 就是 XSS。

## 导航清单

```jsonc
// keel/wiki.json
[
  { "name": "README.md",      "title": "总览与导航" },
  { "name": "architecture.md", "title": "整体架构" },
  { "name": "backend.md",      "title": "后端代码地图" },
  { "name": "frontend.md",     "title": "前端代码地图" },
  { "name": "operations.md",   "title": "运行、验证与扩展" }
]
```

体检脚本会校验：清单里每个文件真实存在、内容非空、目录里新增的 `.md` 有没有漏登记（漏登记 = 页面看不到 = 等于没写）。

## 与"规则页"的边界

两者容易混，划清楚：

| | 规则页 | Wiki |
|---|---|---|
| 回答什么问题 | **不许做什么、叫什么** | **东西在哪、怎么跑起来** |
| 形态 | 结构化数据（可筛选、可导出给 AI） | 长文（要读、可跳转） |
| 变更频率 | 低，但必须权威 | 高，随代码结构变 |
| 能否自动派生 | 能（JSON → Markdown） | 不能（要人写，但可脚本检查遗漏） |

规则里说的"不要直连 UI 库"是禁令；Wiki 里说"组件出口在 `components/ui/index.ts`"是地图。两者互相引用，但不重复内容。

## 反模式

| 反模式 | 后果 |
|---|---|
| 把 md 复制进前端 `public/` 或 `src/assets/` | 改文档要重新构建，等于失去了"自动更新" |
| 用 CMS/在线文档当唯一源 | 与代码不同步，且无法和 PR 一起审 |
| 目录里加文件但没登记清单 | 页面看不到，作者以为写了 |
| 每个模块写一篇，共 40 篇 | 没人读完；该合并成"代码地图"式目录说明 |
| 文档里贴大段代码 | 半年后与真实代码不一致；应该给路径 + 关键约定 |

## 验收

- [ ] 改 `docs/wiki/*.md` 一个字，刷新页面就变（不重新构建、不重启服务）
- [ ] 新增一篇 md + 清单加一行，导航里出现，正文链接能点进去
- [ ] 正文里的相对链接在应用内打开，不会整页跳走
- [ ] 断网第二次加载（浏览器缓存）仍拿到最新内容
- [ ] 新人只看这五篇能跑起来
