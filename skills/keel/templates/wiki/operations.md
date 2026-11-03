# 运行、验证与扩展

## 本地启动

```bash
# 填写真实的安装与启动命令
npm install
npm run dev
```

## 验证

```bash
# 单元测试
npm test

# 四件套体检（未登记组件、Wiki 清单、目录登记、项目章程）
node keel/console-check.mjs --strict

# 上线前漏洞扫描
node keel/preflight-scan.mjs --strict
```

任何一步失败都不允许发版，先修再提交。

## 扩展示例

<!-- 写一条最短的「加功能」路径，让新人能照着做一个完整闭环。 -->

1. 新建组件 → 同目录 demo → 登记 `keel/components.json`
2. 新建页面 → 组合组件，不直连数据层
3. 接口改动 → 后端模型与路由即真相源，OpenAPI 自动更新
4. 结构变化 → 同一任务内更新 `docs/wiki/` 对应页与 `keel/structure.json`

## 发版顺序

四件套体检 → 漏洞扫描 → 依赖审计 → 人工五项（越权 / 权限 / 逻辑 / 上传 / SSRF）+ 边界四问 → 产物扫描 → 打 tag。

产物发出去就收不回来，扫描永远在打包之前。
