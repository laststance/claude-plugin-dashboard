/**
 * TypeScript interfaces for Claude Code Plugin Dashboard
 * These types aggregate data from multiple Claude Code configuration files
 */

/**
 * Component type identifier
 */
export type ComponentType =
  | 'skill'
  | 'command'
  | 'agent'
  | 'hook'
  | 'mcp'
  | 'lsp'

/**
 * Individual component information with name and optional description
 *
 * Data Source Architecture:
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Plugin Installed?                        │
 * │                          │                                  │
 * │           ┌──── YES ─────┴───── NO ────┐                    │
 * │           │                            │                    │
 * │           ▼                            ▼                    │
 * │  ┌─────────────────────┐    ┌─────────────────────┐         │
 * │  │  File System Scan   │    │  Marketplace JSON   │         │
 * │  │  ─────────────────  │    │  ─────────────────  │         │
 * │  │  skills/{name}/     │    │  skills: [          │         │
 * │  │  commands/{name}.md │    │    "./skills/xlsx"  │         │
 * │  │  agents/{name}.md   │    │  ]                  │         │
 * │  │  plugin.json keys   │    │                     │         │
 * │  └─────────────────────┘    └─────────────────────┘         │
 * │           │                            │                    │
 * │           ▼                            ▼                    │
 * │  Names + Descriptions          Names only (if available)    │
 * │                                                             │
 * │           └────────────────────────────┘                    │
 * │                          │                                  │
 * │                          ▼                                  │
 * │              PluginComponentsDetailed                       │
 * │              ─────────────────────────                      │
 * │              {                                              │
 * │                skills: [                                    │
 * │                  { name: "xlsx", description: "..." },      │
 * │                  { name: "docx" }                           │
 * │                ],                                           │
 * │                mcpServers: ["supabase", "context7"]         │
 * │              }                                              │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * @example
 * // Skill with description (from SKILL.md frontmatter)
 * { name: "xlsx", description: "Spreadsheet editing", type: "skill" }
 *
 * @example
 * // Command without description
 * { name: "code-review", type: "command" }
 */
export interface ComponentInfo {
  /** Component name (e.g., "xlsx", "code-review") */
  name: string
  /** Optional description from SKILL.md frontmatter or first line of .md file */
  description?: string
  /** Component type for display categorization */
  type: ComponentType
}

/**
 * Extended component information with full SKILL.md parsing
 * Used for Component detail view in PluginDetail panel
 *
 * @example
 * {
 *   name: "sentry-code-review",
 *   description: "Analyze and resolve Sentry comments...",
 *   type: "skill",
 *   allowedTools: ["Read", "Edit", "Write", "Bash", "Grep"],
 *   fullDescription: "Full markdown body content...",
 *   filePath: "/Users/.../skills/sentry-code-review/SKILL.md"
 * }
 */
export interface ComponentDetailedInfo extends ComponentInfo {
  /** Allowed tools from SKILL.md frontmatter (allowed-tools field) */
  allowedTools?: string[]
  /** Full markdown body content (after frontmatter) */
  fullDescription?: string
  /** Absolute file path for reference */
  filePath?: string
}

/**
 * Detailed component information for a plugin
 * Extends PluginComponents (counts) with actual component names and descriptions
 *
 * @example
 * {
 *   skills: [
 *     { name: "xlsx", description: "Spreadsheet editing", type: "skill" },
 *     { name: "docx", type: "skill" }
 *   ],
 *   mcpServers: ["supabase", "context7"]
 * }
 */
export interface PluginComponentsDetailed {
  /** Skill details (name + optional description) */
  skills?: ComponentInfo[]
  /** Command details */
  commands?: ComponentInfo[]
  /** Agent details */
  agents?: ComponentInfo[]
  /** Hook event names */
  hooks?: string[]
  /** MCP server names from plugin.json mcpServers keys */
  mcpServers?: string[]
  /** LSP server language IDs from .lsp.json keys */
  lspServers?: string[]
}

/**
 * Component types provided by a plugin (counts only)
 * Detected by scanning plugin directory structure and plugin.json
 * @example
 * { skills: 5, commands: 2, mcpServers: 1 } // Plugin with skills, commands, and MCP
 */
export interface PluginComponents {
  /** Count of skill directories in skills/ */
  skills?: number
  /** Count of command .md files in commands/ (legacy location, now unified with skills in Claude Code v2.1.3+) */
  commands?: number
  /** Count of subagent .md files in agents/ */
  agents?: number
  /** Whether hooks are configured (hooks/ dir or hooks.json exists) */
  hooks?: boolean
  /** Count of MCP server configurations in plugin.json mcpServers field */
  mcpServers?: number
  /** Count of LSP server configurations in .lsp.json */
  lspServers?: number
}

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
  /** Component types provided by this plugin (skills, commands, MCP, etc.) */
  components?: PluginComponents
  /** Detailed component info with names and descriptions */
  componentsDetailed?: PluginComponentsDetailed
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
  autoUpdate?: boolean
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
    autoUpdate?: boolean
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
  /** Skill paths from marketplace.json (e.g., ["./skills/xlsx"]) */
  skills?: string[]
  /** Agent paths from marketplace.json */
  agents?: string[]
  /** Command paths from marketplace.json */
  commands?: string[]
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
 * Focus zones for keyboard navigation
 * Defines which UI area currently has keyboard focus
 */
export type FocusZone = 'tabbar' | 'search' | 'list' | 'components'

/**
 * Marketplace operation types
 */
export type MarketplaceOperation = 'idle' | 'adding' | 'removing' | 'updating'

/**
 * Application state for useReducer
 */
export interface AppState {
  /** Current active tab */
  activeTab: 'enabled' | 'installed' | 'discover' | 'marketplaces' | 'errors'
  /** Current focus zone for keyboard navigation */
  focusZone: FocusZone
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
  /** Current async operation (install/uninstall/update) */
  operation: 'idle' | 'installing' | 'uninstalling' | 'updating'
  /** Plugin ID being operated on */
  operationPluginId: string | null
  /** Whether confirmation dialog is showing */
  confirmUninstall: boolean
  /** Whether update all confirmation dialog is showing */
  confirmUpdateAll: boolean
  /** Progress of bulk update operation */
  updateProgress: { current: number; total: number; pluginId: string } | null
  /** Whether help overlay is showing */
  showHelp: boolean
  /** Current marketplace operation */
  marketplaceOperation: MarketplaceOperation
  /** Marketplace ID being operated on */
  operationMarketplaceId: string | null
  /** Whether remove marketplace confirmation dialog is showing */
  confirmRemoveMarketplace: boolean
  /** Whether add marketplace dialog is showing */
  showAddMarketplaceDialog: boolean
  /** Error message for add marketplace dialog */
  addMarketplaceError: string | null
  /** Whether marketplace action menu is showing */
  showMarketplaceActionMenu: boolean
  /** Selected index in marketplace action menu */
  actionMenuSelectedIndex: number
  /** Selected component index within the current plugin */
  selectedComponentIndex: number
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
      payload: {
        operation: 'installing' | 'uninstalling' | 'updating'
        pluginId: string
      }
    }
  | { type: 'END_OPERATION' }
  | { type: 'SHOW_CONFIRM_UNINSTALL'; payload: string }
  | { type: 'HIDE_CONFIRM_UNINSTALL' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'SET_FOCUS_ZONE'; payload: FocusZone }
  | { type: 'SHOW_CONFIRM_REMOVE_MARKETPLACE'; payload: string }
  | { type: 'HIDE_CONFIRM_REMOVE_MARKETPLACE' }
  | { type: 'SHOW_ADD_MARKETPLACE_DIALOG' }
  | { type: 'HIDE_ADD_MARKETPLACE_DIALOG' }
  | {
      type: 'START_MARKETPLACE_OPERATION'
      payload: { operation: MarketplaceOperation; marketplaceId?: string }
    }
  | { type: 'END_MARKETPLACE_OPERATION' }
  | { type: 'SET_ADD_MARKETPLACE_ERROR'; payload: string | null }
  | { type: 'SHOW_MARKETPLACE_ACTION_MENU' }
  | { type: 'HIDE_MARKETPLACE_ACTION_MENU' }
  | { type: 'SET_ACTION_MENU_INDEX'; payload: number }
  | { type: 'MOVE_ACTION_MENU_SELECTION'; payload: 'up' | 'down' }
  | { type: 'SET_COMPONENT_INDEX'; payload: number }
  | {
      type: 'MOVE_COMPONENT_SELECTION'
      payload: 'up' | 'down'
      maxIndex: number
    }
  | { type: 'ENTER_COMPONENT_MODE' }
  | { type: 'EXIT_COMPONENT_MODE' }
