<script setup lang="ts">
/**
 * SettingsConsole — 设置中枢外壳（沉浸模式，模块自持左栏）。
 *
 * 四条硬约束（照搬结构，别照搬组件库）：
 *   1. 是整屏路由页，不是弹窗；tab 由 URL ?tab= 驱动，可深链、可刷新保持。
 *   2. 容器不挂权限，权限下沉到每个 tab（permission 字段）。
 *   3. 同一容器内切换，状态不丢 —— 用 KeepAlive 而不是重新挂载。
 *   4. 模式角标常驻：让人随时知道自己看到的是开发形态还是线上形态。
 *
 * React 移植：把 <KeepAlive> 换成「保留已访问面板的状态提升」或路由缓存方案；
 * 其余结构（tabs 元数据 + URL query 解析 + 权限过滤）一一对应。
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useModeBadge } from '../../keel/devMode'

export interface SettingsTab {
  key: string
  label: string
  /** 访问所需权限键；缺省 = 进入设置即可见（文档类通常无权限要求） */
  permission?: string
  /** 懒加载视图 */
  component: () => Promise<unknown>
}

/** 四件套 + 业务配置。顺序即导航顺序，规则放前面因为它定术语。 */
const TABS: SettingsTab[] = [
  { key: 'rules', label: '规则', component: () => import('./tabs/RulesTab.vue') },
  { key: 'components', label: '组件', component: () => import('./tabs/ComponentsTab.vue') },
  { key: 'api', label: '接口文档', component: () => import('./tabs/ApiDocsTab.vue') },
  { key: 'wiki', label: 'Wiki 文档', component: () => import('./tabs/WikiTab.vue') },
  {
    key: 'users',
    label: '用户与权限',
    permission: 'users:view',
    component: () => import('./tabs/UsersTab.vue'),
  },
]

const DEFAULT_KEY = 'rules'

const props = defineProps<{
  /** 当前账号权限键集合；线上包里还决定能否升权到开发模式 */
  permissions?: string[]
  canElevate?: boolean
}>()

const route = useRoute()
const router = useRouter()

const visibleTabs = computed(() => {
  const owned = props.permissions ?? []
  return TABS.filter((tab) => !tab.permission || owned.includes(tab.permission))
})

/** 有效 query 优先 → 默认项 → 第一个可见项 */
const activeKey = computed({
  get: () => {
    const query = route.query.tab
    if (typeof query === 'string' && visibleTabs.value.some((t) => t.key === query)) return query
    if (visibleTabs.value.some((t) => t.key === DEFAULT_KEY)) return DEFAULT_KEY
    return visibleTabs.value[0]?.key ?? ''
  },
  set: (key: string) => {
    // replace 而非 push：切 tab 不该在浏览器历史里堆一层
    router.replace({ query: { ...route.query, tab: key } })
  },
})

const activeTab = computed(() => visibleTabs.value.find((t) => t.key === activeKey.value))
const badge = computed(() => useModeBadge({ canElevate: props.canElevate }))

/** tab 切换时给内容区一个独立滚动复位点，避免上一个 tab 的滚动位置残留 */
const scrollHost = ref<HTMLElement | null>(null)
watch(activeKey, () => {
  scrollHost.value?.scrollTo({ top: 0 })
})

function backToMain(): void {
  router.push('/')
}
</script>

<template>
  <div class="settings-console flex h-full min-h-0 bg-[var(--color-bg)]">
    <!-- 左栏：240px，模块自持导航。不要用组件库的 Menu，它自带折叠与层级假设 -->
    <nav class="flex w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-container)]">
      <header class="flex flex-col gap-1 px-4 py-4">
        <button
          type="button"
          class="self-start text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          @click="backToMain"
        >
          ← 返回主站
        </button>
        <h1 class="mt-2 text-base font-semibold text-[var(--color-text)]">系统设置</h1>
        <p class="text-xs text-[var(--color-text-muted)]">规则 / 组件 / 接口文档 / Wiki 全部自动更新</p>
      </header>

      <ul class="flex flex-1 flex-col gap-0.5 px-2">
        <li v-for="tab in visibleTabs" :key="tab.key">
          <button
            type="button"
            class="w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
            :class="
              tab.key === activeKey
                ? 'bg-[var(--color-primary-bg)] font-medium text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            "
            @click="activeKey = tab.key"
          >
            {{ tab.label }}
          </button>
        </li>
      </ul>

      <!-- 模式角标：常驻，hover 说明判定来源。忘了自己在哪个模式是最高频事故 -->
      <footer class="border-t border-[var(--color-border)] px-4 py-3">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
          :class="{
            'bg-[var(--color-danger-bg)] text-[var(--color-danger)]': badge.tone === 'danger',
            'bg-[var(--color-warning-bg)] text-[var(--color-warning)]': badge.tone === 'warning',
            'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]': badge.tone === 'neutral',
          }"
          :title="badge.hint"
        >
          {{ badge.text }}
        </span>
      </footer>
    </nav>

    <!-- 内容区：容器不滚，让每个 tab 自己决定滚动边界 -->
    <main ref="scrollHost" class="min-w-0 flex-1 overflow-auto">
      <KeepAlive>
        <component :is="activeTab?.component" v-if="activeTab" :key="activeTab.key" />
      </KeepAlive>
      <p v-else class="p-8 text-sm text-[var(--color-text-muted)]">当前账号无权访问设置项。</p>
    </main>
  </div>
</template>
