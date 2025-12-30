/**
 * TypeScript interfaces for Claude Code Plugin Dashboard
 * These types aggregate data from multiple Claude Code configuration files
 */

/**
 * Aggregated plugin data from multiple sources
 * Combines data from settings.json, installed_plugins.json, marketplace.json, etc.
 */
export interface Plugin {
  /** Unique identifier: "name@marketplace" */
  id: string
  /** Plugin name */
  name: string
  /** Marketplace identifier */
  marketplace: string
  /** Short description */
  description: string
  /** Semantic version or commit hash */
  version: string
  /** Global installation count from install-counts-cache.json */
  installCount: number
  /** Whether plugin is installed locally */
  isInstalled: boolean
  /** Whether plugin is enabled in settings.json */
  isEnabled: boolean
  /** Installation timestamp (if installed) */
  installedAt?: string
  /** Last update timestamp (if installed) */
  lastUpdated?: string
  /** Plugin category */
  category?: string
  /** Searchable tags */
  tags?: string[]
  /** Author information */
  author?: {
    name: string
    email?: string
  }
  /** Homepage URL */
  homepage?: string
  /** Whether this is a local development plugin */
  isLocal?: boolean
  /** Git commit SHA (if installed) */
  gitCommitSha?: string
}

/**
 * Raw installed plugin data from installed_plugins.json
 */
export interface InstalledPluginEntry {
  scope: 'user' | 'project'
  installPath: string
  version: string
  installedAt: string
  lastUpdated: string
  gitCommitSha: string
  isLocal: boolean
}

/**
 * Structure of installed_plugins.json file
 */
export interface InstalledPluginsFile {
  version: number
  plugins: Record<string, InstalledPluginEntry[]>
}

/**
 * Marketplace configuration from known_marketplaces.json
 */
export interface Marketplace {
  id: string
  name: string
  source: {
    source: 'git' | 'github'
    url?: string
    repo?: string
  }
  installLocation: string
  lastUpdated: string
  pluginCount?: number
}

/**
 * Structure of known_marketplaces.json file
 */
export interface KnownMarketplacesFile {
  [marketplaceId: string]: {
    source: {
      source: 'git' | 'github'
      url?: string
      repo?: string
    }
    installLocation: string
    lastUpdated: string
  }
}

/**
 * Plugin entry in marketplace.json
 */
export interface MarketplacePluginEntry {
  name: string
  description: string
  version?: string
  author?: {
    name: string
    email?: string
  }
  category?: string
  homepage?: string
  tags?: string[]
  keywords?: string[]
}

/**
 * Structure of marketplace.json file
 */
export interface MarketplaceFile {
  $schema?: string
  name: string
  description?: string
  owner?: {
    name: string
    email?: string
  }
  plugins: MarketplacePluginEntry[]
}

/**
 * Install count entry from install-counts-cache.json
 */
export interface InstallCount {
  plugin: string
  unique_installs: number
}

/**
 * Structure of install-counts-cache.json file
 */
export interface InstallCountsFile {
  version: number
  fetchedAt: string
  counts: InstallCount[]
}

/**
 * Plugin error entry
 */
export interface PluginError {
  pluginId: string
  type: 'installation' | 'runtime' | 'config'
  message: string
  timestamp: string
  details?: string
}

/**
 * Settings.json structure (partial - only plugin-related fields)
 */
export interface Settings {
  enabledPlugins?: Record<string, boolean>
  [key: string]: unknown
}

/**
 * Application state for useReducer
 */
export interface AppState {
  /** Current active tab */
  activeTab: 'discover' | 'installed' | 'marketplaces' | 'errors'
  /** All plugins from all marketplaces */
  plugins: Plugin[]
  /** All marketplaces */
  marketplaces: Marketplace[]
  /** Plugin errors */
  errors: PluginError[]
  /** Currently selected item index in the list */
  selectedIndex: number
  /** Search/filter query */
  searchQuery: string
  /** Sort field */
  sortBy: 'installs' | 'name' | 'date'
  /** Sort direction */
  sortOrder: 'asc' | 'desc'
  /** Loading state */
  loading: boolean
  /** Error message */
  error: string | null
  /** Status message */
  message: string | null
  /** Current async operation (install/uninstall) */
  operation: 'idle' | 'installing' | 'uninstalling'
  /** Plugin ID being operated on */
  operationPluginId: string | null
  /** Whether confirmation dialog is showing */
  confirmUninstall: boolean
}

/**
 * Action types for useReducer
 */
export type Action =
  | { type: 'SET_TAB'; payload: AppState['activeTab'] }
  | { type: 'SET_PLUGINS'; payload: Plugin[] }
  | { type: 'SET_MARKETPLACES'; payload: Marketplace[] }
  | { type: 'SET_ERRORS'; payload: PluginError[] }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'MOVE_SELECTION'; payload: 'up' | 'down' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | {
      type: 'SET_SORT'
      payload: { by: AppState['sortBy']; order: AppState['sortOrder'] }
    }
  | { type: 'TOGGLE_PLUGIN_ENABLED'; payload: string }
  | { type: 'UPDATE_PLUGIN'; payload: Plugin }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGE'; payload: string | null }
  | { type: 'NEXT_TAB' }
  | { type: 'PREV_TAB' }
  | {
      type: 'START_OPERATION'
      payload: { operation: 'installing' | 'uninstalling'; pluginId: string }
    }
  | { type: 'END_OPERATION' }
  | { type: 'SHOW_CONFIRM_UNINSTALL'; payload: string }
  | { type: 'HIDE_CONFIRM_UNINSTALL' }
