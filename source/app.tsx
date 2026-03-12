/**
 * Main App component for Claude Code Plugin Dashboard
 * Interactive TUI to browse and manage Claude Code plugins
 */

import { useEffect, useMemo } from 'react'
import * as os from 'node:os'
import * as path from 'node:path'
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
import {
  getSkillDetailedInfo,
  getMarkdownComponentDetailedInfo,
} from './services/componentService.js'
import { flattenComponents } from './components/ComponentList.js'
import { togglePlugin } from './services/settingsService.js'
import {
  installPlugin,
  uninstallPlugin,
  updateAllPlugins,
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
import {
  useAppDispatch,
  useAppSelector,
  // UI actions
  setTab,
  nextTab,
  prevTab,
  setFocusZone,
  toggleHelp,
  setSearchQuery,
  setSort,
  setMessage,
  // Plugin actions
  setPlugins,
  setError,
  setSelectedIndex,
  moveSelection,
  togglePluginEnabled,
  startOperation,
  endOperation,
  showConfirmUninstall,
  hideConfirmUninstall,
  showConfirmUpdateAll,
  hideConfirmUpdateAll,
  setUpdateProgress,
  clearUpdateProgress,
  moveComponentSelection,
  enterComponentMode,
  exitComponentMode,
  // Marketplace actions
  setMarketplaces,
  startMarketplaceOperation,
  endMarketplaceOperation,
  showConfirmRemoveMarketplace,
  hideConfirmRemoveMarketplace,
  showAddMarketplaceDialog,
  hideAddMarketplaceDialog,
  setAddMarketplaceError,
  showMarketplaceActionMenu as showMarketplaceActionMenuAction,
  hideMarketplaceActionMenu,
  moveActionMenuSelection,
} from './store/index.js'
import type {
  AppState,
  Action,
  Plugin,
  Marketplace,
  FocusZone,
  MarketplaceOperation,
  ComponentDetailedInfo,
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
  confirmUpdateAll: false,
  updateProgress: null,
  showHelp: false,
  marketplaceOperation: 'idle',
  operationMarketplaceId: null,
  confirmRemoveMarketplace: false,
  showAddMarketplaceDialog: false,
  addMarketplaceError: null,
  showMarketplaceActionMenu: false,
  actionMenuSelectedIndex: 0,
  selectedComponentIndex: 0,
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
            : action.payload.operation === 'uninstalling'
              ? `Uninstalling ${action.payload.pluginId}...`
              : `Updating plugins...`,
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

    case 'SHOW_CONFIRM_UPDATE_ALL':
      return {
        ...state,
        confirmUpdateAll: true,
      }

    case 'HIDE_CONFIRM_UPDATE_ALL':
      return {
        ...state,
        confirmUpdateAll: false,
      }

    case 'SET_UPDATE_PROGRESS':
      return {
        ...state,
        updateProgress: action.payload,
        message: `Updating (${action.payload.current}/${action.payload.total}): ${action.payload.pluginId}...`,
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

    case 'SET_COMPONENT_INDEX':
      return {
        ...state,
        selectedComponentIndex: action.payload,
      }

    case 'MOVE_COMPONENT_SELECTION': {
      const newIndex =
        action.payload === 'up'
          ? Math.max(0, state.selectedComponentIndex - 1)
          : Math.min(action.maxIndex, state.selectedComponentIndex + 1)
      return {
        ...state,
        selectedComponentIndex: newIndex,
      }
    }

    case 'ENTER_COMPONENT_MODE':
      return {
        ...state,
        focusZone: 'components',
        selectedComponentIndex: 0,
      }

    case 'EXIT_COMPONENT_MODE':
      return {
        ...state,
        focusZone: 'list',
        selectedComponentIndex: 0,
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
  const dispatch = useAppDispatch()

  // Select state from Redux slices
  const ui = useAppSelector((s) => s.ui)
  const pluginState = useAppSelector((s) => s.plugins)
  const marketplaceState = useAppSelector((s) => s.marketplaces)

  // Combine into AppState-compatible object for existing helper functions
  const state: AppState = {
    activeTab: ui.activeTab,
    focusZone: ui.focusZone,
    showHelp: ui.showHelp,
    searchQuery: ui.searchQuery,
    sortBy: ui.sortBy,
    sortOrder: ui.sortOrder,
    message: ui.message,
    plugins: pluginState.plugins,
    errors: pluginState.errors,
    loading: pluginState.loading,
    error: pluginState.error,
    selectedIndex: pluginState.selectedIndex,
    operation: pluginState.operation,
    operationPluginId: pluginState.operationPluginId,
    confirmUninstall: pluginState.confirmUninstall,
    confirmUpdateAll: pluginState.confirmUpdateAll,
    updateProgress: pluginState.updateProgress,
    selectedComponentIndex: pluginState.selectedComponentIndex,
    marketplaces: marketplaceState.marketplaces,
    marketplaceOperation: marketplaceState.marketplaceOperation,
    operationMarketplaceId: marketplaceState.operationMarketplaceId,
    confirmRemoveMarketplace: marketplaceState.confirmRemoveMarketplace,
    showAddMarketplaceDialog: marketplaceState.showAddMarketplaceDialog,
    addMarketplaceError: marketplaceState.addMarketplaceError,
    showMarketplaceActionMenu: marketplaceState.showMarketplaceActionMenu,
    actionMenuSelectedIndex: marketplaceState.actionMenuSelectedIndex,
  }

  // Load data on mount
  useEffect(() => {
    try {
      const plugins = loadAllPlugins()
      const marketplaces = loadMarketplaces()

      dispatch(setPlugins(plugins))
      dispatch(setMarketplaces(marketplaces))
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Failed to load data',
        ),
      )
    }
  }, [])

  /**
   * Handle plugin installation
   */
  async function handleInstall(pluginId: string) {
    dispatch(startOperation({ operation: 'installing', pluginId }))

    const result = await installPlugin(pluginId)

    dispatch(endOperation())

    if (result.success) {
      // Reload plugins to get fresh state
      const plugins = loadAllPlugins()
      dispatch(setPlugins(plugins))
      dispatch(setMessage(`✅ ${result.message}`))
    } else {
      dispatch(
        setMessage(
          `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
        ),
      )
    }
  }

  /**
   * Handle plugin uninstallation
   */
  async function handleUninstall(pluginId: string) {
    dispatch(startOperation({ operation: 'uninstalling', pluginId }))

    const result = await uninstallPlugin(pluginId)

    dispatch(endOperation())

    if (result.success) {
      // Reload plugins to get fresh state
      const plugins = loadAllPlugins()
      dispatch(setPlugins(plugins))
      dispatch(setMessage(`✅ ${result.message}`))
    } else {
      dispatch(
        setMessage(
          `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
        ),
      )
    }
  }

  /**
   * Handle updating all installed plugins sequentially
   */
  async function handleUpdateAllPlugins() {
    const installed = state.plugins.filter((p) => p.isInstalled)
    if (installed.length === 0) {
      dispatch(setMessage('⚠️ No installed plugins to update'))
      return
    }

    const pluginIds = installed.map((p) => p.id)
    dispatch(startOperation({ operation: 'updating', pluginId: pluginIds[0]! }))

    const result = await updateAllPlugins(
      pluginIds,
      (current, total, pluginId) => {
        dispatch(setUpdateProgress({ current, total, pluginId }))
      },
    )

    dispatch(clearUpdateProgress())
    dispatch(endOperation())

    // Reload plugins to get fresh state
    const plugins = loadAllPlugins()
    dispatch(setPlugins(plugins))

    if (result.failed === 0) {
      dispatch(
        setMessage(`✅ Updated ${result.succeeded}/${result.total} plugins`),
      )
    } else {
      dispatch(
        setMessage(
          `⚠️ Updated ${result.succeeded}/${result.total} (${result.failed} failed)`,
        ),
      )
    }
  }

  /**
   * Handle adding a new marketplace
   * @param source - Marketplace source (e.g., "owner/repo", URL, or local path)
   */
  async function handleAddMarketplace(source: string) {
    dispatch(startMarketplaceOperation({ operation: 'adding' }))

    const result = await addMarketplace(source)

    dispatch(endMarketplaceOperation())

    if (result.success) {
      dispatch(hideAddMarketplaceDialog())
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch(setMarketplaces(marketplaces))
      // Also reload plugins as new marketplace may have plugins
      const plugins = loadAllPlugins()
      dispatch(setPlugins(plugins))
      // Reset selection to avoid pointing to a different marketplace after re-sort
      dispatch(setSelectedIndex(0))
      dispatch(setMessage(`✅ ${result.message}`))
    } else {
      // Keep dialog open and show error inline
      dispatch(setAddMarketplaceError(result.error || result.message))
    }
  }

  /**
   * Handle removing a marketplace
   * @param marketplaceId - Marketplace identifier to remove
   */
  async function handleRemoveMarketplace(marketplaceId: string) {
    dispatch(
      startMarketplaceOperation({ operation: 'removing', marketplaceId }),
    )

    const result = await removeMarketplace(marketplaceId)

    dispatch(endMarketplaceOperation())

    if (result.success) {
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch(setMarketplaces(marketplaces))
      // Also reload plugins as removed marketplace's plugins should be gone
      const plugins = loadAllPlugins()
      dispatch(setPlugins(plugins))
      dispatch(setMessage(`✅ ${result.message}`))
      // Reset selection if needed
      if (state.selectedIndex >= marketplaces.length) {
        dispatch(setSelectedIndex(Math.max(0, marketplaces.length - 1)))
      }
    } else {
      dispatch(
        setMessage(
          `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
        ),
      )
    }
  }

  /**
   * Handle updating a marketplace (or all marketplaces)
   * @param marketplaceId - Optional marketplace identifier. If omitted, updates all.
   */
  async function handleUpdateMarketplace(marketplaceId?: string) {
    dispatch(
      startMarketplaceOperation({ operation: 'updating', marketplaceId }),
    )

    const result = await updateMarketplace(marketplaceId)

    dispatch(endMarketplaceOperation())

    if (result.success) {
      // Reload marketplaces and plugins to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch(setMarketplaces(marketplaces))
      const plugins = loadAllPlugins()
      dispatch(setPlugins(plugins))
      // Reset selection to avoid pointing to a different marketplace after re-sort
      dispatch(setSelectedIndex(0))
      dispatch(setMessage(`✅ ${result.message}`))
    } else {
      dispatch(
        setMessage(
          `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
        ),
      )
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
    dispatch(
      startMarketplaceOperation({ operation: 'updating', marketplaceId }),
    )

    const result = await toggleAutoUpdate(marketplaceId, currentValue)

    dispatch(endMarketplaceOperation())

    if (result.success) {
      // Reload marketplaces to get fresh state
      const marketplaces = loadMarketplaces()
      dispatch(setMarketplaces(marketplaces))
      dispatch(setMessage(`✅ ${result.message}`))
    } else {
      dispatch(
        setMessage(
          `❌ ${result.message}${result.error ? `: ${result.error}` : ''}`,
        ),
      )
    }
  }

  /**
   * Handle browsing plugins for a specific marketplace
   * Switches to Discover tab with marketplace filter applied
   * @param marketplaceId - ID of the marketplace to browse
   */
  function handleBrowseMarketplacePlugins(marketplaceId: string) {
    // Switch to Discover tab
    dispatch(setTab('discover'))
    // Set search query to filter by marketplace
    dispatch(setSearchQuery(marketplaceId))
    dispatch(setMessage(`Browsing plugins from ${marketplaceId}`))
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
        dispatch(toggleHelp())
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
      dispatch(toggleHelp())
      return
    }

    // Handle plugin uninstall confirmation dialog
    if (state.confirmUninstall && state.operationPluginId) {
      if (input === 'y' || input === 'Y' || key.return) {
        dispatch(hideConfirmUninstall())
        handleUninstall(state.operationPluginId)
        return
      }
      if (input === 'n' || input === 'N' || key.escape) {
        dispatch(hideConfirmUninstall())
        dispatch(setMessage('Uninstall cancelled'))
        return
      }
      return
    }

    // Handle update all confirmation dialog
    if (state.confirmUpdateAll) {
      if (input === 'y' || input === 'Y' || key.return) {
        dispatch(hideConfirmUpdateAll())
        handleUpdateAllPlugins()
        return
      }
      if (input === 'n' || input === 'N' || key.escape) {
        dispatch(hideConfirmUpdateAll())
        dispatch(setMessage('Update cancelled'))
        return
      }
      return
    }

    // Handle marketplace remove confirmation dialog
    if (state.confirmRemoveMarketplace && state.operationMarketplaceId) {
      if (input === 'y' || input === 'Y' || key.return) {
        dispatch(hideConfirmRemoveMarketplace())
        handleRemoveMarketplace(state.operationMarketplaceId)
        return
      }
      if (input === 'n' || input === 'N' || key.escape) {
        dispatch(hideConfirmRemoveMarketplace())
        dispatch(setMessage('Remove cancelled'))
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
        dispatch(hideAddMarketplaceDialog())
        dispatch(setMessage('Add marketplace cancelled'))
        return
      }
      // Backspace
      if (key.backspace || key.delete) {
        dispatch(setSearchQuery(state.searchQuery.slice(0, -1)))
        return
      }
      // Character input
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch(setSearchQuery(state.searchQuery + input))
        return
      }
      return
    }

    // Handle marketplace action menu
    if (state.showMarketplaceActionMenu) {
      const selectedMarketplace =
        getFilteredMarketplaces(state)[state.selectedIndex]
      if (!selectedMarketplace) {
        dispatch(hideMarketplaceActionMenu())
        return
      }

      // Up/Down arrow navigation
      if (key.upArrow || (key.ctrl && input === 'p')) {
        dispatch(moveActionMenuSelection('up'))
        return
      }
      if (key.downArrow || (key.ctrl && input === 'n')) {
        dispatch(moveActionMenuSelection('down'))
        return
      }

      // Execute action on Enter
      if (key.return) {
        dispatch(hideMarketplaceActionMenu())
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
          dispatch(showConfirmRemoveMarketplace(selectedMarketplace.id))
        }
        return
      }

      // Close menu on Escape
      if (key.escape) {
        dispatch(hideMarketplaceActionMenu())
        return
      }
      return
    }

    // Search mode input (when focusZone is 'search')
    if (state.focusZone === 'search') {
      // Up arrow: move focus to tabbar
      if (key.upArrow || (key.ctrl && input === 'p')) {
        dispatch(setFocusZone('tabbar'))
        return
      }
      // Down arrow, Enter, or Escape: move focus to list
      if (
        key.escape ||
        key.return ||
        key.downArrow ||
        (key.ctrl && input === 'n')
      ) {
        dispatch(setFocusZone('list'))
        return
      }
      if (key.backspace || key.delete) {
        dispatch(setSearchQuery(state.searchQuery.slice(0, -1)))
        return
      }
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch(setSearchQuery(state.searchQuery + input))
        return
      }
      return
    }

    // TabBar focus zone navigation
    if (state.focusZone === 'tabbar') {
      // Down arrow: move to search (or list if no search)
      if (key.downArrow || (key.ctrl && input === 'n')) {
        const zones = getAvailableZones(state.activeTab)
        dispatch(setFocusZone(zones.includes('search') ? 'search' : 'list'))
        return
      }
      // Left/Right arrows and Ctrl+B/F: tab switching (only in tabbar)
      // Keep focus on tabbar after navigation
      if (key.leftArrow || (key.ctrl && input === 'b')) {
        dispatch(prevTab())
        dispatch(setFocusZone('tabbar'))
        return
      }
      if (key.rightArrow || (key.ctrl && input === 'f')) {
        dispatch(nextTab())
        dispatch(setFocusZone('tabbar'))
        return
      }
      // Tab key: next tab (resets focus to list)
      if (key.tab) {
        dispatch(nextTab())
        return
      }
      return
    }

    // Component focus zone navigation
    if (state.focusZone === 'components') {
      // Get current plugin and its components
      const items = getItemsForTab(state) as Plugin[]
      const selectedPlugin = items[state.selectedIndex]
      const components = selectedPlugin
        ? flattenComponents(selectedPlugin.componentsDetailed)
        : []

      // Left arrow: exit component mode, go back to list
      if (key.leftArrow || (key.ctrl && input === 'b') || key.escape) {
        dispatch(exitComponentMode())
        return
      }

      // Up/Down: navigate components
      if (key.upArrow || (key.ctrl && input === 'p')) {
        dispatch(
          moveComponentSelection({
            direction: 'up',
            maxIndex: Math.max(0, components.length - 1),
          }),
        )
        return
      }
      if (key.downArrow || (key.ctrl && input === 'n')) {
        dispatch(
          moveComponentSelection({
            direction: 'down',
            maxIndex: Math.max(0, components.length - 1),
          }),
        )
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
        dispatch(setFocusZone(zones.includes('search') ? 'search' : 'tabbar'))
      } else {
        dispatch(
          moveSelection({
            direction: 'up',
            maxIndex: Math.max(0, getItemsForTab(state).length - 1),
          }),
        )
      }
      return
    }

    // Down arrow: move down in list
    if (key.downArrow || (key.ctrl && input === 'n')) {
      dispatch(
        moveSelection({
          direction: 'down',
          maxIndex: Math.max(0, getItemsForTab(state).length - 1),
        }),
      )
      return
    }

    // Right arrow: enter component mode (on plugin tabs)
    if (
      (key.rightArrow || (key.ctrl && input === 'f')) &&
      state.focusZone === 'list' &&
      (state.activeTab === 'enabled' ||
        state.activeTab === 'installed' ||
        state.activeTab === 'discover')
    ) {
      const items = getItemsForTab(state) as Plugin[]
      const selectedPlugin = items[state.selectedIndex]
      if (selectedPlugin?.componentsDetailed) {
        const components = flattenComponents(selectedPlugin.componentsDetailed)
        if (components.length > 0) {
          dispatch(enterComponentMode())
          return
        }
      }
    }

    // Tab key: next tab (from list zone)
    if (key.tab) {
      dispatch(nextTab())
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
      dispatch(setFocusZone('search'))
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
            dispatch(togglePluginEnabled(selectedPlugin.id))
            dispatch(
              setMessage(
                newState
                  ? `✅ ${selectedPlugin.name} enabled`
                  : `❌ ${selectedPlugin.name} disabled`,
              ),
            )
          } catch (error) {
            dispatch(
              setMessage(
                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              ),
            )
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
          dispatch(togglePluginEnabled(selectedPlugin.id))
          dispatch(
            setMessage(
              newState
                ? `✅ ${selectedPlugin.name} enabled`
                : `❌ ${selectedPlugin.name} disabled`,
            ),
          )
        } catch (error) {
          dispatch(
            setMessage(
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
          )
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
      dispatch(setSort({ by: nextSort[state.sortBy], order: state.sortOrder }))
      return
    }

    // Toggle sort order (S key)
    if (input === 'S' && state.activeTab === 'discover') {
      dispatch(
        setSort({
          by: state.sortBy,
          order: state.sortOrder === 'asc' ? 'desc' : 'asc',
        }),
      )
      return
    }

    // Clear search (Escape)
    if (key.escape && state.searchQuery) {
      dispatch(setSearchQuery(''))
      return
    }

    // Marketplace-specific key bindings
    if (state.activeTab === 'marketplaces' && state.focusZone === 'list') {
      // Open action menu (Enter or m key)
      if (key.return || input === 'm') {
        const selectedMarketplace = filteredMarketplaces[state.selectedIndex]
        if (selectedMarketplace) {
          dispatch(showMarketplaceActionMenuAction())
        }
        return
      }

      // Add marketplace (a key)
      if (input === 'a') {
        dispatch(showAddMarketplaceDialog())
        return
      }

      // Remove marketplace (d key or Backspace)
      if (input === 'd' || key.backspace || key.delete) {
        const selectedMarketplace = filteredMarketplaces[state.selectedIndex]
        if (selectedMarketplace) {
          dispatch(showConfirmRemoveMarketplace(selectedMarketplace.id))
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
        dispatch(setMessage('⚠️ Plugin is already installed'))
      }
      return
    }

    // Update all plugins (U key = shift+u) - only on enabled/installed tabs
    if (
      input === 'U' &&
      (state.activeTab === 'enabled' || state.activeTab === 'installed')
    ) {
      const installed = state.plugins.filter((p) => p.isInstalled)
      if (installed.length === 0) {
        dispatch(setMessage('⚠️ No installed plugins to update'))
      } else {
        dispatch(showConfirmUpdateAll())
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
        dispatch(showConfirmUninstall(selectedPlugin.id))
      } else if (selectedPlugin && !selectedPlugin.isInstalled) {
        dispatch(setMessage('⚠️ Plugin is not installed'))
      }
      return
    }
  })

  // Get filtered data for current tab (must be before early returns for useMemo dependency)
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

  // Get selected component detail for component focus mode (memoized)
  // Must be called before conditional returns to maintain hooks order
  const selectedComponentDetail = useMemo((): ComponentDetailedInfo | null => {
    if (state.focusZone !== 'components') return null

    // Get the appropriate plugins for current tab
    const currentPlugins = match(state.activeTab)
      .with('enabled', () => enabledPlugins)
      .with('installed', () => installedPlugins)
      .with('discover', () => filteredPlugins)
      .otherwise(() => [] as Plugin[])

    const selectedPlugin = currentPlugins[state.selectedIndex]
    if (!selectedPlugin?.componentsDetailed) return null

    const components = flattenComponents(selectedPlugin.componentsDetailed)
    const selectedComponent = components[state.selectedComponentIndex]
    if (!selectedComponent) return null

    // Get install path for the plugin (cross-platform)
    const installPath = selectedPlugin.isInstalled
      ? path.join(
          os.homedir(),
          '.claude',
          'plugins',
          'cache',
          selectedPlugin.marketplace ?? '',
          selectedPlugin.name,
          selectedPlugin.version ?? '',
        )
      : null

    if (!installPath) return null

    // Fetch detailed info based on component type
    if (selectedComponent.info.type === 'skill') {
      return (
        getSkillDetailedInfo(installPath, selectedComponent.info.name) ?? null
      )
    } else if (
      selectedComponent.info.type === 'command' ||
      selectedComponent.info.type === 'agent'
    ) {
      return (
        getMarkdownComponentDetailedInfo(
          installPath,
          selectedComponent.info.name,
          selectedComponent.info.type,
        ) ?? null
      )
    }

    // For other types (mcp, lsp, hook), return basic info
    return {
      name: selectedComponent.info.name,
      type: selectedComponent.info.type,
      description: selectedComponent.info.description,
    }
  }, [
    state.focusZone,
    state.activeTab,
    state.selectedIndex,
    state.selectedComponentIndex,
    enabledPlugins,
    installedPlugins,
    filteredPlugins,
  ])
  const componentFocusMode = state.focusZone === 'components'

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
              componentFocusMode={componentFocusMode}
              selectedComponentIndex={state.selectedComponentIndex}
              selectedComponentDetail={selectedComponentDetail}
            />
          ))
          .with('installed', () => (
            <InstalledTab
              key="installed"
              plugins={installedPlugins}
              selectedIndex={state.selectedIndex}
              searchQuery={state.searchQuery}
              focusZone={state.focusZone}
              componentFocusMode={componentFocusMode}
              selectedComponentIndex={state.selectedComponentIndex}
              selectedComponentDetail={selectedComponentDetail}
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
              componentFocusMode={componentFocusMode}
              selectedComponentIndex={state.selectedComponentIndex}
              selectedComponentDetail={selectedComponentDetail}
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

      {/* Plugin Update All Confirmation Dialog */}
      {state.confirmUpdateAll && (
        <ConfirmDialog
          message={`Update all ${state.plugins.filter((p) => p.isInstalled).length} plugins?`}
        />
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
              { key: 'U', action: 'update all' },
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
              { key: 'U', action: 'update all' },
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
