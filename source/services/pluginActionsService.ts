/**
 * Plugin actions service for install/uninstall operations
 * Executes `claude plugin install/uninstall` as subprocess
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
 * Execute a plugin command (install/uninstall)
 * @param action - 'install' or 'uninstall'
 * @param pluginId - Plugin identifier
 * @returns Promise resolving to action result
 */
function executePluginAction(
  action: 'install' | 'uninstall',
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
          message: `${action === 'install' ? 'Installed' : 'Uninstalled'} ${pluginId}`,
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
