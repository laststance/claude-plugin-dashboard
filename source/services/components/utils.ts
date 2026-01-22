/**
 * Utility functions for plugin component operations
 * Helper functions for checking and counting components
 */

import type { PluginComponents } from '../../types/index.js'

/**
 * Check if a plugin has any components
 * @param components - PluginComponents object
 * @returns true if at least one component type is present
 * @example
 * hasAnyComponents({ skills: 2 }) // => true
 * hasAnyComponents({}) // => false
 * hasAnyComponents(undefined) // => false
 */
export function hasAnyComponents(
  components: PluginComponents | undefined,
): boolean {
  if (!components) {
    return false
  }

  return (
    (components.skills ?? 0) > 0 ||
    (components.commands ?? 0) > 0 ||
    (components.agents ?? 0) > 0 ||
    components.hooks === true ||
    (components.mcpServers ?? 0) > 0 ||
    (components.lspServers ?? 0) > 0
  )
}

/**
 * Get total component count for a plugin
 * @param components - PluginComponents object
 * @returns Total number of components (hooks count as 1)
 * @example
 * getTotalComponentCount({ skills: 3, commands: 2, hooks: true }) // => 6
 */
export function getTotalComponentCount(
  components: PluginComponents | undefined,
): number {
  if (!components) {
    return 0
  }

  return (
    (components.skills ?? 0) +
    (components.commands ?? 0) +
    (components.agents ?? 0) +
    (components.hooks ? 1 : 0) +
    (components.mcpServers ?? 0) +
    (components.lspServers ?? 0)
  )
}
