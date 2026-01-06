/**
 * Main App component for Claude Code Plugin Dashboard
 * Interactive TUI to browse and manage Claude Code plugins
 */

import { useEffect, useReducer } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import TabBar, { getNextTab } from './components/TabBar.js'
import KeyHints from './components/KeyHints.js'
import DiscoverTab from './tabs/DiscoverTab.js'
import EnabledTab from './tabs/EnabledTab.js'
import InstalledTab from './tabs/InstalledTab.js'
import MarketplacesTab from './tabs/MarketplacesTab.js'
import ErrorsTab from './tabs/ErrorsTab.js'
import {
  loadAllPlugins,
  loadMarketplaces,
  searchPlugins,
  searchMarketplaces,
  sortPlugins,
} from './services/pluginService.js'
import { togglePlugin } from './services/settingsService.js'
import {
  installPlugin,
  uninstallPlugin,
} from './services/pluginActionsService.js'
import ConfirmDialog from './components/ConfirmDialog.js'
import HelpOverlay from './components/HelpOverlay.js'
import type { AppState, Action, Plugin, FocusZone } from './types/index.js'
import packageJson from '../package.json' with { type: 'json' }

/**
 * Initial application state
 */
export const initialState: AppState = {
  activeTab: 'enabled',
  focusZone: 'list',
  plugins: [],
  marketplaces: [],
  errors: [],
  selectedIndex: 0,
  searchQuery: '',
  sortBy: 'installs',
  sortOrder: 'desc',
  loading: true,
  error: null,
  message: null,
  operation: 'idle',
  operationPluginId: null,
  confirmUninstall: false,
  showHelp: false,
}

/**
 * Get available focus zones for the current tab
 * Errors tab has no search zone since it doesn't support filtering
 * @param activeTab - The currently active tab
 * @returns Array of available focus zones in navigation order
 */
export function getAvailableZones(
  activeTab: AppState['activeTab'],
): FocusZone[] {
  if (activeTab === 'errors') {
    return ['tabbar', 'list']
  }
  return ['tabbar', 'search', 'list']
}

/**
 * State reducer for application state management
 */
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
        focusZone: 'list',
        selectedIndex: 0,
        searchQuery: '',
        message: null,
      }

    case 'NEXT_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'next'),
        focusZone: 'list',
        selectedIndex: 0,
        searchQuery: '',
        message: null,
      }

    case 'PREV_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'prev'),
        focusZone: 'list',
        selectedIndex: 0,
        searchQuery: '',
        message: null,
      }

    case 'SET_FOCUS_ZONE':
      return {
        ...state,
        focusZone: action.payload,
      }

    case 'SET_PLUGINS':
      return {
        ...state,
        plugins: action.payload,
        loading: false,
      }

    case 'SET_MARKETPLACES':
      return {
        ...state,
        marketplaces: action.payload,
      }

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      }

    case 'SET_SELECTED_INDEX':
      return {
        ...state,
        selectedIndex: action.payload,
        message: null,
      }

    case 'MOVE_SELECTION': {
      const items = getItemsForTab(state)
      const maxIndex = Math.max(0, items.length - 1)

      if (items.length === 0) return state

      const newIndex =
        action.payload === 'up'
          ? Math.max(0, state.selectedIndex - 1)
          : Math.min(maxIndex, state.selectedIndex + 1)

      return {
        ...state,
        selectedIndex: newIndex,
        message: null,
      }
    }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        selectedIndex: 0,
      }

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.by,
        sortOrder: action.payload.order,
        selectedIndex: 0,
      }

    case 'TOGGLE_PLUGIN_ENABLED': {
      const pluginId = action.payload
      const updatedPlugins = state.plugins.map((p) => {
        if (p.id === pluginId) {
          return { ...p, isEnabled: !p.isEnabled }
        }
        return p
      })
      return {
        ...state,
        plugins: updatedPlugins,
      }
    }

    case 'UPDATE_PLUGIN': {
      const updatedPlugins = state.plugins.map((p) => {
        if (p.id === action.payload.id) {
          return action.payload
        }
        return p
      })
      return {
        ...state,
        plugins: updatedPlugins,
      }
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    case 'SET_MESSAGE':
      return {
        ...state,
        message: action.payload,
      }

    case 'START_OPERATION':
      return {
        ...state,
        operation: action.payload.operation,
        operationPluginId: action.payload.pluginId,
        message:
          action.payload.operation === 'installing'
            ? `Installing ${action.payload.pluginId}...`
            : `Uninstalling ${action.payload.pluginId}...`,
      }

    case 'END_OPERATION':
      return {
        ...state,
        operation: 'idle',
        operationPluginId: null,
      }

    case 'SHOW_CONFIRM_UNINSTALL':
      return {
        ...state,
        confirmUninstall: true,
        operationPluginId: action.payload,
      }

    case 'HIDE_CONFIRM_UNINSTALL':
      return {
        ...state,
        confirmUninstall: false,
        operationPluginId: null,
      }

    case 'TOGGLE_HELP':
      return {
        ...state,
        showHelp: !state.showHelp,
      }

    default:
      return state
  }
}

/**
 * Get items array for current tab
 */
export function getItemsForTab(state: AppState): unknown[] {
  switch (state.activeTab) {
    case 'enabled':
      return state.plugins.filter((p) => p.isInstalled && p.isEnabled)
    case 'installed':
      return state.plugins.filter((p) => p.isInstalled)
    case 'discover':
      return getFilteredPlugins(state)
    case 'marketplaces':
      return state.marketplaces
    case 'errors':
      return state.errors
    default:
      return []
  }
}

/**
 * Get filtered and sorted plugins for discover tab
 */
export function getFilteredPlugins(state: AppState): Plugin[] {
  let plugins = state.plugins

  // Apply search filter
  if (state.searchQuery) {
    plugins = searchPlugins(state.searchQuery, plugins)
  }

  // Apply sort
  plugins = sortPlugins(plugins, state.sortBy, state.sortOrder)

  return plugins
}

/**
 * Main App component
 */
export default function App() {
  const { exit } = useApp()
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load data on mount
  useEffect(() => {
    try {
      const plugins = loadAllPlugins()
      const marketplaces = loadMarketplaces()

      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      dispatch({ type: 'SET_MARKETPLACES', payload: marketplaces })
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load data',
      })
    }
  }, [])

  /**
   * Handle plugin installation
   */
  async function handleInstall(pluginId: string) {
    dispatch({
      type: 'START_OPERATION',
      payload: { operation: 'installing', pluginId },
    })

    const result = await installPlugin(pluginId)

    dispatch({ type: 'END_OPERATION' })

    if (result.success) {
      // Reload plugins to get fresh state
      const plugins = loadAllPlugins()
      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
    } else {
      dispatch({
        type: 'SET_MESSAGE',
        payload: `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
      })
    }
  }

  /**
   * Handle plugin uninstallation
   */
  async function handleUninstall(pluginId: string) {
    dispatch({
      type: 'START_OPERATION',
      payload: { operation: 'uninstalling', pluginId },
    })

    const result = await uninstallPlugin(pluginId)

    dispatch({ type: 'END_OPERATION' })

    if (result.success) {
      // Reload plugins to get fresh state
      const plugins = loadAllPlugins()
      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
    } else {
      dispatch({
        type: 'SET_MESSAGE',
        payload: `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
      })
    }
  }

  // Keyboard input handling
  useInput((input, key) => {
    // Block all input during operations
    if (state.operation !== 'idle') {
      return
    }

    // Handle help overlay
    if (state.showHelp) {
      if (input === 'h' || key.escape) {
        dispatch({ type: 'TOGGLE_HELP' })
      }
      return
    }

    // Exit (q or Ctrl+C) - Global handler, works in all focus zones
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit()
      return
    }

    // Toggle help (h key)
    if (input === 'h') {
      dispatch({ type: 'TOGGLE_HELP' })
      return
    }

    // Handle confirmation dialog
    if (state.confirmUninstall && state.operationPluginId) {
      if (input === 'y' || input === 'Y') {
        dispatch({ type: 'HIDE_CONFIRM_UNINSTALL' })
        handleUninstall(state.operationPluginId)
        return
      }
      if (input === 'n' || input === 'N' || key.escape) {
        dispatch({ type: 'HIDE_CONFIRM_UNINSTALL' })
        dispatch({ type: 'SET_MESSAGE', payload: 'Uninstall cancelled' })
        return
      }
      return
    }

    // Search mode input (when focusZone is 'search')
    if (state.focusZone === 'search') {
      // Up arrow: move focus to tabbar
      if (key.upArrow || (key.ctrl && input === 'p')) {
        dispatch({ type: 'SET_FOCUS_ZONE', payload: 'tabbar' })
        return
      }
      // Down arrow, Enter, or Escape: move focus to list
      if (
        key.escape ||
        key.return ||
        key.downArrow ||
        (key.ctrl && input === 'n')
      ) {
        dispatch({ type: 'SET_FOCUS_ZONE', payload: 'list' })
        return
      }
      if (key.backspace || key.delete) {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          payload: state.searchQuery.slice(0, -1),
        })
        return
      }
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          payload: state.searchQuery + input,
        })
        return
      }
      return
    }

    // TabBar focus zone navigation
    if (state.focusZone === 'tabbar') {
      // Down arrow: move to search (or list if no search)
      if (key.downArrow || (key.ctrl && input === 'n')) {
        const zones = getAvailableZones(state.activeTab)
        dispatch({
          type: 'SET_FOCUS_ZONE',
          payload: zones.includes('search') ? 'search' : 'list',
        })
        return
      }
      // Left/Right arrows and Ctrl+B/F: tab switching (only in tabbar)
      // Keep focus on tabbar after navigation
      if (key.leftArrow || (key.ctrl && input === 'b')) {
        dispatch({ type: 'PREV_TAB' })
        dispatch({ type: 'SET_FOCUS_ZONE', payload: 'tabbar' })
        return
      }
      if (key.rightArrow || (key.ctrl && input === 'f')) {
        dispatch({ type: 'NEXT_TAB' })
        dispatch({ type: 'SET_FOCUS_ZONE', payload: 'tabbar' })
        return
      }
      // Tab key: next tab (resets focus to list)
      if (key.tab) {
        dispatch({ type: 'NEXT_TAB' })
        return
      }
      return
    }

    // List focus zone navigation (default zone)
    // Up arrow: move up in list or focus search/tabbar at top
    if (key.upArrow || (key.ctrl && input === 'p')) {
      if (state.selectedIndex === 0) {
        // At top of list: move focus to search (or tabbar if no search)
        const zones = getAvailableZones(state.activeTab)
        dispatch({
          type: 'SET_FOCUS_ZONE',
          payload: zones.includes('search') ? 'search' : 'tabbar',
        })
      } else {
        dispatch({ type: 'MOVE_SELECTION', payload: 'up' })
      }
      return
    }

    // Down arrow: move down in list
    if (key.downArrow || (key.ctrl && input === 'n')) {
      dispatch({ type: 'MOVE_SELECTION', payload: 'down' })
      return
    }

    // Tab key: next tab (from list zone)
    if (key.tab) {
      dispatch({ type: 'NEXT_TAB' })
      return
    }

    // Enter search mode (/ key on supported tabs)
    const searchEnabledTabs = [
      'enabled',
      'installed',
      'discover',
      'marketplaces',
    ]
    if (input === '/' && searchEnabledTabs.includes(state.activeTab)) {
      dispatch({ type: 'SET_FOCUS_ZONE', payload: 'search' })
      return
    }

    // Enter key: Install (non-installed) or Toggle (installed)
    if (
      key.return &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items =
        state.activeTab === 'enabled'
          ? state.plugins.filter((p) => p.isInstalled && p.isEnabled)
          : state.activeTab === 'installed'
            ? state.plugins.filter((p) => p.isInstalled)
            : getFilteredPlugins(state)

      const selectedPlugin = items[state.selectedIndex]
      if (selectedPlugin) {
        if (!selectedPlugin.isInstalled) {
          // Install non-installed plugin
          handleInstall(selectedPlugin.id)
        } else {
          // Toggle installed plugin
          try {
            const newState = togglePlugin(selectedPlugin.id)
            dispatch({
              type: 'TOGGLE_PLUGIN_ENABLED',
              payload: selectedPlugin.id,
            })
            dispatch({
              type: 'SET_MESSAGE',
              payload: newState
                ? `✅ ${selectedPlugin.name} enabled`
                : `❌ ${selectedPlugin.name} disabled`,
            })
          } catch (error) {
            dispatch({
              type: 'SET_MESSAGE',
              payload: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        }
      }
      return
    }

    // Toggle plugin (Space only)
    if (
      input === ' ' &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items =
        state.activeTab === 'enabled'
          ? state.plugins.filter((p) => p.isInstalled && p.isEnabled)
          : state.activeTab === 'installed'
            ? state.plugins.filter((p) => p.isInstalled)
            : getFilteredPlugins(state)

      const selectedPlugin = items[state.selectedIndex]
      if (selectedPlugin && selectedPlugin.isInstalled) {
        try {
          const newState = togglePlugin(selectedPlugin.id)
          dispatch({
            type: 'TOGGLE_PLUGIN_ENABLED',
            payload: selectedPlugin.id,
          })
          dispatch({
            type: 'SET_MESSAGE',
            payload: newState
              ? `✅ ${selectedPlugin.name} enabled`
              : `❌ ${selectedPlugin.name} disabled`,
          })
        } catch (error) {
          dispatch({
            type: 'SET_MESSAGE',
            payload: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        }
      }
      return
    }

    // Cycle sort (s key)
    if (input === 's' && state.activeTab === 'discover') {
      const nextSort: Record<AppState['sortBy'], AppState['sortBy']> = {
        installs: 'name',
        name: 'date',
        date: 'installs',
      }
      dispatch({
        type: 'SET_SORT',
        payload: { by: nextSort[state.sortBy], order: state.sortOrder },
      })
      return
    }

    // Toggle sort order (S key)
    if (input === 'S' && state.activeTab === 'discover') {
      dispatch({
        type: 'SET_SORT',
        payload: {
          by: state.sortBy,
          order: state.sortOrder === 'asc' ? 'desc' : 'asc',
        },
      })
      return
    }

    // Clear search (Escape)
    if (key.escape && state.searchQuery) {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
      return
    }

    // Install (i key) - only on enabled/installed/discover tabs
    if (
      input === 'i' &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items =
        state.activeTab === 'enabled'
          ? state.plugins.filter((p) => p.isInstalled && p.isEnabled)
          : state.activeTab === 'installed'
            ? state.plugins.filter((p) => p.isInstalled)
            : getFilteredPlugins(state)

      const selectedPlugin = items[state.selectedIndex]
      if (selectedPlugin && !selectedPlugin.isInstalled) {
        handleInstall(selectedPlugin.id)
      } else if (selectedPlugin?.isInstalled) {
        dispatch({
          type: 'SET_MESSAGE',
          payload: '⚠️ Plugin is already installed',
        })
      }
      return
    }

    // Uninstall (u key) - only on enabled/installed/discover tabs
    if (
      input === 'u' &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items =
        state.activeTab === 'enabled'
          ? state.plugins.filter((p) => p.isInstalled && p.isEnabled)
          : state.activeTab === 'installed'
            ? state.plugins.filter((p) => p.isInstalled)
            : getFilteredPlugins(state)

      const selectedPlugin = items[state.selectedIndex]
      if (selectedPlugin && selectedPlugin.isInstalled) {
        dispatch({ type: 'SHOW_CONFIRM_UNINSTALL', payload: selectedPlugin.id })
      } else if (selectedPlugin && !selectedPlugin.isInstalled) {
        dispatch({ type: 'SET_MESSAGE', payload: '⚠️ Plugin is not installed' })
      }
      return
    }
  })

  // Loading state
  if (state.loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>Loading plugins...</Text>
      </Box>
    )
  }

  // Error state
  if (state.error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {state.error}</Text>
        <Text dimColor>Press q to exit</Text>
      </Box>
    )
  }

  // Get filtered data for current tab
  const filteredPlugins = getFilteredPlugins(state)

  // Apply search filter to enabled plugins
  const enabledPluginsBase = state.plugins.filter(
    (p) => p.isInstalled && p.isEnabled,
  )
  const enabledPlugins = state.searchQuery
    ? searchPlugins(state.searchQuery, enabledPluginsBase)
    : enabledPluginsBase

  // Apply search filter to installed plugins
  const installedPluginsBase = state.plugins.filter((p) => p.isInstalled)
  const installedPlugins = state.searchQuery
    ? searchPlugins(state.searchQuery, installedPluginsBase)
    : installedPluginsBase

  // Apply search filter to marketplaces
  const filteredMarketplaces = state.searchQuery
    ? searchMarketplaces(state.searchQuery, state.marketplaces)
    : state.marketplaces

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color="magenta">
          ⚡ Claude Code Plugin Dashboard
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>v{packageJson.version}</Text>
      </Box>

      {/* Tab bar */}
      <TabBar
        activeTab={state.activeTab}
        isFocused={state.focusZone === 'tabbar'}
      />

      {/* Tab content */}
      <Box flexGrow={1} flexDirection="column">
        {state.activeTab === 'enabled' && (
          <EnabledTab
            plugins={enabledPlugins}
            selectedIndex={state.selectedIndex}
            searchQuery={state.searchQuery}
            focusZone={state.focusZone}
          />
        )}

        {state.activeTab === 'installed' && (
          <InstalledTab
            plugins={installedPlugins}
            selectedIndex={state.selectedIndex}
            searchQuery={state.searchQuery}
            focusZone={state.focusZone}
          />
        )}

        {state.activeTab === 'discover' && (
          <DiscoverTab
            plugins={filteredPlugins}
            selectedIndex={state.selectedIndex}
            searchQuery={state.searchQuery}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            focusZone={state.focusZone}
          />
        )}

        {state.activeTab === 'marketplaces' && (
          <MarketplacesTab
            marketplaces={filteredMarketplaces}
            selectedIndex={state.selectedIndex}
            searchQuery={state.searchQuery}
            focusZone={state.focusZone}
          />
        )}

        {state.activeTab === 'errors' && (
          <ErrorsTab
            errors={state.errors}
            selectedIndex={state.selectedIndex}
          />
        )}
      </Box>

      {/* Confirmation Dialog */}
      {state.confirmUninstall && state.operationPluginId && (
        <ConfirmDialog message={`Uninstall ${state.operationPluginId}?`} />
      )}

      {/* Help Overlay */}
      <HelpOverlay isVisible={state.showHelp} />

      {/* Status message */}
      {state.message && (
        <Box marginTop={1}>
          <Text color="yellow">{state.message}</Text>
        </Box>
      )}

      {/* Footer with key hints */}
      <KeyHints
        focusZone={state.focusZone}
        extraHints={(() => {
          // Search mode - no extra hints (base hints cover it)
          if (state.focusZone === 'search') {
            return undefined
          }

          // TabBar mode - no extra hints
          if (state.focusZone === 'tabbar') {
            return undefined
          }

          // List mode - add tab-specific hints
          // Plugin tabs hints (enabled, installed, discover)
          if (
            state.activeTab === 'enabled' ||
            state.activeTab === 'installed' ||
            state.activeTab === 'discover'
          ) {
            const hints = [
              { key: '/', action: 'search' },
              { key: 'i', action: 'install' },
              { key: 'u', action: 'uninstall' },
            ]

            // Get selected plugin to determine Enter action
            const items =
              state.activeTab === 'enabled'
                ? enabledPlugins
                : state.activeTab === 'installed'
                  ? installedPlugins
                  : filteredPlugins

            const selectedPlugin = items[state.selectedIndex]

            // Add contextual Enter hint
            if (selectedPlugin) {
              if (!selectedPlugin.isInstalled) {
                hints.push({ key: 'Enter', action: 'install' })
              } else {
                hints.push({ key: 'Enter', action: 'toggle' })
              }
            }

            // Add sort hint for discover tab
            if (state.activeTab === 'discover') {
              hints.push({ key: 's', action: 'sort' })
            }

            return hints
          }

          // Marketplaces tab hints
          if (state.activeTab === 'marketplaces') {
            return [{ key: '/', action: 'search' }]
          }

          return undefined
        })()}
      />
    </Box>
  )
}
