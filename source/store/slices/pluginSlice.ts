/**
 * Plugin state slice for plugin data and operations
 * Handles plugin list, loading state, selection, and operations
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Plugin, PluginError } from '../../types/index.js'
import { setTab, nextTab, prevTab } from './uiSlice.js'

/**
 * Plugin operation type
 */
export type PluginOperation = 'idle' | 'installing' | 'uninstalling'

/**
 * Plugin-specific state
 */
export interface PluginState {
  plugins: Plugin[]
  errors: PluginError[]
  loading: boolean
  error: string | null
  selectedIndex: number
  operation: PluginOperation
  operationPluginId: string | null
  confirmUninstall: boolean
  selectedComponentIndex: number
}

/**
 * Initial plugin state
 */
const initialState: PluginState = {
  plugins: [],
  errors: [],
  loading: true,
  error: null,
  selectedIndex: 0,
  operation: 'idle',
  operationPluginId: null,
  confirmUninstall: false,
  selectedComponentIndex: 0,
}

/**
 * Plugin slice with reducers for all plugin-related state changes
 */
export const pluginSlice = createSlice({
  name: 'plugins',
  initialState,
  reducers: {
    /**
     * Set the plugins list
     */
    setPlugins: (state, action: PayloadAction<Plugin[]>) => {
      state.plugins = action.payload
      state.loading = false
    },

    /**
     * Set plugin errors
     */
    setErrors: (state, action: PayloadAction<PluginError[]>) => {
      state.errors = action.payload
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.loading = false
    },

    /**
     * Set selected plugin index
     */
    setSelectedIndex: (state, action: PayloadAction<number>) => {
      state.selectedIndex = action.payload
    },

    /**
     * Move selection up or down
     */
    moveSelection: (
      state,
      action: PayloadAction<{ direction: 'up' | 'down'; maxIndex: number }>,
    ) => {
      const { direction, maxIndex } = action.payload
      if (direction === 'up') {
        state.selectedIndex = Math.max(0, state.selectedIndex - 1)
      } else {
        state.selectedIndex = Math.min(maxIndex, state.selectedIndex + 1)
      }
    },

    /**
     * Toggle plugin enabled state
     */
    togglePluginEnabled: (state, action: PayloadAction<string>) => {
      const pluginId = action.payload
      const plugin = state.plugins.find((p) => p.id === pluginId)
      if (plugin) {
        plugin.isEnabled = !plugin.isEnabled
      }
    },

    /**
     * Update a single plugin
     */
    updatePlugin: (state, action: PayloadAction<Plugin>) => {
      const index = state.plugins.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.plugins[index] = action.payload
      }
    },

    /**
     * Start a plugin operation (install/uninstall)
     */
    startOperation: (
      state,
      action: PayloadAction<{
        operation: 'installing' | 'uninstalling'
        pluginId: string
      }>,
    ) => {
      state.operation = action.payload.operation
      state.operationPluginId = action.payload.pluginId
    },

    /**
     * End the current operation
     */
    endOperation: (state) => {
      state.operation = 'idle'
      state.operationPluginId = null
    },

    /**
     * Show uninstall confirmation dialog
     */
    showConfirmUninstall: (state, action: PayloadAction<string>) => {
      state.confirmUninstall = true
      state.operationPluginId = action.payload
    },

    /**
     * Hide uninstall confirmation dialog
     */
    hideConfirmUninstall: (state) => {
      state.confirmUninstall = false
      state.operationPluginId = null
    },

    /**
     * Set selected component index for component focus mode
     */
    setComponentIndex: (state, action: PayloadAction<number>) => {
      state.selectedComponentIndex = action.payload
    },

    /**
     * Move component selection up or down
     */
    moveComponentSelection: (
      state,
      action: PayloadAction<{ direction: 'up' | 'down'; maxIndex: number }>,
    ) => {
      const { direction, maxIndex } = action.payload
      if (direction === 'up') {
        state.selectedComponentIndex = Math.max(
          0,
          state.selectedComponentIndex - 1,
        )
      } else {
        state.selectedComponentIndex = Math.min(
          maxIndex,
          state.selectedComponentIndex + 1,
        )
      }
    },

    /**
     * Reset component index when entering component mode
     */
    enterComponentMode: (state) => {
      state.selectedComponentIndex = 0
    },

    /**
     * Reset component index when exiting component mode
     */
    exitComponentMode: (state) => {
      state.selectedComponentIndex = 0
    },
  },
  extraReducers: (builder) => {
    // Reset selectedIndex when tab changes
    builder
      .addCase(setTab, (state) => {
        state.selectedIndex = 0
      })
      .addCase(nextTab, (state) => {
        state.selectedIndex = 0
      })
      .addCase(prevTab, (state) => {
        state.selectedIndex = 0
      })
  },
})

export const {
  setPlugins,
  setErrors,
  setLoading,
  setError,
  setSelectedIndex,
  moveSelection,
  togglePluginEnabled,
  updatePlugin,
  startOperation,
  endOperation,
  showConfirmUninstall,
  hideConfirmUninstall,
  setComponentIndex,
  moveComponentSelection,
  enterComponentMode,
  exitComponentMode,
} = pluginSlice.actions

export default pluginSlice.reducer
