#!/usr/bin/env node
/**
 * 把 skills/keel 装进本地某个 agent 的技能目录 —— 零依赖，Node >= 18。
 *
 *   node tools/install-local.mjs --list                     看各平台的目标路径
 *   node tools/install-local.mjs --target workbuddy         装到用户级
 *   node tools/install-local.mjs --target all               所有已探测到的平台
 *   node tools/install-local.mjs --target claude --project .  装到项目级（可提交进仓库）
 *   node tools/install-local.mjs --dest ./tmp/skills/keel    装到任意目录（调试用）
 *
 * 只做两件事：删掉目标目录里旧的 keel，把 skills/keel 拷过去。
 * 不碰目标目录之外的任何文件，不改 PATH，不写注册表。
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')
const SKILL = join(REPO, 'skills', 'keel')
const NAME = 'keel'

/** 用户级：各 agent 读取技能的位置 */
const USER_TARGETS = {
  workbuddy: () => join(homedir(), '.workbuddy', 'skills', NAME),
  claude: () => join(homedir(), '.claude', 'skills', NAME),
  trae: () => join(homedir(), process.platform === 'win32' ? '.trae-cn' : '.trae', 'skills', NAME),
  agents: () => join(homedir(), '.agents', 'skills', NAME),
}

/** 项目级：可以提交进仓库，团队共享 */
const PROJECT_TARGETS = {
  workbuddy: (dir) => join(dir, '.workbuddy', 'skills', NAME),
  claude: (dir) => join(dir, '.claude', 'skills', NAME),
  trae: (dir) => join(dir, '.trae', 'skills', NAME),
  agents: (dir) => join(dir, '.agents', 'skills', NAME),
}

function parseArgs(argv) {
  const out = { target: null, project: null, dest: null, list: false, dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--target') out.target = argv[i += 1]
    else if (arg === '--project') out.project = resolve(argv[i += 1] || '.')
    else if (arg === '--dest') out.dest = resolve(argv[i += 1])
    else if (arg === '--list') out.list = true
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '-h' || arg === '--help') {
      console.log(`用法：
  node tools/install-local.mjs --list
  node tools/install-local.mjs --target <${Object.keys(USER_TARGETS).join('|')}|all> [--project <dir>] [--dry-run]
  node tools/install-local.mjs --dest <dir>`)
      process.exit(0)
    }
  }
  return out
}

function resolveTargets(args) {
  if (args.dest) return [{ label: 'dest', path: args.dest }]
  const names = args.target === 'all' ? Object.keys(USER_TARGETS) : [args.target]
  return names.map((name) => {
    if (!USER_TARGETS[name]) {
      console.error(`未知平台：${name}（可选：${Object.keys(USER_TARGETS).join(' / ')} / all）`)
      process.exit(1)
    }
    const base = args.project ? PROJECT_TARGETS[name] : USER_TARGETS[name]
    return { label: name, path: args.project ? base(args.project) : base() }
  })
}

const args = parseArgs(process.argv.slice(2))

if (!existsSync(join(SKILL, 'SKILL.md'))) {
  console.error(`找不到 ${SKILL}/SKILL.md，请在仓库根目录运行。`)
  process.exit(1)
}

if (args.list || (!args.target && !args.dest)) {
  console.log('\n用户级安装位置（--target <名字>）：')
  for (const [name, fn] of Object.entries(USER_TARGETS)) {
    const p = fn()
    console.log(`  ${name.padEnd(10)} ${p}${existsSync(dirname(p)) ? '' : '   (目录不存在，安装时会创建)'}`)
  }
  console.log('\n项目级安装位置（--target <名字> --project <dir>）：')
  for (const name of Object.keys(PROJECT_TARGETS)) {
    console.log(`  ${name.padEnd(10)} ${PROJECT_TARGETS[name]('<项目根>')}`)
  }
  console.log('\n示例：node tools/install-local.mjs --target workbuddy\n')
  process.exit(0)
}

const targets = resolveTargets(args)
let installed = 0

for (const { label, path } of targets) {
  if (args.dryRun) {
    console.log(`  [dry-run] ${label} → ${path}`)
    continue
  }
  const existed = existsSync(path)
  if (existed) rmSync(path, { recursive: true, force: true })
  mkdirSync(dirname(path), { recursive: true })
  cpSync(SKILL, path, { recursive: true })
  const count = readdirSync(path).length
  console.log(`  ${existed ? '已更新' : '已安装'} ${label.padEnd(10)} ${path}（${count} 项）`)
  installed += 1
}

if (installed) {
  console.log(`\n完成。多数 agent 需要重开会话才能识别新技能。`)
  console.log(`验证：`)
  console.log(`  node ${join('skills', 'keel', 'scripts', 'console-check.mjs')} --help`)
  console.log(`或直接看模板演示页：skills/keel/templates/preview/console-demo.html\n`)
}
