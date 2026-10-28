<script setup lang="ts">
/**
 * ComponentCard — 组件页的一张卡片：真实渲染 + 变体×状态矩阵 + 元信息。
 *
 * 三条硬约束：
 *   1. 渲染的是真组件，不是截图。截图第一次样式改动就过期了，而且没人会回来换。
 *   2. 每一格标出生效的 props —— 光看图看不出是 type 还是 variant。
 *   3. 只摆 props 能表达的状态（disabled / loading / selected）。
 *      hover / focus 必须靠真实交互看，不做摆拍 —— 摆出来的悬停按下去没反应。
 *
 * 拷贝说明：只需改一处 glob 前缀（下面的 COMPONENT_GLOB），指向你的组件根。
 * React 移植：把 defineAsyncComponent 换成 React.lazy，其余结构（矩阵 + 元信息）一一对应。
 */
import { computed, defineAsyncComponent } from 'vue'

/** 改成你的组件根。用 / 开头 = 相对项目根，避免相对路径算错 */
const COMPONENT_GLOB = '/src/components/**/*.demo.vue'
const demoModules = import.meta.glob(COMPONENT_GLOB)

export interface MatrixCell {
  /** 这一格叫什么，人看的 */
  label: string
  /** 生效的 props，原样传给组件 */
  props?: Record<string, unknown>
}

export interface ComponentEntry {
  key: string
  name: string
  exportName?: string
  layer: 'base' | 'ui' | 'patterns' | 'visualization'
  category?: string
  path: string
  summary: string
  variants?: string[]
  /** "auto" = 找同名 .demo.*；null = 明确无预览；也可以直接写路径 */
  demo?: string | null
  /** 变体×状态矩阵；缺省时退化为单格默认渲染 */
  matrix?: MatrixCell[]
  note?: string
  deprecated?: boolean
}

const props = defineProps<{
  entry: ComponentEntry
  /** 被多少个文件引用；未登记组件为 0 */
  usage?: number
  /** 目录里有、注册表里没有 */
  unregistered?: boolean
}>()

/** demo 路径：auto 按同名推导，其余直接用注册表里的值 */
const demoPath = computed(() => {
  const { demo, path } = props.entry
  if (!demo) return null
  if (demo !== 'auto') return demo.replace(/^\/+/, '')
  return path.replace(/\.(vue|tsx|jsx)$/, '.demo.$1')
})

const demoComponent = computed(() => {
  const rel = demoPath.value
  if (!rel) return null
  const loader = demoModules[`/${rel}`] ?? demoModules[rel]
  return loader ? defineAsyncComponent(loader as () => Promise<unknown>) : null
})

/** 没有 matrix 就退化成单格：空白会让人以为组件坏了 */
const cells = computed<MatrixCell[]>(() =>
  Array.isArray(props.entry.matrix) && props.entry.matrix.length
    ? props.entry.matrix
    : [{ label: '默认', props: {} }],
)

const hasMatrix = computed(() => Array.isArray(props.entry.matrix) && props.entry.matrix.length > 0)

/** 把 props 渲染成人能读的一行，点了能复制 —— 这才是开发者在找的东西 */
function propsText(cell: MatrixCell): string {
  const entries = Object.entries(cell.props ?? {})
  if (!entries.length) return '(默认)'
  return entries.map(([k, v]) => (v === true ? k : `${k}="${String(v)}"`)).join(' ')
}

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* 剪贴板被拒时不打断阅读，用户能手动选中 */
  }
}
</script>

<template>
  <article class="card" :class="{ 'is-unregistered': unregistered, 'is-deprecated': entry.deprecated }">
    <!-- 渲染区：真组件 -->
    <div class="stage">
      <component :is="demoComponent" v-if="demoComponent" />
      <p v-else class="no-demo">
        {{ entry.demo === null ? entry.note || '该组件依赖整页上下文，不提供内联预览' : '未找到 demo 文件（同目录同名 *.demo.*）' }}
      </p>
    </div>

    <!-- 变体×状态矩阵 -->
    <div class="matrix">
      <div class="matrix-head">
        <span>变体</span>
        <span v-if="!hasMatrix" class="hint">未声明变体 —— 待补，不是正常态</span>
      </div>
      <ul class="cells">
        <li v-for="cell in cells" :key="cell.label" class="cell">
          <div class="cell-stage">
            <component :is="demoComponent" v-if="demoComponent" v-bind="cell.props" />
          </div>
          <button type="button" class="cell-label" :title="`复制：${propsText(cell)}`" @click="copy(`<${entry.exportName || entry.name} ${propsText(cell)} />`)">
            {{ cell.label }}
          </button>
        </li>
      </ul>
    </div>

    <!-- 元信息 -->
    <header class="meta">
      <div class="title-row">
        <h3>{{ entry.name }}</h3>
        <code v-if="entry.exportName" class="export">{{ entry.exportName }}</code>
        <span class="layer">{{ entry.layer }}</span>
        <span v-if="unregistered" class="flag flag-warn">未登记</span>
        <span v-if="entry.deprecated" class="flag">已废弃</span>
      </div>
      <p class="summary">{{ entry.summary }}</p>
      <p v-if="entry.note" class="note">{{ entry.note }}</p>
      <div class="foot">
        <button type="button" class="path" :title="`复制路径：${entry.path}`" @click="copy(entry.path)">{{ entry.path }}</button>
        <span class="usage">被 {{ usage ?? 0 }} 处引用</span>
      </div>
    </header>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-container);
  overflow: hidden;
}
.card.is-unregistered { border-color: var(--color-warning); }
.card.is-deprecated { opacity: 0.72; }

.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: 20px 16px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
.no-demo {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.matrix { border-bottom: 1px solid var(--color-border); }
.matrix-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 0;
  font-size: 11px;
  color: var(--color-text-muted);
}
.matrix-head .hint { color: var(--color-warning); }
.cells {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 8px 14px 12px;
  list-style: none;
}
.cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 8px 6px;
  background: var(--color-bg);
}
.cell-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}
.cell-label {
  all: unset;
  cursor: pointer;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-secondary);
  padding: 2px 0;
}
.cell-label:hover { color: var(--color-primary); }

.meta { padding: 12px 14px 14px; }
.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.title-row h3 { font-size: 14px; font-weight: 600; margin: 0; color: var(--color-text); }
.export {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}
.layer {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.flag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-bg-hover);
  color: var(--color-text-muted);
}
.flag-warn { background: var(--color-warning-bg); color: var(--color-warning); }
.summary { font-size: 12.5px; color: var(--color-text-secondary); line-height: 1.6; margin: 8px 0 0; }
.note {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 6px 0 0;
  padding-left: 8px;
  border-left: 2px solid var(--color-border);
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}
.path {
  all: unset;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.path:hover { color: var(--color-primary); }
.usage { font-size: 11px; color: var(--color-text-muted); flex: 0 0 auto; }
</style>
