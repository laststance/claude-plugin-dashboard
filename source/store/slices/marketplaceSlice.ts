/**
 * Marketplace state slice for marketplace data and operations
 * Handles marketplace list, dialogs, and marketplace operations
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Marketplace } from '../../types/index.js'

/**
 * Marketplace operation type
 */
export type MarketplaceOperation = 'idle' | 'adding' | 'removing' | 'updating'

/**
 * Marketplace-specific state
 */
export interface MarketplaceState {
  marketplaces: Marketplace[]
  marketplaceOperation: MarketplaceOperation
  operationMarketplaceId: string | null
  confirmRemoveMarketplace: boolean
  showAddMarketplaceDialog: boolean
  addMarketplaceError: string | null
  showMarketplaceActionMenu: boolean
  actionMenuSelectedIndex: number
}

/**
 * Initial marketplace state
 */
const initialState: MarketplaceState = {
  marketplaces: [],
  marketplaceOperation: 'idle',
  operationMarketplaceId: null,
  confirmRemoveMarketplace: false,
  showAddMarketplaceDialog: false,
  addMarketplaceError: null,
  showMarketplaceActionMenu: false,
  actionMenuSelectedIndex: 0,
}

/**
 * Get display message for marketplace operation status
 * @param operation - The marketplace operation type
 * @param marketplaceId - Optional marketplace identifier
 * @returns Display message for the operation
 */
export function getMarketplaceOperationMessage(
  operation: MarketplaceOperation,
  marketplaceId?: string | null,
): string {
  switch (operation) {
    case 'adding':
      return 'Adding marketplace...'
    case 'removing':
      return `Removing ${marketplaceId}...`
    case 'updating':
      return `Updating ${marketplaceId || 'marketplaces'}...`
    case 'idle':
      return ''
    default:
      return ''
  }
}

/**
 * Marketplace slice with reducers for all marketplace-related state changes
 */
export const marketplaceSlice = createSlice({
  name: 'marketplaces',
  initialState,
  reducers: {
    /**
     * Set the marketplaces list
     */
    setMarketplaces: (state, action: PayloadAction<Marketplace[]>) => {
      state.marketplaces = action.payload
    },

    /**
     * Start a marketplace operation
     */
    startMarketplaceOperation: (
      state,
      action: PayloadAction<{
        operation: 'adding' | 'removing' | 'updating'
        marketplaceId?: string
      }>,
    ) => {
      state.marketplaceOperation = action.payload.operation
      state.operationMarketplaceId = action.payload.marketplaceId ?? null
    },

    /**
     * End the current marketplace operation
     */
    endMarketplaceOperation: (state) => {
      state.marketplaceOperation = 'idle'
      state.operationMarketplaceId = null
    },

    /**
     * Show remove marketplace confirmation dialog
     */
    showConfirmRemoveMarketplace: (state, action: PayloadAction<string>) => {
      state.confirmRemoveMarketplace = true
      state.operationMarketplaceId = action.payload
    },

    /**
     * Hide remove marketplace confirmation dialog
     */
    hideConfirmRemoveMarketplace: (state) => {
      state.confirmRemoveMarketplace = false
      state.operationMarketplaceId = null
    },

    /**
     * Show add marketplace dialog
     */
    showAddMarketplaceDialog: (state) => {
      state.showAddMarketplaceDialog = true
      state.addMarketplaceError = null
    },

    /**
     * Hide add marketplace dialog
     */
    hideAddMarketplaceDialog: (state) => {
      state.showAddMarketplaceDialog = false
      state.addMarketplaceError = null
    },

    /**
     * Set add marketplace error
     */
    setAddMarketplaceError: (state, action: PayloadAction<string | null>) => {
      state.addMarketplaceError = action.payload
    },

    /**
     * Show marketplace action menu
     */
    showMarketplaceActionMenu: (state) => {
      state.showMarketplaceActionMenu = true
      state.actionMenuSelectedIndex = 0
    },

    /**
     * Hide marketplace action menu
     */
    hideMarketplaceActionMenu: (state) => {
      state.showMarketplaceActionMenu = false
      state.actionMenuSelectedIndex = 0
    },

    /**
     * Set action menu selected index
     */
    setActionMenuIndex: (state, action: PayloadAction<number>) => {
      state.actionMenuSelectedIndex = action.payload
    },

    /**
     * Move action menu selection up or down
     */
    moveActionMenuSelection: (state, action: PayloadAction<'up' | 'down'>) => {
      const maxIndex = 3 // 4 actions: browse, update, autoUpdate, remove
      if (action.payload === 'up') {
        state.actionMenuSelectedIndex = Math.max(
          0,
          state.actionMenuSelectedIndex - 1,
        )
      } else {
        state.actionMenuSelectedIndex = Math.min(
          maxIndex,
          state.actionMenuSelectedIndex + 1,
        )
      }
    },
  },
})

export const {
  setMarketplaces,
  startMarketplaceOperation,
  endMarketplaceOperation,
  showConfirmRemoveMarketplace,
  hideConfirmRemoveMarketplace,
  showAddMarketplaceDialog,
  hideAddMarketplaceDialog,
  setAddMarketplaceError,
  showMarketplaceActionMenu,
  hideMarketplaceActionMenu,
  setActionMenuIndex,
  moveActionMenuSelection,
} = marketplaceSlice.actions

export default marketplaceSlice.reducer
