/**
 * Unit tests for app.tsx reducer and helper functions
 * Tests appReducer, getItemsForTab, getFilteredPlugins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  AppState,
  Plugin,
  Marketplace,
  PluginError,
} from './types/index.js'

// Mock the services - we test reducer logic only
vi.mock('./services/pluginService.js', () => ({
  loadAllPlugins: vi.fn(() => []),
  loadMarketplaces: vi.fn(() => []),
  searchPlugins: vi.fn((query: string, plugins: Plugin[]) =>
    plugins.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  ),
  sortPlugins: vi.fn((plugins: Plugin[]) => plugins),
}))

vi.mock('./services/settingsService.js', () => ({
  togglePlugin: vi.fn(() => true),
  getEnabledPlugins: vi.fn(() => ({})),
}))

vi.mock('./services/pluginActionsService.js', () => ({
  installPlugin: vi.fn(() =>
    Promise.resolve({ success: true, message: 'Installed' }),
  ),
  uninstallPlugin: vi.fn(() =>
    Promise.resolve({ success: true, message: 'Uninstalled' }),
  ),
}))

// Import after mocks - this imports from the actual app.tsx
import {
  appReducer,
  getItemsForTab,
  getFilteredPlugins,
  getAvailableZones,
  initialState,
} from './app.js'

/**
 * Create mock plugin for testing
 */
function createMockPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test@market',
    name: 'test-plugin',
    marketplace: 'market',
    description: 'Test description',
    version: '1.0.0',
    installCount: 100,
    isInstalled: false,
    isEnabled: false,
    ...overrides,
  }
}

/**
 * Create mock marketplace for testing
 */
function createMockMarketplace(
  overrides: Partial<Marketplace> = {},
): Marketplace {
  return {
    id: 'test-market',
    name: 'Test Market',
    source: { source: 'github', repo: 'test/market' },
    installLocation: '/path/to/market',
    lastUpdated: '2024-01-01T00:00:00Z',
    pluginCount: 10,
    ...overrides,
  }
}

/**
 * Create mock error for testing
 */
function createMockError(overrides: Partial<PluginError> = {}): PluginError {
  return {
    pluginId: 'test@market',
    type: 'installation',
    message: 'Test error',
    timestamp: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('initialState', () => {
  it('should have correct default values', () => {
    expect(initialState.activeTab).toBe('enabled')
    expect(initialState.focusZone).toBe('list')
    expect(initialState.plugins).toEqual([])
    expect(initialState.marketplaces).toEqual([])
    expect(initialState.errors).toEqual([])
    expect(initialState.selectedIndex).toBe(0)
    expect(initialState.searchQuery).toBe('')
    expect(initialState.sortBy).toBe('installs')
    expect(initialState.sortOrder).toBe('desc')
    expect(initialState.loading).toBe(true)
    expect(initialState.error).toBe(null)
    expect(initialState.message).toBe(null)
    expect(initialState.operation).toBe('idle')
    expect(initialState.operationPluginId).toBe(null)
    expect(initialState.confirmUninstall).toBe(false)
    expect(initialState.showHelp).toBe(false)
  })
})

describe('appReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('SET_TAB changes active tab and resets state including focusZone', () => {
      const state: AppState = {
        ...initialState,
        selectedIndex: 5,
        searchQuery: 'test',
        message: 'some message',
        focusZone: 'search',
      }

      const result = appReducer(state, {
        type: 'SET_TAB',
        payload: 'installed',
      })

      expect(result.activeTab).toBe('installed')
      expect(result.selectedIndex).toBe(0)
      expect(result.searchQuery).toBe('')
      expect(result.message).toBe(null)
      expect(result.focusZone).toBe('list')
    })

    it('NEXT_TAB cycles to next tab and resets focusZone', () => {
      const state: AppState = {
        ...initialState,
        activeTab: 'enabled',
        focusZone: 'tabbar',
      }
      const result = appReducer(state, { type: 'NEXT_TAB' })
      expect(result.activeTab).toBe('installed')
      expect(result.focusZone).toBe('list')
    })

    it('PREV_TAB cycles to previous tab and resets focusZone', () => {
      const state: AppState = {
        ...initialState,
        activeTab: 'installed',
        focusZone: 'search',
      }
      const result = appReducer(state, { type: 'PREV_TAB' })
      expect(result.activeTab).toBe('enabled')
      expect(result.focusZone).toBe('list')
    })
  })

  describe('data loading', () => {
    it('SET_PLUGINS sets plugins and clears loading', () => {
      const plugins = [
        createMockPlugin({ id: 'p1@m' }),
        createMockPlugin({ id: 'p2@m' }),
      ]
      const result = appReducer(initialState, {
        type: 'SET_PLUGINS',
        payload: plugins,
      })

      expect(result.plugins).toHaveLength(2)
      expect(result.loading).toBe(false)
    })

    it('SET_MARKETPLACES sets marketplaces', () => {
      const marketplaces = [createMockMarketplace()]
      const result = appReducer(initialState, {
        type: 'SET_MARKETPLACES',
        payload: marketplaces,
      })

      expect(result.marketplaces).toHaveLength(1)
    })

    it('SET_ERRORS sets errors', () => {
      const errors = [createMockError()]
      const result = appReducer(initialState, {
        type: 'SET_ERRORS',
        payload: errors,
      })

      expect(result.errors).toHaveLength(1)
    })
  })

  describe('selection', () => {
    it('SET_SELECTED_INDEX sets index and clears message', () => {
      const state: AppState = { ...initialState, message: 'test' }
      const result = appReducer(state, {
        type: 'SET_SELECTED_INDEX',
        payload: 5,
      })

      expect(result.selectedIndex).toBe(5)
      expect(result.message).toBe(null)
    })

    it('MOVE_SELECTION up decreases index', () => {
      const state: AppState = {
        ...initialState,
        plugins: [
          createMockPlugin({ id: 'p1@m', isInstalled: true, isEnabled: true }),
          createMockPlugin({ id: 'p2@m', isInstalled: true, isEnabled: true }),
        ],
        selectedIndex: 1,
      }
      const result = appReducer(state, {
        type: 'MOVE_SELECTION',
        payload: 'up',
      })

      expect(result.selectedIndex).toBe(0)
    })

    it('MOVE_SELECTION down increases index', () => {
      const state: AppState = {
        ...initialState,
        plugins: [
          createMockPlugin({ id: 'p1@m', isInstalled: true, isEnabled: true }),
          createMockPlugin({ id: 'p2@m', isInstalled: true, isEnabled: true }),
        ],
        selectedIndex: 0,
      }
      const result = appReducer(state, {
        type: 'MOVE_SELECTION',
        payload: 'down',
      })

      expect(result.selectedIndex).toBe(1)
    })

    it('MOVE_SELECTION up at 0 stays at 0', () => {
      const state: AppState = {
        ...initialState,
        plugins: [
          createMockPlugin({ id: 'p1@m', isInstalled: true, isEnabled: true }),
        ],
        selectedIndex: 0,
      }
      const result = appReducer(state, {
        type: 'MOVE_SELECTION',
        payload: 'up',
      })

      expect(result.selectedIndex).toBe(0)
    })

    it('MOVE_SELECTION down at max stays at max', () => {
      const state: AppState = {
        ...initialState,
        plugins: [
          createMockPlugin({ id: 'p1@m', isInstalled: true, isEnabled: true }),
          createMockPlugin({ id: 'p2@m', isInstalled: true, isEnabled: true }),
        ],
        selectedIndex: 1,
      }
      const result = appReducer(state, {
        type: 'MOVE_SELECTION',
        payload: 'down',
      })

      expect(result.selectedIndex).toBe(1)
    })

    it('MOVE_SELECTION does nothing with empty plugins', () => {
      const state: AppState = { ...initialState, selectedIndex: 0 }
      const result = appReducer(state, {
        type: 'MOVE_SELECTION',
        payload: 'down',
      })

      expect(result.selectedIndex).toBe(0)
    })
  })

  describe('search and sort', () => {
    it('SET_SEARCH_QUERY sets query and resets index', () => {
      const state: AppState = { ...initialState, selectedIndex: 5 }
      const result = appReducer(state, {
        type: 'SET_SEARCH_QUERY',
        payload: 'test',
      })

      expect(result.searchQuery).toBe('test')
      expect(result.selectedIndex).toBe(0)
    })

    it('SET_SORT sets sort options and resets index', () => {
      const state: AppState = { ...initialState, selectedIndex: 5 }
      const result = appReducer(state, {
        type: 'SET_SORT',
        payload: { by: 'name', order: 'asc' },
      })

      expect(result.sortBy).toBe('name')
      expect(result.sortOrder).toBe('asc')
      expect(result.selectedIndex).toBe(0)
    })
  })

  describe('plugin state changes', () => {
    it('TOGGLE_PLUGIN_ENABLED toggles plugin enabled state', () => {
      const plugin = createMockPlugin({ id: 'p1@m', isEnabled: false })
      const state: AppState = { ...initialState, plugins: [plugin] }
      const result = appReducer(state, {
        type: 'TOGGLE_PLUGIN_ENABLED',
        payload: 'p1@m',
      })

      expect(result.plugins[0]?.isEnabled).toBe(true)
    })

    it('TOGGLE_PLUGIN_ENABLED does not affect other plugins', () => {
      const plugin1 = createMockPlugin({ id: 'p1@m', isEnabled: false })
      const plugin2 = createMockPlugin({ id: 'p2@m', isEnabled: true })
      const state: AppState = { ...initialState, plugins: [plugin1, plugin2] }
      const result = appReducer(state, {
        type: 'TOGGLE_PLUGIN_ENABLED',
        payload: 'p1@m',
      })

      expect(result.plugins[0]?.isEnabled).toBe(true)
      expect(result.plugins[1]?.isEnabled).toBe(true)
    })

    it('UPDATE_PLUGIN updates specific plugin', () => {
      const plugin = createMockPlugin({ id: 'p1@m', version: '1.0.0' })
      const updatedPlugin = { ...plugin, version: '2.0.0' }
      const state: AppState = { ...initialState, plugins: [plugin] }
      const result = appReducer(state, {
        type: 'UPDATE_PLUGIN',
        payload: updatedPlugin,
      })

      expect(result.plugins[0]?.version).toBe('2.0.0')
    })
  })

  describe('UI state', () => {
    it('SET_LOADING sets loading state', () => {
      const result = appReducer(initialState, {
        type: 'SET_LOADING',
        payload: false,
      })
      expect(result.loading).toBe(false)
    })

    it('SET_ERROR sets error and clears loading', () => {
      const result = appReducer(initialState, {
        type: 'SET_ERROR',
        payload: 'Error message',
      })

      expect(result.error).toBe('Error message')
      expect(result.loading).toBe(false)
    })

    it('SET_MESSAGE sets message', () => {
      const result = appReducer(initialState, {
        type: 'SET_MESSAGE',
        payload: 'Success!',
      })
      expect(result.message).toBe('Success!')
    })
  })

  describe('operations', () => {
    it('START_OPERATION sets installing operation', () => {
      const result = appReducer(initialState, {
        type: 'START_OPERATION',
        payload: { operation: 'installing', pluginId: 'p1@m' },
      })

      expect(result.operation).toBe('installing')
      expect(result.operationPluginId).toBe('p1@m')
      expect(result.message).toBe('Installing p1@m...')
    })

    it('START_OPERATION sets uninstalling operation', () => {
      const result = appReducer(initialState, {
        type: 'START_OPERATION',
        payload: { operation: 'uninstalling', pluginId: 'p1@m' },
      })

      expect(result.operation).toBe('uninstalling')
      expect(result.message).toBe('Uninstalling p1@m...')
    })

    it('END_OPERATION resets operation state', () => {
      const state: AppState = {
        ...initialState,
        operation: 'installing',
        operationPluginId: 'p1@m',
      }
      const result = appReducer(state, { type: 'END_OPERATION' })

      expect(result.operation).toBe('idle')
      expect(result.operationPluginId).toBe(null)
    })
  })

  describe('confirmation dialog', () => {
    it('SHOW_CONFIRM_UNINSTALL shows dialog', () => {
      const result = appReducer(initialState, {
        type: 'SHOW_CONFIRM_UNINSTALL',
        payload: 'p1@m',
      })

      expect(result.confirmUninstall).toBe(true)
      expect(result.operationPluginId).toBe('p1@m')
    })

    it('HIDE_CONFIRM_UNINSTALL hides dialog', () => {
      const state: AppState = {
        ...initialState,
        confirmUninstall: true,
        operationPluginId: 'p1@m',
      }
      const result = appReducer(state, { type: 'HIDE_CONFIRM_UNINSTALL' })

      expect(result.confirmUninstall).toBe(false)
      expect(result.operationPluginId).toBe(null)
    })
  })

  describe('help overlay', () => {
    it('TOGGLE_HELP shows help when hidden', () => {
      const state: AppState = { ...initialState, showHelp: false }
      const result = appReducer(state, { type: 'TOGGLE_HELP' })
      expect(result.showHelp).toBe(true)
    })

    it('TOGGLE_HELP hides help when visible', () => {
      const state: AppState = { ...initialState, showHelp: true }
      const result = appReducer(state, { type: 'TOGGLE_HELP' })
      expect(result.showHelp).toBe(false)
    })
  })

  describe('default case', () => {
    it('returns unchanged state for unknown action', () => {
      // @ts-expect-error - Testing unknown action type
      const result = appReducer(initialState, { type: 'UNKNOWN_ACTION' })
      expect(result).toBe(initialState)
    })
  })
})

describe('getItemsForTab', () => {
  it('returns enabled plugins for enabled tab', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', isInstalled: true, isEnabled: true }),
      createMockPlugin({ id: 'p2@m', isInstalled: true, isEnabled: false }),
      createMockPlugin({ id: 'p3@m', isInstalled: false, isEnabled: false }),
      createMockPlugin({ id: 'p4@m', isInstalled: true, isEnabled: true }),
    ]
    const state: AppState = {
      ...initialState,
      activeTab: 'enabled',
      plugins,
    }

    const result = getItemsForTab(state)
    expect(result).toHaveLength(2) // Only p1 and p4 are installed AND enabled
  })

  it('returns filtered plugins for discover tab', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', name: 'alpha' }),
      createMockPlugin({ id: 'p2@m', name: 'beta' }),
    ]
    const state: AppState = {
      ...initialState,
      activeTab: 'discover',
      plugins,
    }

    const result = getItemsForTab(state)
    expect(result).toHaveLength(2)
  })

  it('returns installed plugins for installed tab', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', isInstalled: true }),
      createMockPlugin({ id: 'p2@m', isInstalled: false }),
      createMockPlugin({ id: 'p3@m', isInstalled: true }),
    ]
    const state: AppState = {
      ...initialState,
      activeTab: 'installed',
      plugins,
    }

    const result = getItemsForTab(state)
    expect(result).toHaveLength(2)
  })

  it('returns marketplaces for marketplaces tab', () => {
    const marketplaces = [
      createMockMarketplace({ id: 'm1' }),
      createMockMarketplace({ id: 'm2' }),
    ]
    const state: AppState = {
      ...initialState,
      activeTab: 'marketplaces',
      marketplaces,
    }

    const result = getItemsForTab(state)
    expect(result).toHaveLength(2)
  })

  it('returns errors for errors tab', () => {
    const errors = [
      createMockError({ pluginId: 'e1@m' }),
      createMockError({ pluginId: 'e2@m' }),
      createMockError({ pluginId: 'e3@m' }),
    ]
    const state: AppState = {
      ...initialState,
      activeTab: 'errors',
      errors,
    }

    const result = getItemsForTab(state)
    expect(result).toHaveLength(3)
  })

  it('returns empty array for unknown tab', () => {
    const state: AppState = {
      ...initialState,
      // @ts-expect-error - Testing unknown tab
      activeTab: 'unknown',
    }

    const result = getItemsForTab(state)
    expect(result).toEqual([])
  })
})

describe('getFilteredPlugins', () => {
  it('returns all plugins when no search query', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', name: 'alpha' }),
      createMockPlugin({ id: 'p2@m', name: 'beta' }),
    ]
    const state: AppState = {
      ...initialState,
      plugins,
      searchQuery: '',
    }

    const result = getFilteredPlugins(state)
    expect(result).toHaveLength(2)
  })

  it('filters plugins by search query', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', name: 'alpha' }),
      createMockPlugin({ id: 'p2@m', name: 'beta' }),
    ]
    const state: AppState = {
      ...initialState,
      plugins,
      searchQuery: 'alpha',
    }

    const result = getFilteredPlugins(state)
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('alpha')
  })

  it('applies sorting to plugins', () => {
    const plugins = [
      createMockPlugin({ id: 'p1@m', name: 'alpha' }),
      createMockPlugin({ id: 'p2@m', name: 'beta' }),
    ]
    const state: AppState = {
      ...initialState,
      plugins,
      sortBy: 'name',
      sortOrder: 'asc',
    }

    // sortPlugins is mocked to return plugins as-is
    const result = getFilteredPlugins(state)
    expect(result).toHaveLength(2)
  })
})

describe('focus zone navigation', () => {
  describe('SET_FOCUS_ZONE', () => {
    it('updates focusZone to tabbar', () => {
      const state: AppState = { ...initialState, focusZone: 'list' }
      const result = appReducer(state, {
        type: 'SET_FOCUS_ZONE',
        payload: 'tabbar',
      })
      expect(result.focusZone).toBe('tabbar')
    })

    it('updates focusZone to search', () => {
      const state: AppState = { ...initialState, focusZone: 'list' }
      const result = appReducer(state, {
        type: 'SET_FOCUS_ZONE',
        payload: 'search',
      })
      expect(result.focusZone).toBe('search')
    })

    it('updates focusZone to list', () => {
      const state: AppState = { ...initialState, focusZone: 'tabbar' }
      const result = appReducer(state, {
        type: 'SET_FOCUS_ZONE',
        payload: 'list',
      })
      expect(result.focusZone).toBe('list')
    })

    it('preserves other state when changing focusZone', () => {
      const state: AppState = {
        ...initialState,
        focusZone: 'list',
        searchQuery: 'test',
        selectedIndex: 5,
      }
      const result = appReducer(state, {
        type: 'SET_FOCUS_ZONE',
        payload: 'search',
      })

      expect(result.focusZone).toBe('search')
      expect(result.searchQuery).toBe('test')
      expect(result.selectedIndex).toBe(5)
    })
  })
})

describe('getAvailableZones', () => {
  it('returns all zones for enabled tab', () => {
    const zones = getAvailableZones('enabled')
    expect(zones).toEqual(['tabbar', 'search', 'list'])
  })

  it('returns all zones for installed tab', () => {
    const zones = getAvailableZones('installed')
    expect(zones).toEqual(['tabbar', 'search', 'list'])
  })

  it('returns all zones for discover tab', () => {
    const zones = getAvailableZones('discover')
    expect(zones).toEqual(['tabbar', 'search', 'list'])
  })

  it('returns all zones for marketplaces tab', () => {
    const zones = getAvailableZones('marketplaces')
    expect(zones).toEqual(['tabbar', 'search', 'list'])
  })

  it('excludes search zone for errors tab', () => {
    const zones = getAvailableZones('errors')
    expect(zones).toEqual(['tabbar', 'list'])
    expect(zones).not.toContain('search')
  })
})
