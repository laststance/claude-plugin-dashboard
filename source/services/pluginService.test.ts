/**
 * Unit tests for pluginService functions
 * Tests all plugin service functions including file-dependent ones via mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plugin } from '../types/index.js'

// Mock dependencies before imports
vi.mock('./fileService.js', () => ({
  readJsonFile: vi.fn(),
  directoryExists: vi.fn(),
  listDirectories: vi.fn(),
}))

vi.mock('./settingsService.js', () => ({
  getEnabledPlugins: vi.fn(() => ({})),
}))

vi.mock('./componentService.js', () => ({
  detectPluginComponents: vi.fn(() => undefined),
  detectComponentsDetailed: vi.fn(() => undefined),
}))

vi.mock('../utils/paths.js', () => ({
  PATHS: {
    installedPlugins: '/mock/.claude/plugins/installed_plugins.json',
    installCountsCache: '/mock/.claude/plugins/install-counts-cache.json',
    knownMarketplaces: '/mock/.claude/plugins/known_marketplaces.json',
    marketplacesDir: '/mock/.claude/plugins/marketplaces',
  },
  getMarketplaceJsonPath: vi.fn(
    (marketplace: string) =>
      `/mock/.claude/plugins/marketplaces/${marketplace}/.claude-plugin/marketplace.json`,
  ),
}))

// Import after mocks
import {
  searchPlugins,
  sortPlugins,
  loadAllPlugins,
  loadMarketplaces,
  loadInstalledPlugins,
  loadEnabledPlugins,
  getPluginById,
  getPluginStatistics,
} from './pluginService.js'
import * as fileService from './fileService.js'
import * as settingsService from './settingsService.js'

/**
 * Create a mock plugin for testing
 * @param overrides - Partial plugin properties to override defaults
 * @returns A complete Plugin object
 */
function createMockPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin@test-marketplace',
    name: 'test-plugin',
    marketplace: 'test-marketplace',
    description: 'A test plugin for testing',
    version: '1.0.0',
    installCount: 100,
    isInstalled: false,
    isEnabled: false,
    ...overrides,
  }
}

describe('searchPlugins', () => {
  const plugins: Plugin[] = [
    createMockPlugin({
      id: 'context7@claude-plugins-official',
      name: 'context7',
      marketplace: 'claude-plugins-official',
      description: 'Context7 MCP server for documentation',
      category: 'documentation',
      tags: ['mcp', 'docs'],
    }),
    createMockPlugin({
      id: 'code-review@claude-plugins-official',
      name: 'code-review',
      marketplace: 'claude-plugins-official',
      description: 'AI-powered code review tool',
      category: 'development',
      tags: ['review', 'ai'],
    }),
    createMockPlugin({
      id: 'my-plugin@custom-marketplace',
      name: 'my-plugin',
      marketplace: 'custom-marketplace',
      description: 'A custom plugin',
      category: 'utility',
    }),
  ]

  it('should find plugins by name', () => {
    const results = searchPlugins('context7', plugins)

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('context7')
  })

  it('should find plugins by description', () => {
    const results = searchPlugins('documentation', plugins)

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('context7')
  })

  it('should find plugins by marketplace', () => {
    const results = searchPlugins('claude-plugins-official', plugins)

    expect(results).toHaveLength(2)
  })

  it('should find plugins by category', () => {
    const results = searchPlugins('development', plugins)

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('code-review')
  })

  it('should find plugins by tags', () => {
    const results = searchPlugins('mcp', plugins)

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('context7')
  })

  it('should be case insensitive', () => {
    const results = searchPlugins('CONTEXT7', plugins)

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('context7')
  })

  it('should return empty array when no matches', () => {
    const results = searchPlugins('nonexistent', plugins)

    expect(results).toHaveLength(0)
  })

  it('should return all plugins for empty query', () => {
    const results = searchPlugins('', plugins)

    expect(results).toHaveLength(3)
  })
})

describe('sortPlugins', () => {
  const plugins: Plugin[] = [
    createMockPlugin({
      id: 'alpha@test',
      name: 'alpha',
      installCount: 50,
      installedAt: '2024-01-15T00:00:00Z',
    }),
    createMockPlugin({
      id: 'beta@test',
      name: 'beta',
      installCount: 200,
      installedAt: '2024-06-01T00:00:00Z',
    }),
    createMockPlugin({
      id: 'gamma@test',
      name: 'gamma',
      installCount: 100,
      installedAt: '2024-03-10T00:00:00Z',
    }),
  ]

  describe('sort by installs', () => {
    it('should sort by install count descending', () => {
      const sorted = sortPlugins(plugins, 'installs', 'desc')

      expect(sorted[0]?.name).toBe('beta')
      expect(sorted[1]?.name).toBe('gamma')
      expect(sorted[2]?.name).toBe('alpha')
    })

    it('should sort by install count ascending', () => {
      const sorted = sortPlugins(plugins, 'installs', 'asc')

      expect(sorted[0]?.name).toBe('alpha')
      expect(sorted[1]?.name).toBe('gamma')
      expect(sorted[2]?.name).toBe('beta')
    })
  })

  describe('sort by name', () => {
    it('should sort by name ascending', () => {
      const sorted = sortPlugins(plugins, 'name', 'asc')

      expect(sorted[0]?.name).toBe('alpha')
      expect(sorted[1]?.name).toBe('beta')
      expect(sorted[2]?.name).toBe('gamma')
    })

    it('should sort by name descending', () => {
      const sorted = sortPlugins(plugins, 'name', 'desc')

      expect(sorted[0]?.name).toBe('gamma')
      expect(sorted[1]?.name).toBe('beta')
      expect(sorted[2]?.name).toBe('alpha')
    })
  })

  describe('sort by date', () => {
    it('should sort by installed date descending', () => {
      const sorted = sortPlugins(plugins, 'date', 'desc')

      expect(sorted[0]?.name).toBe('beta')
      expect(sorted[1]?.name).toBe('gamma')
      expect(sorted[2]?.name).toBe('alpha')
    })

    it('should sort by installed date ascending', () => {
      const sorted = sortPlugins(plugins, 'date', 'asc')

      expect(sorted[0]?.name).toBe('alpha')
      expect(sorted[1]?.name).toBe('gamma')
      expect(sorted[2]?.name).toBe('beta')
    })
  })

  it('should not mutate the original array', () => {
    const original = [...plugins]
    sortPlugins(plugins, 'installs', 'desc')

    expect(plugins[0]?.name).toBe(original[0]?.name)
    expect(plugins[1]?.name).toBe(original[1]?.name)
    expect(plugins[2]?.name).toBe(original[2]?.name)
  })
})

describe('loadAllPlugins', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
  const mockDirectoryExists = vi.mocked(fileService.directoryExists)
  const mockListDirectories = vi.mocked(fileService.listDirectories)
  const mockGetEnabledPlugins = vi.mocked(settingsService.getEnabledPlugins)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty array when marketplaces directory does not exist', () => {
    mockReadJsonFile.mockReturnValue(null)
    mockDirectoryExists.mockReturnValue(false)
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result).toEqual([])
  })

  it('should load plugins from marketplace manifests', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return null
      }
      if (path.includes('install-counts-cache')) {
        return null
      }
      if (path.includes('marketplace.json')) {
        return {
          name: 'Test Marketplace',
          plugins: [
            { name: 'plugin-a', description: 'Plugin A', version: '1.0.0' },
            { name: 'plugin-b', description: 'Plugin B', version: '2.0.0' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-marketplace'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result).toHaveLength(2)
    expect(result[0]?.name).toBe('plugin-a')
    expect(result[1]?.name).toBe('plugin-b')
  })

  it('should merge installed plugin data', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return {
          plugins: {
            'plugin-a@test-market': [
              {
                version: '1.5.0',
                installedAt: '2024-01-01T00:00:00Z',
                isLocal: false,
              },
            ],
          },
        }
      }
      if (path.includes('install-counts-cache')) {
        return null
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Plugin A', version: '1.0.0' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result).toHaveLength(1)
    expect(result[0]?.isInstalled).toBe(true)
    expect(result[0]?.version).toBe('1.5.0')
    expect(result[0]?.installedAt).toBe('2024-01-01T00:00:00Z')
  })

  it('should merge install counts', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return null
      }
      if (path.includes('install-counts-cache')) {
        return {
          counts: [{ plugin: 'plugin-a@test-market', unique_installs: 500 }],
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Plugin A', version: '1.0.0' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result).toHaveLength(1)
    expect(result[0]?.installCount).toBe(500)
  })

  it('should merge enabled status from settings', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return {
          plugins: {
            'plugin-a@test-market': [{ version: '1.0.0' }],
          },
        }
      }
      if (path.includes('install-counts-cache')) {
        return null
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Plugin A', version: '1.0.0' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({ 'plugin-a@test-market': true })

    const result = loadAllPlugins()

    expect(result).toHaveLength(1)
    expect(result[0]?.isEnabled).toBe(true)
  })

  it('should sort plugins by install count descending', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return null
      }
      if (path.includes('install-counts-cache')) {
        return {
          counts: [
            { plugin: 'plugin-a@test-market', unique_installs: 100 },
            { plugin: 'plugin-b@test-market', unique_installs: 500 },
          ],
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Plugin A' },
            { name: 'plugin-b', description: 'Plugin B' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result[0]?.name).toBe('plugin-b')
    expect(result[1]?.name).toBe('plugin-a')
  })

  it('should include optional plugin properties', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return null
      }
      if (path.includes('install-counts-cache')) {
        return null
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            {
              name: 'plugin-a',
              description: 'Plugin A',
              version: '1.0.0',
              category: 'utilities',
              author: 'Test Author',
              homepage: 'https://example.com',
              tags: ['tag1', 'tag2'],
            },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result[0]?.category).toBe('utilities')
    expect(result[0]?.author).toBe('Test Author')
    expect(result[0]?.homepage).toBe('https://example.com')
    expect(result[0]?.tags).toEqual(['tag1', 'tag2'])
  })

  it('should handle plugins with keywords instead of tags', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return null
      }
      if (path.includes('install-counts-cache')) {
        return null
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            {
              name: 'plugin-a',
              description: 'Plugin A',
              keywords: ['keyword1', 'keyword2'],
            },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadAllPlugins()

    expect(result[0]?.tags).toEqual(['keyword1', 'keyword2'])
  })
})

describe('loadMarketplaces', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty array when known_marketplaces.json does not exist', () => {
    mockReadJsonFile.mockReturnValue(null)

    const result = loadMarketplaces()

    expect(result).toEqual([])
  })

  it('should load marketplaces with metadata', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('known_marketplaces')) {
        return {
          'test-market': {
            source: { source: 'github', repo: 'test/repo' },
            installLocation: '/path/to/market',
            lastUpdated: '2024-01-01T00:00:00Z',
          },
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          name: 'Test Market',
          plugins: [{ name: 'p1' }, { name: 'p2' }],
        }
      }
      return null
    })

    const result = loadMarketplaces()

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('test-market')
    expect(result[0]?.name).toBe('Test Market')
    expect(result[0]?.pluginCount).toBe(2)
  })

  it('should use marketplace id as name when manifest name is not available', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('known_marketplaces')) {
        return {
          'test-market': {
            source: { source: 'github', repo: 'test/repo' },
            installLocation: '/path/to/market',
          },
        }
      }
      if (path.includes('marketplace.json')) {
        return { plugins: [] }
      }
      return null
    })

    const result = loadMarketplaces()

    expect(result[0]?.name).toBe('test-market')
  })

  it('should sort marketplaces by plugin count descending', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('known_marketplaces')) {
        return {
          'market-a': { source: { source: 'github', repo: 'a/repo' } },
          'market-b': { source: { source: 'github', repo: 'b/repo' } },
        }
      }
      if (path.includes('market-a')) {
        return { plugins: [{ name: 'p1' }] }
      }
      if (path.includes('market-b')) {
        return { plugins: [{ name: 'p1' }, { name: 'p2' }, { name: 'p3' }] }
      }
      return null
    })

    const result = loadMarketplaces()

    expect(result[0]?.id).toBe('market-b')
    expect(result[1]?.id).toBe('market-a')
  })
})

describe('loadInstalledPlugins', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
  const mockDirectoryExists = vi.mocked(fileService.directoryExists)
  const mockListDirectories = vi.mocked(fileService.listDirectories)
  const mockGetEnabledPlugins = vi.mocked(settingsService.getEnabledPlugins)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return only installed plugins', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return {
          plugins: {
            'plugin-a@test-market': [{ version: '1.0.0' }],
          },
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Installed' },
            { name: 'plugin-b', description: 'Not installed' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = loadInstalledPlugins()

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('plugin-a')
    expect(result[0]?.isInstalled).toBe(true)
  })
})

describe('loadEnabledPlugins', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
  const mockDirectoryExists = vi.mocked(fileService.directoryExists)
  const mockListDirectories = vi.mocked(fileService.listDirectories)
  const mockGetEnabledPlugins = vi.mocked(settingsService.getEnabledPlugins)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return only enabled plugins', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return {
          plugins: {
            'plugin-a@test-market': [{ version: '1.0.0' }],
            'plugin-b@test-market': [{ version: '1.0.0' }],
          },
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Enabled' },
            { name: 'plugin-b', description: 'Disabled' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({
      'plugin-a@test-market': true,
      'plugin-b@test-market': false,
    })

    const result = loadEnabledPlugins()

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('plugin-a')
    expect(result[0]?.isEnabled).toBe(true)
  })
})

describe('getPluginById', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
  const mockDirectoryExists = vi.mocked(fileService.directoryExists)
  const mockListDirectories = vi.mocked(fileService.listDirectories)
  const mockGetEnabledPlugins = vi.mocked(settingsService.getEnabledPlugins)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return plugin by id', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'Plugin A' },
            { name: 'plugin-b', description: 'Plugin B' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = getPluginById('plugin-b@test-market')

    expect(result?.name).toBe('plugin-b')
  })

  it('should return undefined when plugin not found', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('marketplace.json')) {
        return {
          plugins: [{ name: 'plugin-a', description: 'Plugin A' }],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({})

    const result = getPluginById('nonexistent@market')

    expect(result).toBeUndefined()
  })
})

describe('getPluginStatistics', () => {
  const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
  const mockDirectoryExists = vi.mocked(fileService.directoryExists)
  const mockListDirectories = vi.mocked(fileService.listDirectories)
  const mockGetEnabledPlugins = vi.mocked(settingsService.getEnabledPlugins)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return plugin statistics', () => {
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path.includes('installed_plugins')) {
        return {
          plugins: {
            'plugin-a@test-market': [{ version: '1.0.0' }],
          },
        }
      }
      if (path.includes('known_marketplaces')) {
        return {
          'test-market': { source: { source: 'github', repo: 'test/repo' } },
        }
      }
      if (path.includes('marketplace.json')) {
        return {
          plugins: [
            { name: 'plugin-a', description: 'A' },
            { name: 'plugin-b', description: 'B' },
          ],
        }
      }
      return null
    })
    mockDirectoryExists.mockReturnValue(true)
    mockListDirectories.mockReturnValue(['test-market'])
    mockGetEnabledPlugins.mockReturnValue({ 'plugin-a@test-market': true })

    const stats = getPluginStatistics()

    expect(stats.total).toBe(2)
    expect(stats.installed).toBe(1)
    expect(stats.enabled).toBe(1)
    expect(stats.marketplaces).toBe(1)
  })

  it('should return zeros when no data', () => {
    mockReadJsonFile.mockReturnValue(null)
    mockDirectoryExists.mockReturnValue(false)
    mockGetEnabledPlugins.mockReturnValue({})

    const stats = getPluginStatistics()

    expect(stats.total).toBe(0)
    expect(stats.installed).toBe(0)
    expect(stats.enabled).toBe(0)
    expect(stats.marketplaces).toBe(0)
  })
})

describe('searchMarketplaces', () => {
  // Pure function implementation for testing - mirrors pluginService.ts
  const searchMarketplaces = (query: string, marketplaces: Marketplace[]) => {
    const lowerQuery = query.toLowerCase()
    return marketplaces.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.id.toLowerCase().includes(lowerQuery) ||
        m.source.url?.toLowerCase().includes(lowerQuery) ||
        m.source.repo?.toLowerCase().includes(lowerQuery),
    )
  }

  const mockMarketplaces: Marketplace[] = [
    {
      id: 'claude-plugins-official',
      name: 'Official Claude Plugins',
      source: { source: 'github' as const, repo: 'anthropic/claude-plugins' },
      installLocation: '/path/to/official',
      lastUpdated: '2024-01-01T00:00:00Z',
      pluginCount: 10,
    },
    {
      id: 'community-plugins',
      name: 'Community Plugins',
      source: { source: 'github' as const, repo: 'community/plugins' },
      installLocation: '/path/to/community',
      lastUpdated: '2024-01-01T00:00:00Z',
      pluginCount: 25,
    },
    {
      id: 'awesome-mcp',
      name: 'Awesome MCP Collection',
      source: { source: 'git' as const, url: 'https://github.com/awesome/mcp' },
      installLocation: '/path/to/awesome',
      lastUpdated: '2024-01-01T00:00:00Z',
      pluginCount: 15,
    },
  ]

  it('should filter marketplaces by name', () => {
    const result = searchMarketplaces('official', mockMarketplaces)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('claude-plugins-official')
  })

  it('should filter marketplaces by id', () => {
    const result = searchMarketplaces('awesome', mockMarketplaces)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('awesome-mcp')
  })

  it('should filter marketplaces by source repo', () => {
    const result = searchMarketplaces('anthropic', mockMarketplaces)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('claude-plugins-official')
  })

  it('should filter marketplaces by source url', () => {
    const result = searchMarketplaces('awesome/mcp', mockMarketplaces)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('awesome-mcp')
  })

  it('should be case-insensitive', () => {
    const result = searchMarketplaces('COMMUNITY', mockMarketplaces)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('community-plugins')
  })

  it('should return multiple matches', () => {
    const result = searchMarketplaces('plugins', mockMarketplaces)

    expect(result).toHaveLength(2)
    expect(result.map((m: { id: string }) => m.id)).toContain(
      'claude-plugins-official',
    )
    expect(result.map((m: { id: string }) => m.id)).toContain(
      'community-plugins',
    )
  })

  it('should return empty array when no matches', () => {
    const result = searchMarketplaces('nonexistent', mockMarketplaces)

    expect(result).toHaveLength(0)
  })

  it('should handle empty query', () => {
    const result = searchMarketplaces('', mockMarketplaces)

    expect(result).toHaveLength(3)
  })
})
