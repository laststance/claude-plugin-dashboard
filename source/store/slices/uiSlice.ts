/**
 * UI state slice for application-wide UI state management
 * Handles tabs, focus zones, dialogs, search, sort, and messages
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppState, FocusZone } from '../../types/index.js'

/**
 * UI-specific state extracted from AppState
 */
export interface UiState {
  activeTab: AppState['activeTab']
  focusZone: FocusZone
  showHelp: boolean
  searchQuery: string
  sortBy: AppState['sortBy']
  sortOrder: AppState['sortOrder']
  message: string | null
}

/**
 * Initial UI state
 */
const initialState: UiState = {
  activeTab: 'enabled',
  focusZone: 'list',
  showHelp: false,
  searchQuery: '',
  sortBy: 'installs',
  sortOrder: 'desc',
  message: null,
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
 * UI slice with reducers for all UI-related state changes
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Set the active tab and reset related state
     */
    setTab: (state, action: PayloadAction<AppState['activeTab']>) => {
      state.activeTab = action.payload
      state.focusZone = 'list'
      state.searchQuery = ''
      state.message = null
    },

    /**
     * Navigate to next tab
     */
    nextTab: (state) => {
      const tabs: AppState['activeTab'][] = [
        'enabled',
        'installed',
        'discover',
        'marketplaces',
        'errors',
      ]
      const currentIndex = tabs.indexOf(state.activeTab)
      const nextTab = tabs[(currentIndex + 1) % tabs.length]
      if (nextTab) {
        state.activeTab = nextTab
      }
      state.focusZone = 'list'
      state.searchQuery = ''
      state.message = null
    },

    /**
     * Navigate to previous tab
     */
    prevTab: (state) => {
      const tabs: AppState['activeTab'][] = [
        'enabled',
        'installed',
        'discover',
        'marketplaces',
        'errors',
      ]
      const currentIndex = tabs.indexOf(state.activeTab)
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length]
      if (prevTab) {
        state.activeTab = prevTab
      }
      state.focusZone = 'list'
      state.searchQuery = ''
      state.message = null
    },

    /**
     * Set the focus zone
     */
    setFocusZone: (state, action: PayloadAction<FocusZone>) => {
      state.focusZone = action.payload
    },

    /**
     * Toggle help overlay visibility
     */
    toggleHelp: (state) => {
      state.showHelp = !state.showHelp
    },

    /**
     * Set the search query
     */
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    /**
     * Set sort configuration
     */
    setSort: (
      state,
      action: PayloadAction<{
        by: AppState['sortBy']
        order: AppState['sortOrder']
      }>,
    ) => {
      state.sortBy = action.payload.by
      state.sortOrder = action.payload.order
    },

    /**
     * Set a message to display to the user
     */
    setMessage: (state, action: PayloadAction<string | null>) => {
      state.message = action.payload
    },

    /**
     * Clear the message
     */
    clearMessage: (state) => {
      state.message = null
    },
  },
})

export const {
  setTab,
  nextTab,
  prevTab,
  setFocusZone,
  toggleHelp,
  setSearchQuery,
  setSort,
  setMessage,
  clearMessage,
} = uiSlice.actions

export default uiSlice.reducer
