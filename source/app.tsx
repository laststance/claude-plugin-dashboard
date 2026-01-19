/**
 * Main App component for Claude Code Plugin Dashboard
 * Interactive TUI to browse and manage Claude Code plugins
 */

import { useEffect, useReducer } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import { match, P } from 'ts-pattern'
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
import {
  addMarketplace,
  removeMarketplace,
  updateMarketplace,
  toggleAutoUpdate,
} from './services/marketplaceActionsService.js'
import AddMarketplaceDialog from './components/AddMarketplaceDialog.js'
import ConfirmDialog from './components/ConfirmDialog.js'
import HelpOverlay from './components/HelpOverlay.js'
import type {
  AppState,
  Action,
  Plugin,
  Marketplace,
  FocusZone,
  MarketplaceOperation,
} from './types/index.js'
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
  marketplaceOperation: 'idle',
  operationMarketplaceId: null,
  confirmRemoveMarketplace: false,
  showAddMarketplaceDialog: false,
  addMarketplaceError: null,
  showMarketplaceActionMenu: false,
  actionMenuSelectedIndex: 0,
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
 * Get display message for marketplace operation status
 * @param operation - The marketplace operation type
 * @param marketplaceId - Optional marketplace identifier
 * @returns Display message for the operation
 */
function getMarketplaceOperationMessage(
  operation: MarketplaceOperation,
  marketplaceId?: string | null,
): string {
  return match(operation)
    .with('adding', () => 'Adding marketplace...')
    .with('removing', () => `Removing ${marketplaceId}...`)
    .with('updating', () => `Updating ${marketplaceId || 'marketplaces'}...`)
    .with('idle', () => '')
    .exhaustive()
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
        showMarketplaceActionMenu: false,
        actionMenuSelectedIndex: 0,
      }

    case 'NEXT_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'next'),
        focusZone: 'list',
        selectedIndex: 0,
        searchQuery: '',
        message: null,
        showMarketplaceActionMenu: false,
        actionMenuSelectedIndex: 0,
      }

    case 'PREV_TAB':
      return {
        ...state,
        activeTab: getNextTab(state.activeTab, 'prev'),
        focusZone: 'list',
        selectedIndex: 0,
        searchQuery: '',
        message: null,
        showMarketplaceActionMenu: false,
        actionMenuSelectedIndex: 0,
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

    case 'SHOW_CONFIRM_REMOVE_MARKETPLACE':
      return {
        ...state,
        confirmRemoveMarketplace: true,
        operationMarketplaceId: action.payload,
      }

    case 'HIDE_CONFIRM_REMOVE_MARKETPLACE':
      return {
        ...state,
        confirmRemoveMarketplace: false,
        operationMarketplaceId: null,
      }

    case 'SHOW_ADD_MARKETPLACE_DIALOG':
      return {
        ...state,
        showAddMarketplaceDialog: true,
        searchQuery: '', // Reuse searchQuery for dialog input
        addMarketplaceError: null, // Clear previous error
      }

    case 'HIDE_ADD_MARKETPLACE_DIALOG':
      return {
        ...state,
        showAddMarketplaceDialog: false,
        searchQuery: '',
        addMarketplaceError: null,
      }

    case 'SET_ADD_MARKETPLACE_ERROR':
      return {
        ...state,
        addMarketplaceError: action.payload,
      }

    case 'START_MARKETPLACE_OPERATION':
      return {
        ...state,
        marketplaceOperation: action.payload.operation,
        operationMarketplaceId: action.payload.marketplaceId ?? null,
        message: getMarketplaceOperationMessage(
          action.payload.operation,
          action.payload.marketplaceId,
        ),
      }

    case 'END_MARKETPLACE_OPERATION':
      return {
        ...state,
        marketplaceOperation: 'idle',
        operationMarketplaceId: null,
      }

    case 'SHOW_MARKETPLACE_ACTION_MENU':
      return {
        ...state,
        showMarketplaceActionMenu: true,
        actionMenuSelectedIndex: 0,
      }

    case 'HIDE_MARKETPLACE_ACTION_MENU':
      return {
        ...state,
        showMarketplaceActionMenu: false,
        actionMenuSelectedIndex: 0,
      }

    case 'SET_ACTION_MENU_INDEX':
      return {
        ...state,
        actionMenuSelectedIndex: action.payload,
      }

    case 'MOVE_ACTION_MENU_SELECTION': {
      const maxIndex = 3 // 4 actions: browse, update, autoUpdate, remove
      const newIndex =
        action.payload === 'up'
          ? Math.max(0, state.actionMenuSelectedIndex - 1)
          : Math.min(maxIndex, state.actionMenuSelectedIndex + 1)
      return {
        ...state,
        actionMenuSelectedIndex: newIndex,
      }
    }

    default:
      return state
  }
}

/**
 * Get items array for current tab with search filter applied
 * @param state - Current app state
 * @returns Filtered array of items for the active tab
 * @example
 * getItemsForTab({ activeTab: 'installed', searchQuery: 'su', plugins: [...] })
 * // => Only installed plugins matching 'su'
 */
export function getItemsForTab(state: AppState): unknown[] {
  return match(state.activeTab)
    .with('enabled', () => {
      const enabledPlugins = state.plugins.filter(
        (p) => p.isInstalled && p.isEnabled,
      )
      return state.searchQuery
        ? searchPlugins(state.searchQuery, enabledPlugins)
        : enabledPlugins
    })
    .with('installed', () => {
      const installedPlugins = state.plugins.filter((p) => p.isInstalled)
      return state.searchQuery
        ? searchPlugins(state.searchQuery, installedPlugins)
        : installedPlugins
    })
    .with('discover', () => getFilteredPlugins(state))
    .with('marketplaces', () => state.marketplaces)
    .with('errors', () => state.errors)
    .otherwise(() => [])
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
 * Get filtered marketplaces based on search query
 * @param state - Current app state
 * @returns Filtered array of marketplaces
 */
export function getFilteredMarketplaces(state: AppState): Marketplace[] {
  let marketplaces = state.marketplaces

  // Apply search filter
  if (state.searchQuery) {
    marketplaces = searchMarketplaces(state.searchQuery, marketplaces)
  }

  return marketplaces
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

  /**
   * Handle adding a new marketplace
   * @param source - Marketplace source (e.g., "owner/repo", URL, or local path)
   */
  async function handleAddMarketplace(source: string) {
    dispatch({
      type: 'START_MARKETPLACE_OPERATION',
      payload: { operation: 'adding' },
    })

    const result = await addMarketplace(source)

    dispatch({ type: 'END_MARKETPLACE_OPERATION' })

    if (result.success) {
      dispatch({ type: 'HIDE_ADD_MARKETPLACE_DIALOG' })
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch({ type: 'SET_MARKETPLACES', payload: marketplaces })
      // Also reload plugins as new marketplace may have plugins
      const plugins = loadAllPlugins()
      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      // Reset selection to avoid pointing to a different marketplace after re-sort
      dispatch({ type: 'SET_SELECTED_INDEX', payload: 0 })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
    } else {
      // Keep dialog open and show error inline
      dispatch({
        type: 'SET_ADD_MARKETPLACE_ERROR',
        payload: result.error || result.message,
      })
    }
  }

  /**
   * Handle removing a marketplace
   * @param marketplaceId - Marketplace identifier to remove
   */
  async function handleRemoveMarketplace(marketplaceId: string) {
    dispatch({
      type: 'START_MARKETPLACE_OPERATION',
      payload: { operation: 'removing', marketplaceId },
    })

    const result = await removeMarketplace(marketplaceId)

    dispatch({ type: 'END_MARKETPLACE_OPERATION' })

    if (result.success) {
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch({ type: 'SET_MARKETPLACES', payload: marketplaces })
      // Also reload plugins as removed marketplace's plugins should be gone
      const plugins = loadAllPlugins()
      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
      // Reset selection if needed
      if (state.selectedIndex >= marketplaces.length) {
        dispatch({
          type: 'SET_SELECTED_INDEX',
          payload: Math.max(0, marketplaces.length - 1),
        })
      }
    } else {
      dispatch({
        type: 'SET_MESSAGE',
        payload: `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
      })
    }
  }

  /**
   * Handle updating a marketplace (or all marketplaces)
   * @param marketplaceId - Optional marketplace identifier. If omitted, updates all.
   */
  async function handleUpdateMarketplace(marketplaceId?: string) {
    dispatch({
      type: 'START_MARKETPLACE_OPERATION',
      payload: { operation: 'updating', marketplaceId },
    })

    const result = await updateMarketplace(marketplaceId)

    dispatch({ type: 'END_MARKETPLACE_OPERATION' })

    if (result.success) {
      // Reload marketplaces and plugins to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch({ type: 'SET_MARKETPLACES', payload: marketplaces })
      const plugins = loadAllPlugins()
      dispatch({ type: 'SET_PLUGINS', payload: plugins })
      // Reset selection to avoid pointing to a different marketplace after re-sort
      dispatch({ type: 'SET_SELECTED_INDEX', payload: 0 })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
    } else {
      dispatch({
        type: 'SET_MESSAGE',
        payload: `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
      })
    }
  }

  /**
   * Handle toggling auto-update for a marketplace
   * @param marketplaceId - ID of the marketplace
   * @param currentValue - Current auto-update state
   */
  async function handleToggleAutoUpdate(
    marketplaceId: string,
    currentValue: boolean,
  ) {
    dispatch({
      type: 'START_MARKETPLACE_OPERATION',
      payload: { operation: 'updating', marketplaceId },
    })

    const result = await toggleAutoUpdate(marketplaceId, currentValue)

    dispatch({ type: 'END_MARKETPLACE_OPERATION' })

    if (result.success) {
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch({ type: 'SET_MARKETPLACES', payload: marketplaces })
      dispatch({ type: 'SET_MESSAGE', payload: `✅ ${result.message}` })
    } else {
      dispatch({
        type: 'SET_MESSAGE',
        payload: `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
      })
    }
  }

  /**
   * Handle browsing plugins for a specific marketplace
   * Switches to Discover tab with marketplace filter applied
   * @param marketplaceId - ID of the marketplace to browse
   */
  function handleBrowseMarketplacePlugins(marketplaceId: string) {
    // Switch to Discover tab
    dispatch({ type: 'SET_TAB', payload: 'discover' })
    // Set search query to filter by marketplace
    dispatch({ type: 'SET_SEARCH_QUERY', payload: marketplaceId })
    dispatch({
      type: 'SET_MESSAGE',
      payload: `Browsing plugins from ${marketplaceId}`,
    })
  }

  // Keyboard input handling
  useInput((input, key) => {
    // Block all input during operations (plugin or marketplace)
    if (state.operation !== 'idle' || state.marketplaceOperation !== 'idle') {
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

    // Handle plugin uninstall confirmation dialog
    if (state.confirmUninstall && state.operationPluginId) {
      if (input === 'y' || input === 'Y' || key.return) {
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

    // Handle marketplace remove confirmation dialog
    if (state.confirmRemoveMarketplace && state.operationMarketplaceId) {
      if (input === 'y' || input === 'Y' || key.return) {
        dispatch({ type: 'HIDE_CONFIRM_REMOVE_MARKETPLACE' })
        handleRemoveMarketplace(state.operationMarketplaceId)
        return
      }
      if (input === 'n' || input === 'N' || key.escape) {
        dispatch({ type: 'HIDE_CONFIRM_REMOVE_MARKETPLACE' })
        dispatch({ type: 'SET_MESSAGE', payload: 'Remove cancelled' })
        return
      }
      return
    }

    // Handle add marketplace dialog input
    if (state.showAddMarketplaceDialog) {
      // Submit on Enter
      if (key.return && state.searchQuery.trim()) {
        handleAddMarketplace(state.searchQuery.trim())
        return
      }
      // Cancel on Escape
      if (key.escape) {
        dispatch({ type: 'HIDE_ADD_MARKETPLACE_DIALOG' })
        dispatch({ type: 'SET_MESSAGE', payload: 'Add marketplace cancelled' })
        return
      }
      // Backspace
      if (key.backspace || key.delete) {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          payload: state.searchQuery.slice(0, -1),
        })
        return
      }
      // Character input
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          payload: state.searchQuery + input,
        })
        return
      }
      return
    }

    // Handle marketplace action menu
    if (state.showMarketplaceActionMenu) {
      const selectedMarketplace =
        getFilteredMarketplaces(state)[state.selectedIndex]
      if (!selectedMarketplace) {
        dispatch({ type: 'HIDE_MARKETPLACE_ACTION_MENU' })
        return
      }

      // Up/Down arrow navigation
      if (key.upArrow || (key.ctrl && input === 'p')) {
        dispatch({ type: 'MOVE_ACTION_MENU_SELECTION', payload: 'up' })
        return
      }
      if (key.downArrow || (key.ctrl && input === 'n')) {
        dispatch({ type: 'MOVE_ACTION_MENU_SELECTION', payload: 'down' })
        return
      }

      // Execute action on Enter
      if (key.return) {
        dispatch({ type: 'HIDE_MARKETPLACE_ACTION_MENU' })
        const actionIndex = state.actionMenuSelectedIndex
        if (actionIndex === 0) {
          // Browse plugins
          handleBrowseMarketplacePlugins(selectedMarketplace.id)
        } else if (actionIndex === 1) {
          // Update marketplace
          handleUpdateMarketplace(selectedMarketplace.id)
        } else if (actionIndex === 2) {
          // Toggle auto-update
          handleToggleAutoUpdate(
            selectedMarketplace.id,
            selectedMarketplace.autoUpdate ?? false,
          )
        } else if (actionIndex === 3) {
          // Remove marketplace (show confirmation)
          dispatch({
            type: 'SHOW_CONFIRM_REMOVE_MARKETPLACE',
            payload: selectedMarketplace.id,
          })
        }
        return
      }

      // Close menu on Escape
      if (key.escape) {
        dispatch({ type: 'HIDE_MARKETPLACE_ACTION_MENU' })
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
      const items = getItemsForTab(state) as Plugin[]
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
      const items = getItemsForTab(state) as Plugin[]
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

    // Marketplace-specific key bindings
    if (state.activeTab === 'marketplaces' && state.focusZone === 'list') {
      // Open action menu (Enter or m key)
      if (key.return || input === 'm') {
        const selectedMarketplace = filteredMarketplaces[state.selectedIndex]
        if (selectedMarketplace) {
          dispatch({ type: 'SHOW_MARKETPLACE_ACTION_MENU' })
        }
        return
      }

      // Add marketplace (a key)
      if (input === 'a') {
        dispatch({ type: 'SHOW_ADD_MARKETPLACE_DIALOG' })
        return
      }

      // Remove marketplace (d key or Backspace)
      if (input === 'd' || key.backspace || key.delete) {
        const selectedMarketplace = filteredMarketplaces[state.selectedIndex]
        if (selectedMarketplace) {
          dispatch({
            type: 'SHOW_CONFIRM_REMOVE_MARKETPLACE',
            payload: selectedMarketplace.id,
          })
        }
        return
      }

      // Update marketplace (u key)
      if (input === 'u') {
        const selectedMarketplace = filteredMarketplaces[state.selectedIndex]
        if (selectedMarketplace) {
          handleUpdateMarketplace(selectedMarketplace.id)
        } else {
          // No marketplace selected, update all
          handleUpdateMarketplace()
        }
        return
      }
    }

    // Install (i key) - only on enabled/installed/discover tabs
    if (
      input === 'i' &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items = getItemsForTab(state) as Plugin[]
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
      const items = getItemsForTab(state) as Plugin[]
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

      {/* Tab content - key props force React to unmount/remount on tab switch */}
      <Box flexGrow={1} flexDirection="column">
        {match(state.activeTab)
          .with('enabled', () => (
            <EnabledTab
              key="enabled"
              plugins={enabledPlugins}
              selectedIndex={state.selectedIndex}
              searchQuery={state.searchQuery}
              focusZone={state.focusZone}
            />
          ))
          .with('installed', () => (
            <InstalledTab
              key="installed"
              plugins={installedPlugins}
              selectedIndex={state.selectedIndex}
              searchQuery={state.searchQuery}
              focusZone={state.focusZone}
            />
          ))
          .with('discover', () => (
            <DiscoverTab
              key="discover"
              plugins={filteredPlugins}
              selectedIndex={state.selectedIndex}
              searchQuery={state.searchQuery}
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              focusZone={state.focusZone}
            />
          ))
          .with('marketplaces', () => (
            <MarketplacesTab
              key="marketplaces"
              marketplaces={filteredMarketplaces}
              selectedIndex={state.selectedIndex}
              searchQuery={state.searchQuery}
              focusZone={state.focusZone}
              showActionMenu={state.showMarketplaceActionMenu}
              actionMenuSelectedIndex={state.actionMenuSelectedIndex}
            />
          ))
          .with('errors', () => (
            <ErrorsTab
              key="errors"
              errors={state.errors}
              selectedIndex={state.selectedIndex}
            />
          ))
          .exhaustive()}
      </Box>

      {/* Plugin Uninstall Confirmation Dialog */}
      {state.confirmUninstall && state.operationPluginId && (
        <ConfirmDialog message={`Uninstall ${state.operationPluginId}?`} />
      )}

      {/* Marketplace Remove Confirmation Dialog */}
      {state.confirmRemoveMarketplace && state.operationMarketplaceId && (
        <ConfirmDialog
          message={`Remove marketplace ${state.operationMarketplaceId}?`}
        />
      )}

      {/* Add Marketplace Dialog */}
      {state.showAddMarketplaceDialog && (
        <AddMarketplaceDialog
          value={state.searchQuery}
          error={state.addMarketplaceError ?? undefined}
        />
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
        extraHints={match([state.focusZone, state.activeTab] as const)
          .with(['search', P._], () => undefined)
          .with(['tabbar', P._], () => undefined)
          .with(['list', 'enabled'], () => {
            const hints = [
              { key: '/', action: 'search' },
              { key: 'i', action: 'install' },
              { key: 'u', action: 'uninstall' },
            ]
            const selectedPlugin = enabledPlugins[state.selectedIndex]
            if (selectedPlugin) {
              hints.push({
                key: 'Enter',
                action: selectedPlugin.isInstalled ? 'toggle' : 'install',
              })
            }
            return hints
          })
          .with(['list', 'installed'], () => {
            const hints = [
              { key: '/', action: 'search' },
              { key: 'i', action: 'install' },
              { key: 'u', action: 'uninstall' },
            ]
            const selectedPlugin = installedPlugins[state.selectedIndex]
            if (selectedPlugin) {
              hints.push({
                key: 'Enter',
                action: selectedPlugin.isInstalled ? 'toggle' : 'install',
              })
            }
            return hints
          })
          .with(['list', 'discover'], () => {
            const hints = [
              { key: '/', action: 'search' },
              { key: 'i', action: 'install' },
              { key: 'u', action: 'uninstall' },
            ]
            const selectedPlugin = filteredPlugins[state.selectedIndex]
            if (selectedPlugin) {
              hints.push({
                key: 'Enter',
                action: selectedPlugin.isInstalled ? 'toggle' : 'install',
              })
            }
            hints.push({ key: 's', action: 'sort' })
            return hints
          })
          .with(['list', 'marketplaces'], () => [
            { key: '/', action: 'search' },
            { key: 'a', action: 'add' },
            { key: 'd', action: 'remove' },
            { key: 'u', action: 'update' },
          ])
          .with(['list', 'errors'], () => undefined)
          .otherwise(() => undefined)}
      />
    </Box>
  )
}
