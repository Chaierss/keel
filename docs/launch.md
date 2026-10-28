# 发布文案包

**作者：chaierss · 主页：[www.chaierss.fun](https://www.chaierss.fun) · 仓库：[github.com/Chaierss/keel](https://github.com/Chaierss/keel)**

改完代码别急着发链接。**发布的第一屏是仓库卡片，不是 README**——很多人只看到标题 + 一句话 + 社交预览图就决定了要不要点。

这份文件里所有文案都可以直接粘，不用改。原则只有三条：

1. **先给具体事实，再给判断。**「17 条规则」「0 依赖」比「强大、优雅、高效」有用一百倍。
2. **每一句都要能被验证。** 说「不会过期」，就紧接着说清它凭什么不会过期。
3. **允许别人拒绝。** 主动写「什么时候不该装」，比吹十句更让人信。反向筛选是转化率的一部分。

## 一、GitHub 仓库卡片（最容易被忽略，也最影响点击）

**Description（≤350 字符，英文，显示在仓库名下面）**

```
A settings console that can't go stale: rules, a component registry, API reference and a wiki, each read straight
from the repo. Adds a visibility-boundary model and a release gate. Zero dependencies, read-only, no network.
By chaierss — https://www.chaierss.fun
```

**Topics**（8–12 个，决定能不能被搜到）

```
agent-skill  claude-code  cursor  trae  workbuddy  ai-agents
design-system  component-registry  documentation  developer-tools  preflight  code-quality
```

**Social preview**

上传 [`docs/assets/social-preview.png`](docs/assets/social-preview.png)（1280×640，含 `chaierss / www.chaierss.fun` 署名）。
设置位置：仓库 → Settings → General → Social preview → Upload image。

> 这一步很多人跳过，结果是分享到任何地方都显示 GitHub 默认灰图。**它是所有转发场景的唯一视觉。**

**仓库简介（中文版，发国内平台时用）**

```
一个不会过期的设置页：规则、组件注册表、接口文档、Wiki 各读一份仓库源文件；附可见性边界三层模型与上线前漏洞扫描门禁。零依赖、只读、不联网。作者 chaierss · chaierss.fun
```

## 二、WorkBuddy 市场卡片

发布入口：开放平台 → 发布管理 → 新建。审核是「安全扫描 → AI 审核 → 人工抽检」三道。

**昵称**（2–20 字）

```
Keel 龙骨
```

**一句话简介**（20–120 字，卡片上只显示这一句，最重要）

```
一个不会过期的设置页：规则、组件、接口文档、Wiki 各读一份仓库源文件，附可见性边界三层模型与上线前漏洞扫描门禁。
```

备选（更强调痛点，适合 A/B）：

```
让项目的规则、组件、接口文档、Wiki 不再靠手抄第二份——它们直接读仓库，两个零依赖脚本把它钉成发版门禁。
```

**详细介绍**

```
每个项目最后都会长出四类页面：项目规则、组件清单、接口文档、架构 Wiki。
它们几乎都是「手抄的第二份」，所以三个月后一定与代码分叉，然后没人敢信。

Keel 换了个做法：让这四页直接读仓库里的那一份源文件。
· 规则 ← keel/rules.json
· 组件 ← 注册表 + 目录扫描（注册表说批准了哪些，目录说实际有哪些，对不上就报）
· 接口文档 ← 框架生成的 OpenAPI，不手抄
· Wiki ← docs/wiki/*.md，无缓存挂载

再定一份可见性边界：未登记组件、源码路径、待下架清单这些内部事实，哪些产物该带它们、谁能打开、哪些字段不能给。
按后果分三层修——不好看就前端不渲染，泄露内部就服务端鉴权，收不回来就构建期剔除。不做模式开关，也没有角标。

两个脚本把上述约定变成门禁，零依赖、只读、不发任何网络请求，可以直接挂进 CI：
· console-check.mjs —— 12 项检查，四件套是否齐、有没有未登记组件
· preflight-scan.mjs —— 17 条安全规则，私钥/凭证/注入/反序列化/CORS/SSRF 等

附 SKILL.md + 12 篇 references + 可直接拷进项目的模板，以及一个双击就能打开的单文件演示页。
```

**服务类目**：开发工具 / 代码质量 / 文档与知识管理（选 1–3 个，别把 5 个都占满）

**头像**：直接用 [`docs/assets/icon-512.png`](docs/assets/icon-512.png)（512×512，深底龙骨符号，圆形裁切不会切到主体）。不要拿界面截图裁——小尺寸下会糊成一片。

## 三、Trae

**简介**

```
Keel 龙骨 —— 让项目的规则、组件、接口文档、Wiki 各读一份源文件，不再手抄第二份；附可见性边界三层模型与发版门禁。
```

安装：上传 `dist/keel-<version>.zip`，或放到 `.trae/skills/keel`。

## 四、社交媒体（三个角度，各发一条，别重复）

**角度 A · 反常识结论**（X / Twitter，英文）

```
Your internal docs go stale because they're a second copy of the truth.

keel makes all four read the source instead:
rules ← rules.json
components ← registry + dir scan
API ← OpenAPI
wiki ← the repo itself

+ a visibility boundary (artifact / identity / field) and a release gate.
0 deps, read-only, no network calls.
```

**角度 B · 真实事故**（即刻 / 小红书，中文）

```
同一张卡片在项目里被写了三遍，没人确定哪份是准的。改一次要改三处，漏掉的那处正好上线。

这是我做 keel 的起因：让「组件清单」这类内部页面直接读仓库，而不是维护第二份副本。
· 注册表说批准了哪些，目录说实际有哪些，对不上直接报错
· 未登记组件、源码路径这些内部债，只有该看的人看得到——靠构建期剔除和服务端鉴权，不是靠一个容易被忘掉的开关
· 两个零依赖脚本挂进 CI，只读、不联网

双击一个 HTML 就能看效果，不用装任何东西 👇
```

**角度 C · 一句命令可验证**（适合技术群、Reddit）

```
没打算说服你，先量一下你自己的项目（只读，不改任何文件）：

git clone --depth=1 https://github.com/Chaierss/keel keel-tmp
node keel-tmp/skills/keel/scripts/console-check.mjs --root .

它会告诉你：规则文件在不在、组件注册表有没有指向空文件、目录里有多少组件没登记、wiki 清单和实际文档差几篇。
看完再决定要不要装。
```

**Show HN 标题**

```
Show HN: Keel – internal docs that can't go stale (agent skill, zero deps)
```

HN 正文只写三件事：问题是什么、你为什么用这个方案、哪里可能不成立（把「已知局限」四条照抄过去，效果比自己吹好）。

## 五、冷启动顺序

不要一上来发仓库链接。顺序错了，第一波流量全部浪费：

1. **先回答问题。** 在社区里找「文档总是过期怎么办」「组件没人管」「多个 AI 接力开发怎么保证一致」这类真问题，认真回答，末尾附一句「我把它做成了技能」。
2. **再发可验证的东西。** 演示页 / 一条只读命令。让人零成本看到结果。
3. **最后发仓库。** 此时读者已经知道它是干什么的，点进来是来确认细节的。
4. **把「不适用」写在显眼处。** 单人小项目的人会因此不装，但会在评论区帮你说话。

## 六、不要做的事

- **不要写「最强」「革命性」「颠覆」。** 技术读者看到这类词会立刻降低信任，而且它不可验证。
- **不要在功能没做完时编造使用数据。**「数千开发者正在使用」被戳穿一次，项目就死了。
- **不要把 12 篇 references 全塞进市场简介。** 简介只有一次机会，说清「治什么病」就够。
- **不要在多个平台发一模一样的文案。** 至少换角度（上面三个角度就是为此准备的）。
- **不要刷 star。** 它对推荐算法的短期收益，比不上一次真实的技术讨论。
