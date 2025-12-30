/**
 * Plugin service for aggregating plugin data from multiple sources
 * Combines data from marketplace.json, installed_plugins.json, settings.json, etc.
 */

import {
  readJsonFile,
  directoryExists,
  listDirectories,
} from './fileService.js'
import { getEnabledPlugins } from './settingsService.js'
import { PATHS, getMarketplaceJsonPath } from '../utils/paths.js'
import type {
  Plugin,
  InstalledPluginsFile,
  InstalledPluginEntry,
  InstallCountsFile,
  MarketplaceFile,
  KnownMarketplacesFile,
  Marketplace,
} from '../types/index.js'

/**
 * Load all plugins from all marketplaces
 * Aggregates data from marketplace.json, installed_plugins.json, settings.json, and install-counts-cache.json
 * @returns Array of aggregated Plugin objects sorted by install count (descending)
 * @example
 * const plugins = await loadAllPlugins();
 * console.log(`Found ${plugins.length} plugins`);
 */
export function loadAllPlugins(): Plugin[] {
  // Load data from all sources
  const installed = readJsonFile<InstalledPluginsFile>(PATHS.installedPlugins)
  const counts = readJsonFile<InstallCountsFile>(PATHS.installCountsCache)
  const enabledPlugins = getEnabledPlugins()

  // Build lookup maps
  const installedMap = new Map<string, InstalledPluginEntry>()
  if (installed?.plugins) {
    for (const [pluginId, entries] of Object.entries(installed.plugins)) {
      if (entries[0]) {
        installedMap.set(pluginId, entries[0])
      }
    }
  }

  const countsMap = new Map<string, number>()
  if (counts?.counts) {
    for (const entry of counts.counts) {
      countsMap.set(entry.plugin, entry.unique_installs)
    }
  }

  // Scan all marketplaces
  const plugins: Plugin[] = []

  if (directoryExists(PATHS.marketplacesDir)) {
    const marketplaces = listDirectories(PATHS.marketplacesDir)

    for (const marketplace of marketplaces) {
      const manifestPath = getMarketplaceJsonPath(marketplace)
      const manifest = readJsonFile<MarketplaceFile>(manifestPath)

      if (manifest?.plugins) {
        for (const plugin of manifest.plugins) {
          const pluginId = `${plugin.name}@${marketplace}`
          const installedEntry = installedMap.get(pluginId)

          plugins.push({
            id: pluginId,
            name: plugin.name,
            marketplace,
            description: plugin.description || '',
            version: installedEntry?.version || plugin.version || 'unknown',
            installCount: countsMap.get(pluginId) || 0,
            isInstalled: installedMap.has(pluginId),
            isEnabled: enabledPlugins[pluginId] ?? false,
            installedAt: installedEntry?.installedAt,
            lastUpdated: installedEntry?.lastUpdated,
            category: plugin.category,
            author: plugin.author,
            homepage: plugin.homepage,
            tags: plugin.tags || plugin.keywords,
            isLocal: installedEntry?.isLocal,
            gitCommitSha: installedEntry?.gitCommitSha,
          })
        }
      }
    }
  }

  // Sort by install count (descending)
  plugins.sort((a, b) => b.installCount - a.installCount)

  return plugins
}

/**
 * Load installed plugins only
 * @returns Array of installed Plugin objects
 * @example
 * const installed = loadInstalledPlugins();
 * console.log(`${installed.length} plugins installed`);
 */
export function loadInstalledPlugins(): Plugin[] {
  const allPlugins = loadAllPlugins()
  return allPlugins.filter((p) => p.isInstalled)
}

/**
 * Load enabled plugins only
 * @returns Array of enabled Plugin objects
 */
export function loadEnabledPlugins(): Plugin[] {
  const allPlugins = loadAllPlugins()
  return allPlugins.filter((p) => p.isEnabled)
}

/**
 * Load all known marketplaces
 * @returns Array of Marketplace objects
 * @example
 * const marketplaces = loadMarketplaces();
 * console.log(`Found ${marketplaces.length} marketplaces`);
 */
export function loadMarketplaces(): Marketplace[] {
  const known = readJsonFile<KnownMarketplacesFile>(PATHS.knownMarketplaces)
  if (!known) {
    return []
  }

  const marketplaces: Marketplace[] = []

  for (const [id, data] of Object.entries(known)) {
    // Count plugins in this marketplace
    const manifestPath = getMarketplaceJsonPath(id)
    const manifest = readJsonFile<MarketplaceFile>(manifestPath)
    const pluginCount = manifest?.plugins?.length || 0

    marketplaces.push({
      id,
      name: manifest?.name || id,
      source: data.source,
      installLocation: data.installLocation,
      lastUpdated: data.lastUpdated,
      pluginCount,
    })
  }

  // Sort by plugin count (descending)
  marketplaces.sort((a, b) => (b.pluginCount || 0) - (a.pluginCount || 0))

  return marketplaces
}

/**
 * Get a single plugin by ID
 * @param pluginId - Plugin identifier (e.g., "context7@claude-plugins-official")
 * @returns Plugin object or undefined if not found
 */
export function getPluginById(pluginId: string): Plugin | undefined {
  const allPlugins = loadAllPlugins()
  return allPlugins.find((p) => p.id === pluginId)
}

/**
 * Search plugins by query
 * @param query - Search query
 * @param plugins - Plugins to search (defaults to all plugins)
 * @returns Filtered plugins matching the query
 */
export function searchPlugins(query: string, plugins?: Plugin[]): Plugin[] {
  const allPlugins = plugins || loadAllPlugins()
  const lowerQuery = query.toLowerCase()

  return allPlugins.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.marketplace.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some((t) => t.toLowerCase().includes(lowerQuery)),
  )
}

/**
 * Sort plugins by field
 * @param plugins - Plugins to sort
 * @param sortBy - Field to sort by
 * @param order - Sort order
 * @returns Sorted plugins array
 */
export function sortPlugins(
  plugins: Plugin[],
  sortBy: 'installs' | 'name' | 'date',
  order: 'asc' | 'desc',
): Plugin[] {
  const sorted = [...plugins]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'installs':
        comparison = a.installCount - b.installCount
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        const dateA = a.installedAt ? new Date(a.installedAt).getTime() : 0
        const dateB = b.installedAt ? new Date(b.installedAt).getTime() : 0
        comparison = dateA - dateB
        break
    }

    return order === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * Get plugin statistics
 * @returns Object with various plugin counts
 */
export function getPluginStatistics(): {
  total: number
  installed: number
  enabled: number
  marketplaces: number
} {
  const allPlugins = loadAllPlugins()
  const marketplaces = loadMarketplaces()

  return {
    total: allPlugins.length,
    installed: allPlugins.filter((p) => p.isInstalled).length,
    enabled: allPlugins.filter((p) => p.isEnabled).length,
    marketplaces: marketplaces.length,
  }
}
