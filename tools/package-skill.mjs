#!/usr/bin/env node
/**
 * 把 skills/keel 打成一个可直接上传的 zip —— 零依赖，Node >= 18。
 *
 *   node tools/package-skill.mjs                         → dist/keel-<version>.zip
 *   node tools/package-skill.mjs --out /tmp/keel.zip
 *   node tools/package-skill.mjs --list                 只列清单，不写文件
 *
 * 为什么不用 zip 命令 / Compress-Archive：Windows 上 PowerShell 的执行策略经常
 * 拦住脚本，而 `zip` 在 Windows 默认没有。这里直接按 ZIP 规范写字节，三个平台一致，
 * 且不压缩时字节可复现（同样的输入永远得到同样的 zip，方便校验发布包）。
 *
 * 包结构必须是「SKILL.md 在根」：WorkBuddy / Trae 上传后会拿 zip 根当技能目录，
 * 多套一层 keel/ 会让它们认不出技能。
 */
import { deflateRawSync } from 'node:zlib'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')
const SKILL = join(REPO, 'skills', 'keel')

const SKIP = new Set(['.DS_Store', 'Thumbs.db', '.git', 'node_modules', 'dist'])
// 固定时间戳（2026-01-01 00:00:00）→ 同样的输入产出逐字节相同的 zip
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1

// ---------------------------------------------------------------- CRC32
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  return table
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

// ---------------------------------------------------------------- 收集文件
function collect(dir, base = dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) collect(abs, base, acc)
    else if (entry.isFile()) acc.push({ abs, name: relative(base, abs).split('\\').join('/') })
  }
  return acc
}

// ---------------------------------------------------------------- 写 ZIP
function buildZip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  let stored = 0

  for (const file of files) {
    const raw = readFileSync(file.abs)
    const crc = crc32(raw)
    const deflated = deflateRawSync(raw, { level: 9 })
    const useDeflate = deflated.length < raw.length
    const body = useDeflate ? deflated : raw
    const method = useDeflate ? 8 : 0
    const nameBuf = Buffer.from(file.name, 'utf8')
    if (useDeflate) stored += 1

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0800, 6) // UTF-8 文件名
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBuf, body)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30) // extra len
    central.writeUInt16LE(0, 32) // comment len
    central.writeUInt16LE(0, 34) // disk start
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0o644 << 16, 38) // external attrs：普通文件
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBuf)

    offset += local.length + nameBuf.length + body.length
  }

  const centralBuf = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20)

  return { buffer: Buffer.concat([...locals, centralBuf, eocd]), deflated: stored }
}

// ---------------------------------------------------------------- CLI
function parseArgs(argv) {
  const out = { out: null, list: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') out.out = argv[i += 1]
    else if (arg === '--list') out.list = true
    else if (arg === '-h' || arg === '--help') {
      console.log('用法：node tools/package-skill.mjs [--out <file.zip>] [--list]')
      process.exit(0)
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const skillMd = readFileSync(join(SKILL, 'SKILL.md'), 'utf8')
const version = (/^version:\s*(\S+)$/m.exec(skillMd.replace(/^\uFEFF/, '')) || [])[1] || '0.0.0'

const files = collect(SKILL).sort((a, b) => a.name.localeCompare(b.name))
if (!files.some((f) => f.name === 'SKILL.md')) {
  console.error('打包中止：skills/keel/SKILL.md 不存在，这个包传上去不会被识别为技能。')
  process.exit(1)
}

const outPath = resolve(args.out || join(REPO, 'dist', `keel-${version}.zip`))

if (args.list) {
  console.log(`keel ${version} · ${files.length} 个文件`)
  for (const file of files) console.log(`  ${file.name}`)
  process.exit(0)
}

const { buffer } = buildZip(files)
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, buffer)

const kb = (buffer.length / 1024).toFixed(1)
const raw = files.reduce((sum, f) => sum + statSync(f.abs).size, 0)
console.log(`\nkeel ${version} 已打包`)
console.log(`  ${files.length} 个文件 · 原始 ${(raw / 1024).toFixed(1)} KB → zip ${kb} KB`)
console.log(`  ${outPath}\n`)
console.log('上传方式：')
console.log('  WorkBuddy  专家·技能·连接器 → 技能 → 添加技能 → 上传技能（选这个 zip）')
console.log('  Trae       设置 → 技能与命令 → 创建 → 上传含 SKILL.md 的 zip')
console.log('  其他 agent  解压后把目录放到对应的 skills 目录，或 npx skills add Chaierss/keel -g\n')
