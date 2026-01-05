/**
 * Unit tests for paths utility module
 * Tests path construction functions without requiring file system access
 */

import * as path from 'node:path'
import { describe, it, expect } from 'vitest'
import { PATHS, getMarketplaceJsonPath, getPluginJsonPath } from './paths.js'

describe('PATHS object', () => {
  it('should contain all expected keys', () => {
    const expectedKeys = [
      'claudeDir',
      'pluginsDir',
      'settings',
      'installedPlugins',
      'knownMarketplaces',
      'installCountsCache',
      'marketplacesDir',
      'cacheDir',
    ]

    expect(Object.keys(PATHS)).toEqual(expect.arrayContaining(expectedKeys))
    expect(Object.keys(PATHS)).toHaveLength(expectedKeys.length)
  })

  it('should have claudeDir containing .claude', () => {
    expect(PATHS.claudeDir).toContain('.claude')
  })

  it('should have settings path ending with settings.json', () => {
    expect(PATHS.settings).toMatch(/settings\.json$/)
  })

  it('should have pluginsDir as a subdirectory of claudeDir', () => {
    expect(PATHS.pluginsDir).toContain(PATHS.claudeDir)
    expect(PATHS.pluginsDir).toContain('plugins')
  })

  it('should have installedPlugins ending with installed_plugins.json', () => {
    expect(PATHS.installedPlugins).toMatch(/installed_plugins\.json$/)
  })

  it('should have knownMarketplaces ending with known_marketplaces.json', () => {
    expect(PATHS.knownMarketplaces).toMatch(/known_marketplaces\.json$/)
  })

  it('should have installCountsCache ending with install-counts-cache.json', () => {
    expect(PATHS.installCountsCache).toMatch(/install-counts-cache\.json$/)
  })

  it('should have marketplacesDir under pluginsDir', () => {
    expect(PATHS.marketplacesDir).toContain(PATHS.pluginsDir)
  })

  it('should have cacheDir under pluginsDir', () => {
    expect(PATHS.cacheDir).toContain(PATHS.pluginsDir)
  })
})

describe('getMarketplaceJsonPath', () => {
  it('should return correct path structure for marketplace', () => {
    const result = getMarketplaceJsonPath('claude-plugins-official')

    expect(result).toContain(PATHS.marketplacesDir)
    expect(result).toContain('claude-plugins-official')
    expect(result).toContain('.claude-plugin')
    expect(result).toMatch(/marketplace\.json$/)
  })

  it('should include all path segments in correct order', () => {
    const marketplaceId = 'test-marketplace'
    const result = getMarketplaceJsonPath(marketplaceId)

    const expectedPath = path.join(
      PATHS.marketplacesDir,
      marketplaceId,
      '.claude-plugin',
      'marketplace.json',
    )
    expect(result).toBe(expectedPath)
  })

  it('should handle marketplace IDs with special characters', () => {
    const result = getMarketplaceJsonPath('my-custom-marketplace')

    expect(result).toContain('my-custom-marketplace')
    expect(result).toMatch(/marketplace\.json$/)
  })
})

describe('getPluginJsonPath', () => {
  it('should return correct path structure with all segments', () => {
    const result = getPluginJsonPath(
      'claude-plugins-official',
      'context7',
      '1.0.0',
    )

    expect(result).toContain(PATHS.cacheDir)
    expect(result).toContain('claude-plugins-official')
    expect(result).toContain('context7')
    expect(result).toContain('1.0.0')
    expect(result).toContain('.claude-plugin')
    expect(result).toMatch(/plugin\.json$/)
  })

  it('should include all path segments in correct order', () => {
    const marketplace = 'test-marketplace'
    const pluginName = 'test-plugin'
    const version = '2.1.0'

    const result = getPluginJsonPath(marketplace, pluginName, version)

    const expectedPath = path.join(
      PATHS.cacheDir,
      marketplace,
      pluginName,
      version,
      '.claude-plugin',
      'plugin.json',
    )
    expect(result).toBe(expectedPath)
  })

  it('should handle semver versions correctly', () => {
    const result = getPluginJsonPath('marketplace', 'plugin', '1.2.3-beta.1')

    expect(result).toContain('1.2.3-beta.1')
    expect(result).toMatch(/plugin\.json$/)
  })

  it('should handle plugin names with hyphens', () => {
    const result = getPluginJsonPath(
      'marketplace',
      'my-awesome-plugin',
      '1.0.0',
    )

    expect(result).toContain('my-awesome-plugin')
    expect(result).toMatch(/plugin\.json$/)
  })
})
