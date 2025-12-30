/**
 * Main App component for Claude Code Plugin Dashboard
 * Interactive TUI to browse and manage Claude Code plugins
 */

import { useState, useEffect, useReducer } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import TabBar, { getNextTab } from './components/TabBar.js'
import KeyHints from './components/KeyHints.js'
import DiscoverTab from './tabs/DiscoverTab.js'
import InstalledTab from './tabs/InstalledTab.js'
import MarketplacesTab from './tabs/MarketplacesTab.js'
import ErrorsTab from './tabs/ErrorsTab.js'
import {
  loadAllPlugins,
  loadMarketplaces,
  searchPlugins,
  sortPlugins,
} from './services/pluginService.js'
import { togglePlugin } from './services/settingsService.js'
import {
  installPlugin,
  uninstallPlugin,
} from './services/pluginActionsService.js'
import ConfirmDialog from './components/ConfirmDialog.js'
import type { AppState, Action, Plugin } from './types/index.js'

/**
 * Initial application state
 */
const initialState: AppState = {
  activeTab: 'discover',
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
}

/**
 * State reducer for application state management
 */
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
        selectedIndex: 0,
        searchQuery: '',
        message: null,
      }

    case 'NEXT_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'next'),
        selectedIndex: 0,
        searchQuery: '',
        message: null,
      }

    case 'PREV_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'prev'),
        selectedIndex: 0,
        searchQuery: '',
        message: null,
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

    default:
      return state
  }
}

/**
 * Get items array for current tab
 */
function getItemsForTab(state: AppState): unknown[] {
  switch (state.activeTab) {
    case 'discover':
      return getFilteredPlugins(state)
    case 'installed':
      return state.plugins.filter((p) => p.isInstalled)
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
function getFilteredPlugins(state: AppState): Plugin[] {
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
  const [isSearchMode, setIsSearchMode] = useState(false)

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

    // Search mode input
    if (isSearchMode) {
      if (key.escape || key.return) {
        setIsSearchMode(false)
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

    // Emacs-style navigation (Ctrl+P / Ctrl+N)
    if (key.ctrl && input === 'p') {
      dispatch({ type: 'MOVE_SELECTION', payload: 'up' })
      return
    }
    if (key.ctrl && input === 'n') {
      dispatch({ type: 'MOVE_SELECTION', payload: 'down' })
      return
    }

    // Tab navigation
    if (key.leftArrow) {
      dispatch({ type: 'PREV_TAB' })
      return
    }
    if (key.rightArrow) {
      dispatch({ type: 'NEXT_TAB' })
      return
    }
    if (key.tab) {
      dispatch({ type: 'NEXT_TAB' })
      return
    }

    // List navigation
    if (key.upArrow) {
      dispatch({ type: 'MOVE_SELECTION', payload: 'up' })
      return
    }
    if (key.downArrow) {
      dispatch({ type: 'MOVE_SELECTION', payload: 'down' })
      return
    }

    // Enter search mode
    if (input === '/' && state.activeTab === 'discover') {
      setIsSearchMode(true)
      return
    }

    // Toggle plugin (Space or Enter)
    if (
      (input === ' ' || key.return) &&
      (state.activeTab === 'discover' || state.activeTab === 'installed')
    ) {
      const items =
        state.activeTab === 'installed'
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

    // Install (i key) - only on discover/installed tabs
    if (
      input === 'i' &&
      (state.activeTab === 'discover' || state.activeTab === 'installed')
    ) {
      const items =
        state.activeTab === 'installed'
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

    // Uninstall (u key) - only on discover/installed tabs
    if (
      input === 'u' &&
      (state.activeTab === 'discover' || state.activeTab === 'installed')
    ) {
      const items =
        state.activeTab === 'installed'
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

    // Exit (q or Ctrl+C)
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit()
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
  const installedPlugins = state.plugins.filter((p) => p.isInstalled)

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color="magenta">
          ⚡ Claude Code Plugin Dashboard
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>v0.1.0</Text>
      </Box>

      {/* Tab bar */}
      <TabBar activeTab={state.activeTab} />

      {/* Tab content */}
      <Box flexGrow={1} flexDirection="column">
        {state.activeTab === 'discover' && (
          <DiscoverTab
            plugins={filteredPlugins}
            selectedIndex={state.selectedIndex}
            searchQuery={state.searchQuery}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            isSearchMode={isSearchMode}
          />
        )}

        {state.activeTab === 'installed' && (
          <InstalledTab
            plugins={installedPlugins}
            selectedIndex={state.selectedIndex}
          />
        )}

        {state.activeTab === 'marketplaces' && (
          <MarketplacesTab
            marketplaces={state.marketplaces}
            selectedIndex={state.selectedIndex}
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

      {/* Status message */}
      {state.message && (
        <Box marginTop={1}>
          <Text color="yellow">{state.message}</Text>
        </Box>
      )}

      {/* Footer with key hints */}
      <KeyHints
        extraHints={
          state.activeTab === 'discover' || state.activeTab === 'installed'
            ? [
                { key: 'i', action: 'install' },
                { key: 'u', action: 'uninstall' },
                ...(state.activeTab === 'discover'
                  ? [{ key: 's', action: 'sort' }]
                  : []),
              ]
            : undefined
        }
      />
    </Box>
  )
}
