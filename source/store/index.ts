/**
 * Redux store configuration for Claude Code Plugin Dashboard
 * Combines all slices and exports typed hooks
 */

import { configureStore } from '@reduxjs/toolkit'
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux'

import uiReducer from './slices/uiSlice.js'
import pluginReducer from './slices/pluginSlice.js'
import marketplaceReducer from './slices/marketplaceSlice.js'

/**
 * Configure the Redux store with all slices
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    plugins: pluginReducer,
    marketplaces: marketplaceReducer,
  },
  // Ink uses context that might not be serializable
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

/**
 * Store types for TypeScript
 */
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

/**
 * Typed hooks for use throughout the app
 */
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * Create a new store instance (useful for testing)
 */
export function createStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
      plugins: pluginReducer,
      marketplaces: marketplaceReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

// Re-export slice actions for convenience
export * from './slices/uiSlice.js'
export * from './slices/pluginSlice.js'
export * from './slices/marketplaceSlice.js'
