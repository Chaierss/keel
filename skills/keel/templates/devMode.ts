/**
 * 开发模式 / 线上模式 —— 框架无关的唯一判定点。
 *
 * 落地要求：
 *   1. 全项目只有这里读构建期变量；业务代码只调 isDev()。
 *   2. 构建期的 MODE 决定"这个包是什么"，运行时 URL/存储只能做受限覆盖。
 *   3. 线上包里升权到 dev 必须过权限校验（canElevate），否则 ?mode=dev 就是信息泄露口。
 *
 * 用法：
 *   import { isDev, resolveMode, useModeBadge, setMode } from '@/keel/devMode'
 *   if (isDev()) renderInternalFactsPanel()
 */

export type AppMode = 'dev' | 'prod'
export type ModeSource = 'build' | 'url' | 'storage' | 'default'

export interface ModeState {
  mode: AppMode
  /** 这个结论是从哪来的 —— 角标 hover 要展示，排障时最关键 */
  source: ModeSource
  /** 是否由管理员临时升权（线上包切到 dev） */
  elevated: boolean
}

const STORAGE_KEY = 'app.mode'
const URL_KEY = 'mode'

/**
 * 构建期常量。Vite: VITE_APP_MODE / Next: NEXT_PUBLIC_APP_MODE / 其他自行替换。
 * 变量缺失时默认 dev —— 本地开发不该因为忘了配变量就看不到内部事实。
 */
function readBuildMode(): AppMode {
  const env =
    (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
    (typeof process !== 'undefined' ? process.env : {}) ||
    {}
  const raw = env.VITE_APP_MODE ?? env.NEXT_PUBLIC_APP_MODE ?? env.APP_MODE
  return raw === 'prod' || raw === 'production' ? 'prod' : 'dev'
}

const BUILD_MODE: AppMode = readBuildMode()

function readUrlMode(): AppMode | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(URL_KEY)
  if (value === 'dev') return 'dev'
  if (value === 'prod') return 'prod'
  return null
}

function readStoredMode(): AppMode | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'dev' || value === 'prod' ? value : null
  } catch {
    return null
  }
}

/**
 * 解析当前模式。优先级：URL > 存储 > 构建期。
 *
 * 为什么 URL 高于构建期：线上包需要"临时看一眼开发形态"来做交付前自查。
 * 但这一步必须 canElevate，否则等于给所有人开了后门。
 */
export function resolveMode(options: { canElevate?: boolean } = {}): ModeState {
  const { canElevate = false } = options

  const urlMode = readUrlMode()
  if (urlMode) {
    // 线上包 + 非管理员 → 直接忽略，不留任何提示，避免被探测
    if (urlMode === 'dev' && BUILD_MODE === 'prod' && !canElevate) {
      return { mode: BUILD_MODE, source: 'build', elevated: false }
    }
    return { mode: urlMode, source: 'url', elevated: urlMode === 'dev' && BUILD_MODE === 'prod' }
  }

  const stored = readStoredMode()
  if (stored) {
    if (stored === 'dev' && BUILD_MODE === 'prod' && !canElevate) {
      return { mode: BUILD_MODE, source: 'build', elevated: false }
    }
    return { mode: stored, source: 'storage', elevated: stored === 'dev' && BUILD_MODE === 'prod' }
  }

  return { mode: BUILD_MODE, source: BUILD_MODE === 'dev' ? 'default' : 'build', elevated: false }
}

/** 全项目唯一的布尔出口。业务代码只认它。 */
export function isDev(options: { canElevate?: boolean } = {}): boolean {
  return resolveMode(options).mode === 'dev'
}

/** 模式角标：文字 / 色调 / 悬停说明 */
export function useModeBadge(options: { canElevate?: boolean } = {}): {
  text: string
  tone: 'neutral' | 'warning' | 'danger'
  hint: string
} {
  const { mode, source, elevated } = resolveMode(options)
  const sourceLabel: Record<ModeSource, string> = {
    build: '构建期常量',
    url: 'URL 参数',
    storage: '本地存储',
    default: '默认值',
  }

  if (mode === 'dev') {
    return {
      text: elevated ? '开发模式（临时）' : '开发模式',
      tone: elevated ? 'warning' : 'danger',
      hint: `判定来源：${sourceLabel[source]}${elevated ? ' · 线上包临时升权，别忘了切回' : ''}`,
    }
  }
  return {
    text: '线上模式',
    tone: 'neutral',
    hint: `判定来源：${sourceLabel[source]}`,
  }
}

/**
 * 切换模式。必须整页重载 —— 半开发半线上的界面比纯线上更危险。
 * 返回 false 表示被拒（线上包 + 非管理员）。
 */
export function setMode(mode: AppMode, options: { canElevate?: boolean } = {}): boolean {
  if (mode === 'dev' && BUILD_MODE === 'prod' && !options.canElevate) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** 调试用：清掉覆盖，回到构建期形态 */
export function resetMode(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  window.location.reload()
}

/**
 * 可见性矩阵（放在代码里而不是文档里，新增 tab 时会被迫填一次）。
 * 线上模式默认隐藏"内部债"类内容 —— 未登记告警、源码路径、堆栈、试调入口。
 */
export const MODE_VISIBILITY = {
  rulesFullDetail: { dev: true, prod: false }, // 规则出处/内部路径
  componentUnregistered: { dev: true, prod: false }, // 未登记告警条
  componentUnused: { dev: true, prod: false }, // 待下架清单
  componentSourcePath: { dev: true, prod: false }, // 源码路径
  apiTryItOut: { dev: true, prod: false }, // 接口试调
  rawErrorStack: { dev: true, prod: false }, // 原始堆栈
} as const satisfies Record<string, { dev: boolean; prod: boolean }>

export function canShow(key: keyof typeof MODE_VISIBILITY, options: { canElevate?: boolean } = {}): boolean {
  return MODE_VISIBILITY[key][resolveMode(options).mode]
}
