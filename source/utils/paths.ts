/**
 * File path constants for Claude Code configuration
 * Uses os.homedir() for cross-platform compatibility (macOS, Linux, Windows)
 */

import * as os from 'node:os'
import * as path from 'node:path'

/** Claude Code configuration directory (~/.claude) */
const CLAUDE_DIR = path.join(os.homedir(), '.claude')

/** Plugins directory (~/.claude/plugins) */
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins')

/**
 * All file paths used by the dashboard
 * These paths work on macOS, Linux, and Windows
 */
export const PATHS = {
  /** Root Claude Code directory */
  claudeDir: CLAUDE_DIR,

  /** Plugins directory */
  pluginsDir: PLUGINS_DIR,

  /** Main settings file with enabledPlugins */
  settings: path.join(CLAUDE_DIR, 'settings.json'),

  /** Installed plugins registry */
  installedPlugins: path.join(PLUGINS_DIR, 'installed_plugins.json'),

  /** Known marketplaces registry */
  knownMarketplaces: path.join(PLUGINS_DIR, 'known_marketplaces.json'),

  /** Global install counts cache */
  installCountsCache: path.join(PLUGINS_DIR, 'install-counts-cache.json'),

  /** Marketplaces source directory */
  marketplacesDir: path.join(PLUGINS_DIR, 'marketplaces'),

  /** Cached plugins directory */
  cacheDir: path.join(PLUGINS_DIR, 'cache'),
} as const

/**
 * Get the marketplace.json path for a specific marketplace
 * @param marketplaceId - The marketplace identifier
 * @returns Absolute path to marketplace.json
 */
export function getMarketplaceJsonPath(marketplaceId: string): string {
  return path.join(
    PATHS.marketplacesDir,
    marketplaceId,
    '.claude-plugin',
    'marketplace.json',
  )
}

/**
 * Get the plugin.json path for a cached plugin
 * @param marketplace - Marketplace identifier
 * @param pluginName - Plugin name
 * @param version - Plugin version
 * @returns Absolute path to plugin.json
 */
export function getPluginJsonPath(
  marketplace: string,
  pluginName: string,
  version: string,
): string {
  return path.join(
    PATHS.cacheDir,
    marketplace,
    pluginName,
    version,
    '.claude-plugin',
    'plugin.json',
  )
}
