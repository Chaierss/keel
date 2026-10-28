#!/usr/bin/env node
/**
 * keel 自测 —— 零依赖，Node >= 18。
 *
 *   node tests/run-tests.mjs              跑全部
 *   node tests/run-tests.mjs preflight    只跑名字含 preflight 的用例
 *   node tests/run-tests.mjs --keep       保留 .tmp 夹具（排查用）
 *
 * 三条原则：
 *   1. 夹具从 templates/ 真实模板生成 —— 模板写坏了，测试直接红，不用等用户踩到。
 *   2. 只断言可判定的东西（退出码、规则 id、计数），不断言中文措辞，改文案不炸测试。
 *   3. 有一条用例专门验证「脚本只读」——这是本项目的安全承诺，必须被机器守着。
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')
const SKILL = join(REPO, 'skills', 'keel')
const TMPL = join(SKILL, 'templates')
const TMP = join(HERE, '.tmp')
const CHECK = join(SKILL, 'scripts', 'console-check.mjs')
const PREFLIGHT = join(SKILL, 'scripts', 'preflight-scan.mjs')

const posix = (p) => p.split('\\').join('/')

// ---------------------------------------------------------------- 迷你测试框架
const tests = []
const test = (name, fn) => tests.push({ name, fn })

function run(script, args = [], cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd: cwd || REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' }
  }
}

const checkJson = (root, extra = []) => {
  const r = run(CHECK, ['--root', root, '--json', ...extra])
  let data
  try {
    data = JSON.parse(r.stdout)
  } catch {
    throw new Error(`console-check --json 输出不是合法 JSON：\n${r.stdout}\n${r.stderr}`)
  }
  return { ...r, data, issues: data.issues, stats: data.stats }
}

const scanJson = (root, extra = []) => {
  const r = run(PREFLIGHT, ['--root', root, '--json', ...extra])
  let data
  try {
    data = JSON.parse(r.stdout)
  } catch {
    throw new Error(`preflight-scan --json 输出不是合法 JSON：\n${r.stdout}\n${r.stderr}`)
  }
  return { ...r, data, counts: data.counts, byRule: data.byRule }
}

const ids = (issues, level) => issues.filter((i) => i.level === level).map((i) => i.id)
const find = (issues, id) => issues.find((i) => i.id === id)

// ---------------------------------------------------------------- 写文件助手
function write(root, rel, content) {
  const abs = join(root, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content, 'utf8')
  return abs
}

function del(root, rel) {
  rmSync(join(root, rel), { recursive: true, force: true })
}

/** 模板文件原样拷进 keel/ —— 夹具与模板同源，模板一坏测试就红 */
function seedConsole(root, skip = []) {
  for (const f of ['console.config.json', 'rules.json', 'components.json', 'wiki.json']) {
    if (skip.includes(f)) continue
    write(root, `keel/${f}`, readFileSync(join(TMPL, f), 'utf8'))
  }
}

const WIKI_DOCS = {
  'README.md': '# 总览\n\n这份文档解释项目要解决的问题、当前边界，以及新人第一周该读什么。读完应能说清三个模块各自的职责。',
  'architecture.md': '# 整体架构\n\n前端壳层与业务视图分离，后端按领域切分。跨层调用只走契约层，禁止视图直连数据访问代码。',
  'backend.md': '# 后端代码地图\n\n接口层只做参数校验与信封封装，业务规则集中在领域服务，数据访问只出现在仓储层，避免散落。',
  'frontend.md': '# 前端代码地图\n\n页面只组合 patterns 层组件，UI 库经 ui/index 统一出口再导出，页面里不出现第三方组件库的导入语句。',
  'operations.md': '# 运行与验证\n\n本地启动、跑测试、跑 keel 体检、跑上线前扫描的命令都在这里。任何一步失败都不允许发版，先修再提交。',
}

const COMPONENTS = {
  'src/components/ui/index.ts': '// UI 库统一出口：页面只从这里取件，禁止直接 import 第三方组件库\nexport { Button } from \'@arco-design/web-vue\'\n',
  'src/components/ui/AppTag.vue': '<template><span class="tag" :class="`s-${tone}`"><slot /></span></template>\n<script setup lang="ts">\ndefineProps({ tone: { type: String, default: \'neutral\' } })\n</script>\n',
  'src/components/ui/AppTag.demo.vue': '<template><div class="row"><AppTag tone="info">运行中</AppTag></div></template>\n<script setup lang="ts">\nimport AppTag from \'./AppTag.vue\'\n</script>\n',
  'src/components/ui/Button.demo.vue': '<template><div class="row"><Button>保存</Button><Button variant="text">取消</Button></div></template>\n<script setup lang="ts">\nimport { Button } from \'./index\'\n</script>\n',
  'src/components/patterns/EntityCard.vue': '<template><article class="card"><slot /></article></template>\n<script setup lang="ts">\ndefineProps({ selected: Boolean })\n</script>\n',
  'src/components/patterns/EntityCard.demo.vue': '<template><EntityCard selected><AppTag /> 卡片</EntityCard></template>\n<script setup lang="ts">\nimport EntityCard from \'./EntityCard.vue\'\nimport AppTag from \'../ui/AppTag.vue\'\n</script>\n',
  'src/components/patterns/EmptyState.vue': '<template><div class="empty"><slot name="action" /></div></template>\n',
  'src/components/patterns/EmptyState.demo.vue': '<template><EmptyState /></template>\n<script setup lang="ts">\nimport EmptyState from \'./EmptyState.vue\'\n</script>\n',
  'src/components/visualization/GridCanvas.vue': '<template><div class="grid"><slot /></div></template>\n',
}

const APP_VUE = `<template>
  <div>
    <Button>新建</Button>
    <AppTag tone="success">运行中</AppTag>
    <EntityCard v-for="row in rows" :key="row.id" />
    <EmptyState v-if="!rows.length" />
    <GridCanvas v-else />
  </div>
</template>

<script setup lang="ts">
import { Button } from './components/ui'
import { AppTag } from './components/ui/AppTag.vue'
import { EntityCard } from './components/patterns/EntityCard.vue'
import { EmptyState } from './components/patterns/EmptyState.vue'
import { GridCanvas } from './components/visualization/GridCanvas.vue'

const rows: Array<{ id: string }> = []
</script>
`

/** 一个四件套齐全、组件全部已登记且都有引用的项目 —— 体检必须零 error 零 warn */
function healthyProject(name) {
  const root = join(TMP, name)
  rmSync(root, { recursive: true, force: true })
  seedConsole(root)
  for (const [rel, content] of Object.entries(COMPONENTS)) write(root, rel, content)
  for (const [rel, content] of Object.entries(WIKI_DOCS)) write(root, `docs/wiki/${rel}`, content)
  write(root, 'src/App.vue', APP_VUE)
  return root
}

// ---------------------------------------------------------------- console-check
test('healthy：四件套齐全时零 error 零 warn，--strict 退出码 0', () => {
  const root = healthyProject('healthy')
  const r = checkJson(root)
  assert.deepEqual(ids(r.issues, 'error'), [], `不该有 error：${JSON.stringify(ids(r.issues, 'error'))}`)
  assert.deepEqual(ids(r.issues, 'warn'), [], `不该有 warn：${JSON.stringify(ids(r.issues, 'warn'))}`)
  assert.equal(r.stats.coverage, 100)
  assert.equal(run(CHECK, ['--root', root, '--strict']).code, 0)
})

test('CFG-01：console.config.json 缺失时是 error（查的是配置就位，不是可见性边界）', () => {
  const root = healthyProject('no-config')
  del(root, 'keel/console.config.json')
  const r = checkJson(root)
  assert.equal(find(r.issues, 'CFG-01').level, 'error')
  assert.equal(checkJson(root, ['--strict']).code, 1)
})

test('COMP-02：目录里有、注册表没有的组件 → error 并点名文件', () => {
  const root = healthyProject('unregistered')
  write(root, 'src/components/ui/StrayButton.vue', '<template><button /></template>\n')
  const r = checkJson(root)
  const issue = find(r.issues, 'COMP-02')
  assert.equal(issue.level, 'error')
  assert.deepEqual(issue.items, ['src/components/ui/StrayButton.vue'])
  assert.equal(r.stats.coverage, 80)
})

test('COMP-04：已登记但无人引用的组件 → warn（默认不阻断，--fail-on-unused 才阻断）', () => {
  const root = healthyProject('unused')
  write(root, 'src/App.vue', APP_VUE.replace("import { EmptyState } from './components/patterns/EmptyState.vue'", ''))
  const r = checkJson(root)
  assert.equal(find(r.issues, 'COMP-04').level, 'warn')
  assert.deepEqual(find(r.issues, 'COMP-04').items, ['empty-state'])
  assert.equal(run(CHECK, ['--root', root, '--strict']).code, 0, 'warn 不该阻断')
  assert.equal(run(CHECK, ['--root', root, '--fail-on-unused']).code, 1, '--fail-on-unused 才阻断')
})

test('COMP-03：声明了 demo 但文件不存在 → warn', () => {
  const root = healthyProject('no-demo')
  del(root, 'src/components/ui/AppTag.demo.vue')
  const r = checkJson(root)
  assert.equal(find(r.issues, 'COMP-03').level, 'warn')
  assert.match(find(r.issues, 'COMP-03').items.join(), /app-tag/)
})

test('RULE-02：规则缺必填字段或 id 重复 → error', () => {
  const root = healthyProject('bad-rules')
  const rules = JSON.parse(readFileSync(join(root, 'keel/rules.json'), 'utf8'))
  rules.rules.push({ id: 'P-01', category: 'principle', severity: 'must', title: '重复 id' })
  write(root, 'keel/rules.json', JSON.stringify(rules, null, 2))
  const r = checkJson(root)
  assert.equal(find(r.issues, 'RULE-02').level, 'error')
})

test('rules.json 带 UTF-8 BOM 仍能解析（Windows 编辑器常见）', () => {
  const root = healthyProject('bom-rules')
  const raw = readFileSync(join(root, 'keel/rules.json'), 'utf8')
  writeFileSync(join(root, 'keel/rules.json'), '\uFEFF' + raw, 'utf8')
  const r = checkJson(root)
  assert.equal(find(r.issues, 'RULE-01').level, 'ok', 'BOM 不该让 JSON 解析失败')
  assert.deepEqual(ids(r.issues, 'error'), [])
})

test('RULE-03：页面形态缺 avoid 字段 → warn（最容易产生误解的字段）', () => {
  const root = healthyProject('no-avoid')
  const rules = JSON.parse(readFileSync(join(root, 'keel/rules.json'), 'utf8'))
  delete rules.pageModes[0].avoid
  write(root, 'keel/rules.json', JSON.stringify(rules, null, 2))
  const r = checkJson(root)
  assert.equal(find(r.issues, 'RULE-03').level, 'warn')
})

test('WIKI-01 / WIKI-02：清单指向不存在的文档是 error，目录里有未登记文档是 warn', () => {
  const missing = healthyProject('wiki-missing')
  del(missing, 'docs/wiki/backend.md')
  assert.equal(find(checkJson(missing).issues, 'WIKI-01').level, 'error')

  const orphan = healthyProject('wiki-orphan')
  write(orphan, 'docs/wiki/extra.md', '# 未登记\n\n这份文档在目录里但没进清单，页面看不到它，等于写给空气。'.repeat(2))
  assert.equal(find(checkJson(orphan).issues, 'WIKI-02').level, 'warn')
})

test('API-01：没检测到 OpenAPI 生成入口时是 info，不阻断', () => {
  const root = healthyProject('no-api')
  const r = checkJson(root, ['--strict'])
  assert.equal(find(r.issues, 'API-01').level, 'info')
  assert.equal(r.code, 0)
})

test('manifest：--json 输出可被程序消费（字段齐全）', () => {
  const root = healthyProject('manifest')
  const r = checkJson(root)
  for (const key of ['root', 'issues', 'stats', 'usage']) assert.ok(key in r.data, `缺字段 ${key}`)
  assert.ok(!r.data.root.includes('\\'), 'root 必须是正斜杠，否则前端拼路径会坏')
  assert.ok(r.data.usage.some((u) => u.key === 'entity-card' && u.count === 1))
})

test('只读承诺：两个脚本跑完，夹具目录逐字节不变', () => {
  const root = healthyProject('readonly')
  write(root, 'src/leak.js', 'const apiKey = "sk-abcdefghijklmnopqrstuvwxyz012345"\n')
  const snap = (dir) => {
    const out = []
    const walk = (d) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const abs = join(d, entry.name)
        if (entry.isDirectory()) walk(abs)
        else {
          const s = statSync(abs)
          out.push(`${posix(relative(root, abs))}|${s.size}|${s.mtimeMs}`)
        }
      }
    }
    walk(dir)
    return out.sort()
  }
  const before = snap(root)
  run(CHECK, ['--root', root, '--json'])
  run(CHECK, ['--root', root, '--strict'])
  run(PREFLIGHT, ['--root', root, '--json'])
  run(PREFLIGHT, ['--root', root, '--strict'])
  assert.deepEqual(snap(root), before, '脚本不得修改、新建、删除项目里的任何文件')
})

// ---------------------------------------------------------------- preflight-scan
const SAFE_PROJECT = {
  '.gitignore': 'node_modules/\ndist/\n.env\n.env.*\n',
  'package.json': '{ "name": "safe-project", "private": true }\n',
  'package-lock.json': '{ "lockfileVersion": 3, "packages": {} }\n',
  'src/app.js': 'export function add(a, b) { return a + b }\n',
}

const VULN_PROJECT = {
  'src/config.js': "export const apiKey = 'sk-abcdefghijklmnopqrstuvwxyz012345'\n",
  'src/run.js': 'export function run(code) { return eval(code) }\n',
  'src/view.vue': '<template><div v-html="userInput" /></template>\n',
  'src/cors.js': "export const cors = { origin: '*', credentials: true }\n",
  'src/auth.py': 'password = "admin"\n',
  'src/cmd.py': 'import subprocess\n\ndef run(cmd):\n    return subprocess.run(cmd, shell=True)\n',
  'src/load.py': 'import pickle\n\ndef load(raw):\n    return pickle.loads(raw)\n',
  'src/net.py': 'import requests\n\ndef fetch(u):\n    return requests.get(u, verify=False)\n',
  'src/db.py': 'def q(uid):\n    return "SELECT * FROM users WHERE id = " + uid\n',
  'src/debug.py': 'DEBUG = True\n',
}

function vulnProject(name, extra = {}) {
  const root = join(TMP, name)
  rmSync(root, { recursive: true, force: true })
  write(root, '.gitignore', SAFE_PROJECT['.gitignore'])
  write(root, 'package.json', SAFE_PROJECT['package.json'])
  write(root, 'package-lock.json', SAFE_PROJECT['package-lock.json'])
  for (const [rel, content] of Object.entries({ ...VULN_PROJECT, ...extra })) write(root, rel, content)
  return root
}

test('preflight：干净项目零 error 零 warn，--strict 退出码 0', () => {
  const root = join(TMP, 'pf-clean')
  rmSync(root, { recursive: true, force: true })
  for (const [rel, content] of Object.entries(SAFE_PROJECT)) write(root, rel, content)
  const r = scanJson(root)
  assert.equal(r.counts.error, 0)
  assert.equal(r.counts.warn, 0, `warn 也不该有：${JSON.stringify(r.byRule)}`)
  assert.equal(run(PREFLIGHT, ['--root', root, '--strict']).code, 0)
})

test('preflight：12 类漏洞夹具逐条命中，--strict 退出码 1', () => {
  const root = vulnProject('pf-vuln')
  const r = scanJson(root)
  const expected = ['SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06', 'SEC-08', 'SEC-09', 'SEC-10', 'SEC-11', 'SEC-12', 'SEC-13']
  const hit = expected.filter((id) => r.byRule[id])
  assert.deepEqual(hit, expected, `漏报：${expected.filter((id) => !r.byRule[id]).join('、')}`)
  assert.ok(r.counts.error >= 8, `error 应 >= 8，实际 ${r.counts.error}`)
  assert.equal(run(PREFLIGHT, ['--root', root, '--strict']).code, 1)
})

test('preflight：扫到 0 个文件判 error（假绿灯比报错更危险）', () => {
  const root = join(TMP, 'pf-empty')
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })
  const r = scanJson(root)
  assert.ok(r.byRule['SEC-00'], `期望 SEC-00，实际 ${JSON.stringify(r.byRule)}`)
  assert.equal(run(PREFLIGHT, ['--root', root, '--strict']).code, 1)
})

test('preflight：--dirs 覆盖扫描目录（monorepo 里源码不在 src）', () => {
  const root = join(TMP, 'pf-dirs')
  rmSync(root, { recursive: true, force: true })
  write(root, '.gitignore', 'node_modules/\n.env\n')
  write(root, 'packages/api/index.js', "const apiKey = 'sk-abcdefghijklmnopqrstuvwxyz012345'\n")
  const off = scanJson(root)
  assert.ok(off.byRule['SEC-00'], '默认目录下扫不到东西，应报 SEC-00')
  const on = scanJson(root, ['--dirs', 'packages'])
  assert.ok(on.byRule['SEC-03'], `--dirs 应能扫到 packages：${JSON.stringify(on.byRule)}`)
  assert.equal(on.byRule['SEC-00'], undefined)
})

test('preflight：SEC-20 提交了 .env 且未被忽略 → error', () => {
  const root = vulnProject('pf-env', { '.env': 'DB_PASSWORD=prod-secret-value\n' })
  // 覆盖成一份没忽略 .env 的 .gitignore —— 这正是真实项目最常见的翻车姿势
  write(root, '.gitignore', 'node_modules/\ndist/\n')
  const r = scanJson(root)
  assert.ok(r.byRule['SEC-20'], `期望 SEC-20，实际 ${JSON.stringify(r.byRule)}`)
})

test('preflight：SEC-21 缺 .gitignore → warn（不阻断）', () => {
  const root = vulnProject('pf-noignore')
  del(root, '.gitignore')
  const r = scanJson(root)
  assert.ok(r.byRule['SEC-21'])
  assert.equal(r.counts.error > 0, true, '本夹具还有别的 error')
})

test('preflight：.preflightignore 生效并计入 ignored（豁免必须留痕）', () => {
  const root = vulnProject('pf-ignore')
  write(root, '.preflightignore', 'SEC-03 src/config.js  # 测试用的假密钥，非真实凭证\nSEC-04 src/run.js  # 沙箱内执行用户脚本，已白名单\n')
  const r = scanJson(root)
  assert.equal(r.byRule['SEC-03'], undefined, 'SEC-03 应被豁免')
  assert.equal(r.byRule['SEC-04'], undefined, 'SEC-04 应被豁免')
  assert.equal(r.data.ignored.length, 2)
  assert.ok(r.byRule['SEC-05'], '未豁免的规则仍须命中')
})

test('两个脚本的 --help 都退出 0（CI 里被误调用不该失败）', () => {
  assert.equal(run(CHECK, ['--help']).code, 0)
  assert.equal(run(PREFLIGHT, ['--help']).code, 0)
})

// ---------------------------------------------------------------- 技能包自身
const SKILL_MD = readFileSync(join(SKILL, 'SKILL.md'), 'utf8')

test('SKILL.md：frontmatter 合法（name 与目录同名、必填字段齐、描述不超长）', () => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(SKILL_MD)
  assert.ok(match, 'SKILL.md 必须以 YAML frontmatter 开头')
  assert.ok(!SKILL_MD.startsWith('\uFEFF'), 'SKILL.md 不能有 BOM，某些 agent 会解析失败')

  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim()
  }
  assert.equal(meta.name, 'keel', 'name 必须等于技能目录名')
  assert.match(meta.name, /^[a-z0-9-]+$/, 'name 只能是小写字母、数字、连字符')
  assert.ok(meta.description, 'description 必填，agent 靠它决定是否加载')
  assert.ok(meta.description.length <= 1024, `description 超长：${meta.description.length} 字符`)
  assert.ok(meta.version, 'version 必填，否则 AI 无法判断规则新旧')
})

test('SKILL.md 保持精简（≤200 行）—— 细节必须下沉到 references/', () => {
  const lines = SKILL_MD.split(/\r?\n/).length
  assert.ok(lines <= 200, `SKILL.md 已 ${lines} 行。入口文件变长会挤占 agent 的上下文预算，把细节挪进 references/`)
})

test('references/ 里的每篇文档都在 SKILL.md 里被引用（不留孤儿文档）', () => {
  const files = readdirSync(join(SKILL, 'references')).filter((f) => f.endsWith('.md'))
  const orphans = files.filter((f) => !SKILL_MD.includes(f))
  assert.deepEqual(orphans, [], `这些文档没人引用，agent 永远读不到：${orphans.join('、')}`)
})

test('templates/ 所有 JSON 可解析，且初始规则必带 P-01 与 S-01', () => {
  for (const f of readdirSync(TMPL).filter((f) => f.endsWith('.json'))) {
    JSON.parse(readFileSync(join(TMPL, f), 'utf8').replace(/^\uFEFF/, ''))
  }
  const rules = JSON.parse(readFileSync(join(TMPL, 'rules.json'), 'utf8'))
  const ruleIds = rules.rules.map((r) => r.id)
  assert.ok(ruleIds.includes('P-01'), '初始规则必须含 P-01（设计优雅原则）')
  assert.ok(ruleIds.includes('S-01'), '初始规则必须含 S-01（上线前安全扫描）')
  assert.ok(rules.pageModes.length >= 2, '至少要有两种页面形态做对照')
  assert.ok(!JSON.stringify(rules).includes('\uFFFD'), '模板里不该有乱码字符')
})

test('scripts/ 真的零依赖（只 import node: 内置模块或相对路径）', () => {
  for (const script of readdirSync(join(SKILL, 'scripts'))) {
    const src = readFileSync(join(SKILL, 'scripts', script), 'utf8')
    const specs = [...src.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    const external = specs.filter((s) => !s.startsWith('node:') && !s.startsWith('.') && !s.startsWith('/'))
    assert.deepEqual(external, [], `${script} 引入了外部依赖：${external.join('、')}`)
  }
})

test('console-demo.html：不加载任何外部资源（断网双击必须能看）', () => {
  const html = readFileSync(join(TMPL, 'preview/console-demo.html'), 'utf8')
  const external = [...html.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1])
  assert.deepEqual(external, [], `演示页引用了外部资源：${external.join('、')}`)
  for (const label of ['规则', '组件', '接口文档', 'Wiki']) {
    assert.ok(html.includes(label), `演示页缺少「${label}」页签，四个页签是核心主张`)
  }
  // 演示对照必须有，且必须写明它不是产品功能；页内不许再出现模式角标/切换
  assert.ok(/data-vis=/.test(html), '演示页缺少对照控件（data-vis）')
  assert.ok(html.includes('真实项目里没有这个开关'), '演示页必须写明对照开关不是产品功能')
  assert.ok(!/data-mode|modeBtn|mode-badge/.test(html), '演示页里不该再有模式角标或切换按钮（2.0 已删除该概念）')
})

test('可见性边界：references/visibility.md 覆盖三层，且模板里不再有 devMode.ts', () => {
  const doc = readFileSync(join(SKILL, 'references', 'visibility.md'), 'utf8')
  for (const layer of ['产物层', '身份层', '字段层']) {
    assert.ok(doc.includes(layer), `visibility.md 缺少「${layer}」`)
  }
  assert.ok(doc.includes('四问'), 'visibility.md 必须给出可照抄的四问')
  assert.ok(!existsSync(join(TMPL, 'devMode.ts')), '2.0 已删除 devMode.ts（模式开关），不该再出现')
  const skill = readFileSync(join(SKILL, 'SKILL.md'), 'utf8')
  assert.ok(skill.includes('references/visibility.md'), 'SKILL.md 没有指向可见性边界文档')
  assert.ok(!skill.includes('resolveMode'), 'SKILL.md 里不该再出现 resolveMode')
})

// ---------------------------------------------------------------- 打包工具
test('tools/package-skill.mjs：产出的 zip 根目录就是 SKILL.md', () => {
  const out = join(TMP, 'dist', 'keel.zip')
  rmSync(dirname(out), { recursive: true, force: true })
  const r = run(join(REPO, 'tools', 'package-skill.mjs'), ['--out', out])
  assert.equal(r.code, 0, r.stderr)
  assert.ok(existsSync(out), '没生成 zip')

  const buf = readFileSync(out)
  // End of Central Directory：定位最后一个 PK\x05\x06
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  assert.ok(eocd > 0, '不是合法 zip（找不到 EOCD）')
  const entries = buf.readUInt16LE(eocd + 10)
  const names = []
  for (let off = 0; off < eocd; ) {
    if (buf.readUInt32LE(off) !== 0x04034b50) { off += 1; continue }
    const nameLen = buf.readUInt16LE(off + 26)
    const extraLen = buf.readUInt16LE(off + 28)
    const compSize = buf.readUInt32LE(off + 18)
    names.push(buf.slice(off + 30, off + 30 + nameLen).toString('utf8'))
    off += 30 + nameLen + extraLen + compSize
  }
  assert.equal(names.length, entries, '中央目录条目数与实际文件数不一致')
  assert.ok(names.includes('SKILL.md'), `zip 根目录必须有 SKILL.md，实际：${names.slice(0, 8).join(', ')}`)
  assert.ok(names.some((n) => n.startsWith('references/')), 'references/ 必须进包，否则 agent 读不到细节')
  assert.ok(names.some((n) => n.startsWith('templates/')), 'templates/ 必须进包')
  assert.ok(names.some((n) => n.startsWith('scripts/')), 'scripts/ 必须进包')
  assert.ok(!names.some((n) => n.startsWith('keel/')), 'zip 里不能多套一层目录，WorkBuddy 会认不出技能')
})

// ---------------------------------------------------------------- 门面（断图会直接毁掉转化）
test('README 与 docs 里引用的本地图片都存在（不留断图）', () => {
  const files = ['README.md', 'README.en.md', 'docs/architecture.md', 'docs/launch.md', 'docs/publishing.md']
  for (const rel of files) {
    const abs = join(REPO, rel)
    if (!existsSync(abs)) continue
    const md = readFileSync(abs, 'utf8')
    const imgs = [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)]
      .map((m) => m[1])
      .filter((p) => !/^https?:/i.test(p))
    for (const img of imgs) {
      assert.ok(existsSync(resolve(dirname(abs), img)), `${rel} 引用了不存在的图片：${img}`)
    }
  }
})

test('README 首屏有钩子、有可试入口（不靠形容词开场）', () => {
  for (const rel of ['README.md', 'README.en.md']) {
    const md = readFileSync(join(REPO, rel), 'utf8')
    const firstScreen = md.split(/\r?\n/).slice(0, 40).join('\n')
    assert.ok(/docs\/assets\/console\.png/.test(firstScreen), `${rel} 首屏缺产品截图，读者无法判断"长什么样"`)
    assert.ok(/console-demo\.html/.test(firstScreen), `${rel} 首屏缺可立即打开的演示入口`)
    assert.ok(/npx skills add|install-local\.mjs|console-check\.mjs/.test(firstScreen), `${rel} 首屏缺可执行命令`)
  }
})

// ---------------------------------------------------------------- 跑起来
const filters = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const keep = process.argv.includes('--keep')
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

let passed = 0
const failures = []
for (const { name, fn } of tests) {
  if (filters.length && !filters.some((f) => name.toLowerCase().includes(f.toLowerCase()))) continue
  try {
    fn()
    passed += 1
    console.log(`  ok    ${name}`)
  } catch (error) {
    failures.push({ name, error })
    console.log(`  FAIL  ${name}`)
    console.log(`        ${String(error.message).split('\n').join('\n        ')}`)
  }
}

console.log('')
if (failures.length) {
  console.log(`失败 ${failures.length} / 通过 ${passed}\n`)
  process.exit(1)
}
console.log(`全部通过：${passed} 个用例\n`)
if (!keep) rmSync(TMP, { recursive: true, force: true })
