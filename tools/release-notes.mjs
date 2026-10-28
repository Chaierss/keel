#!/usr/bin/env node
/**
 * 从 CHANGELOG.md 抽出指定版本的段落，拼成 GitHub Release 正文。
 *
 *   node tools/release-notes.mjs 2.1.0            # 只取 2.1.0
 *   node tools/release-notes.mjs 2.1.0 2.0.0      # 跨版本发版时把中间所有大版本一起带上
 *
 * 为什么不用 gh 的 --generate-notes：它只会在没有 PR 的仓库里输出一句
 * "Full Changelog: compare/..."，等于没写。发版页是很多人第一次看到项目的地方，
 * 一句 compare 链接既没说改了什么，也没说要不要动手迁移。
 *
 * 抽不到对应版本时输出空字符串（退出码 0），调用方自己决定退回自动生成。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** 安装命令里的仓库坐标从 package.json 读，避免发版说明和仓库真实地址漂移。 */
function repoSlogan() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const match = /github\.com[/:]([^/]+)\/([^/.]+)/.exec(pkg.repository?.url ?? '')
  return match ? `${match[1]}/${match[2]}` : 'Chaierss/keel'
}

/**
 * 抓 `## [1.2.3] — 日期` 到下一个 `## [` 之间的内容。
 * 用 split 而不是正则：`[\s\S]*?` 配 `\s*$` 的惰性匹配会在空行处立刻成立，抓出空段。
 */
function section(markdown, version) {
  for (const block of markdown.split(/^## \[/m).slice(1)) {
    const newline = block.indexOf('\n')
    if (newline < 0) continue
    const head = block.slice(0, newline).split(']')[0].trim()
    if (head === version) return block.slice(newline + 1).trim()
  }
  return ''
}

function main() {
  const versions = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  if (!versions.length) {
    console.error('用法：node tools/release-notes.mjs <版本号> [更早的版本号…]')
    process.exit(2)
  }

  const markdown = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
  const parts = []
  const breaking = []

  for (const [index, version] of versions.entries()) {
    const body = section(markdown, version)
    if (!body) continue
    // 第一段（最新版）用二级标题，后面的降一级，避免出现五个并列的一级块
    const heading = index === 0 ? `## ${version}` : `## ${version}（更早）`
    parts.push(`${heading}\n\n${body}`)
    if (/破坏性变更/.test(body)) breaking.push(version)
  }

  if (!parts.length) {
    console.error(`CHANGELOG 里找不到这些版本：${versions.join('、')}`)
    process.exit(0)
  }

  const header = [
    '```bash',
    `npx skills add ${repoSlogan()} -g`,
    '```',
    '',
    '装进已有项目：把 `skills/keel/` 下的 `templates/` 与两个脚本拷进项目的 `keel/`，',
    '按 `references/quickstart.md` 走 15 分钟最小版；升级前先看 `references/upgrading.md`。',
  ]

  if (breaking.length) {
    header.push(
      '',
      `> ⚠️ **含破坏性变更（${breaking.join('、')}）**：如果你已经接入过旧版本，\`keel/\` 是拷贝制，不会自动更新。` +
        '别整目录覆盖——先看 `references/upgrading.md` 里对应版本区间的迁移表。',
    )
  }

  console.log([header.join('\n'), ...parts].join('\n\n---\n\n'))
}

main()
