# 15 分钟最小版

全量接入要半天。这个文档给一条**只装两件**的路径：先证明它有用，再决定要不要铺开。

## 先决定：要不要走最小版

| 你的情况 | 建议 |
|---|---|
| 单人项目、就想让设置页别散着 | 走最小版，做完规则 + 组件就停 |
| 3 人以上、有 PR 评审 | 走全量（`adoption.md` 四步） |
| 已经手写过接口清单 / 组件清单 | 走最小版，正好把清单换成真相源 |
| 只想先看看值不值 | 别装了，先打开 `templates/preview/console-demo.html` 看两分钟 |

**最小版只装两件：规则 + 组件。** 接口文档用现成的 Swagger iframe 顶上，Wiki 干脆不做——你的 README 还能撑一段时间。

## 第 1 分钟：建目录，拷三个文件

```bash
mkdir -p keel
cp <skill>/templates/console.config.json keel/
cp <skill>/templates/rules.json        keel/
cp <skill>/templates/components.json   keel/
cp <skill>/scripts/console-check.mjs          keel/
```

改 `console.config.json` 里的两个值，其余别动：

```jsonc
{
  "srcDir": "src",                    // 你的源码根
  "componentsDirs": ["src/components"] // 你的共享组件目录
}
```

暂时不建 `wiki.json`，体检脚本会报 WIKI-01 的 error，正常——这两件还没做。

## 第 2～6 分钟：写 5 条规则

打开 `rules.json`，删掉示例里用不上的，留下并改这 5 条：

| 留哪条 | 改成什么 |
|---|---|
| `P-01` 设计优雅原则 | 原样保留，这是底色 |
| `S-01` 上线前漏洞扫描 | 原样保留 |
| 一条 `pageModes` 词条 | 换成**你们项目最独有的那个叫法**（比如"专注模式"），五个字段全填 |
| 一条 `C-xx` 组件规则 | 改成"新增共享组件先登记"这类，`source` 指向刚建的 `components.json` |
| 一条 `E-xx` 工程约束 | 挑一条你们真实踩过坑的（不许写"要写注释"这种空话） |

写规则只有一条纪律：**`source` 必须指向真实文件**。指不出来的规则，一个月后没人敢执行。

> 5 条足够启动。**不要一次写 30 条**——写的人投入越多，越舍不得删，最后变成没人看的规章制度。

## 第 7～11 分钟：登记 5 个组件

挑**被引用最多**的 5 个共享组件（不是最漂亮的 5 个），在 `components.json` 里各加一条：

```jsonc
{
  "key": "button",
  "name": "按钮",
  "exportName": "Button",
  "layer": "base",
  "category": "按钮",
  "path": "src/components/ui/index.ts",
  "summary": "操作按钮统一出口；页面禁止直接 import UI 库。",
  "variants": ["primary", "secondary", "text"],
  "demo": "auto"
}
```

`summary` 用**"唯一实现"的句式**——写"资源列表的唯一卡片形态"，别人才知道不该再造一个；写"一个卡片，支持图标和状态"，他一定会再造一个。

然后给其中 2 个组件补上 demo 文件（同目录、同名 + `.demo`）：

```
src/components/ui/AppTag.vue
src/components/ui/AppTag.demo.vue   ← 页面自动渲染它，注册表里不用改
```

## 第 12～14 分钟：跑第一次体检

```bash
node keel/console-check.mjs
```

你会看到 `COMP-02` 列出所有**未登记**的组件。这一步的价值就在这：**你可能第一次知道自己项目里有 18 个共享组件。**

几条建议：

- 未登记的先别全补。**只补你真的会复用的**，剩下的就是候选删除名单。
- `COMP-03`（缺 demo）是 warn，可以暂时不管。
- `COMP-04`（0 引用）先看一眼：可能是动态 import 漏扫，别急着删。

## 第 15 分钟：做一个只有 3 个 tab 的设置页

```
系统设置
├── 规则        ← 读 rules.json，卡片列表 + 一个「复制 AI 上下文」按钮
├── 组件        ← 读 components.json + 渲染 *.demo.*，顶部一条未登记告警
└── 接口文档    ← 直接 <iframe src="/docs">（后端现成的 Swagger）
```

外壳可以照 `templates/SettingsConsole.skeleton.vue` 抄，注意三件事：

1. 用 `?tab=` 驱动，别用组件内部 state（否则分享链接打开是错的 tab）。
2. 容器不挂权限，权限下沉到每个 tab。
3. `fetch('/wiki/...')` 这类请求加 `cache: 'no-store'`。

模式（开发 / 线上）可以**这轮先不做**——等你发现"未登记告警被客户看到了"再加也不迟。

## 做到这里，你已经能看到效果

打开页面：规则是活的（改 JSON 就变），组件有真实预览，未登记的有名字。

**接下来什么时候该继续做？** 三个信号：

| 信号 | 说明该补什么 |
|---|---|
| 有人问"这功能怎么跑起来" | 补 Wiki（`references/wiki.md`） |
| 接口改了，前端同学还在翻旧文档 | 把 `/docs` 正式嵌进来（`api-docs.md`） |
| 出现"测试环境好好的，线上出问题" | 补可见性边界（`visibility.md`），先把哪些产物带什么定下来 |

## 最小版的三条禁忌

1. **不要一开始就做 Wiki。** 你还没确定代码结构，写出来的地图半年就过期。
2. **不要把 18 个组件全登记了。** 登记是背书，不是搬家。只登记你会复用的。
3. **不要先做视觉。** 先让 `console-check.mjs` 能跑通、能报错，再谈卡片好不好看。
