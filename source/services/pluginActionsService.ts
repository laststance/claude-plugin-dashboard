/**
 * Plugin actions service for install/uninstall/update operations
 * Executes `claude plugin install/uninstall/update` as subprocess
 */

import { spawn } from 'node:child_process'

export interface PluginActionResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Install a plugin via Claude CLI
 * @param pluginId - Plugin identifier (e.g., "context7@claude-plugins-official")
 * @returns Promise resolving to action result
 */
export function installPlugin(pluginId: string): Promise<PluginActionResult> {
  return executePluginAction('install', pluginId)
}

/**
 * Uninstall a plugin via Claude CLI
 * @param pluginId - Plugin identifier
 * @returns Promise resolving to action result
 */
export function uninstallPlugin(pluginId: string): Promise<PluginActionResult> {
  return executePluginAction('uninstall', pluginId)
}

/**
 * Update a plugin via Claude CLI
 * @param pluginId - Plugin identifier
 * @returns Promise resolving to action result
 */
export function updatePlugin(pluginId: string): Promise<PluginActionResult> {
  return executePluginAction('update', pluginId)
}

/**
 * Result of a bulk update operation
 */
export interface UpdateAllResult {
  total: number
  succeeded: number
  failed: number
  results: Array<{ pluginId: string; result: PluginActionResult }>
}

/**
 * Update all plugins sequentially
 * @param pluginIds - Array of plugin identifiers to update
 * @param onProgress - Optional callback for progress reporting
 * @returns Promise resolving to bulk update result
 * @example
 * const result = await updateAllPlugins(['ctx7@official', 'sup@official'], (cur, total, id) => {
 *   console.log(`Updating (${cur}/${total}): ${id}...`)
 * })
 */
export async function updateAllPlugins(
  pluginIds: string[],
  onProgress?: (current: number, total: number, pluginId: string) => void,
): Promise<UpdateAllResult> {
  const results: UpdateAllResult['results'] = []
  for (let i = 0; i < pluginIds.length; i++) {
    const pluginId = pluginIds[i]!
    onProgress?.(i + 1, pluginIds.length, pluginId)
    const result = await updatePlugin(pluginId)
    results.push({ pluginId, result })
  }
  return {
    total: pluginIds.length,
    succeeded: results.filter((r) => r.result.success).length,
    failed: results.filter((r) => !r.result.success).length,
    results,
  }
}

/**
 * Execute a plugin command (install/uninstall/update)
 * @param action - 'install', 'uninstall', or 'update'
 * @param pluginId - Plugin identifier
 * @returns Promise resolving to action result
 */
function executePluginAction(
  action: 'install' | 'uninstall' | 'update',
  pluginId: string,
): Promise<PluginActionResult> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['plugin', action, pluginId], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: `${action === 'install' ? 'Installed' : action === 'uninstall' ? 'Uninstalled' : 'Updated'} ${pluginId}`,
        })
      } else {
        resolve({
          success: false,
          message: `Failed to ${action} ${pluginId}`,
          error: stderr || stdout || `Exit code: ${code}`,
        })
      }
    })

    child.on('error', (err: Error) => {
      resolve({
        success: false,
        message: 'Failed to execute claude command',
        error: err.message,
      })
    })
  })
}
