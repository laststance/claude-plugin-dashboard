/**
 * Marketplace actions service for add/remove/update operations
 * Executes `claude plugin marketplace <action>` as subprocess
 */

import { spawn } from 'node:child_process'

/**
 * Result of a marketplace CLI action
 */
export interface MarketplaceActionResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Add a new marketplace via Claude CLI
 * @param source - Marketplace source (e.g., "owner/repo", "https://...", "./local-path")
 * @returns Promise resolving to action result
 * @example
 * // GitHub shorthand
 * addMarketplace('anthropics/claude-plugins')
 * // Git URL
 * addMarketplace('https://github.com/org/plugins.git')
 * // Local path
 * addMarketplace('./my-marketplace')
 */
export function addMarketplace(
  source: string,
): Promise<MarketplaceActionResult> {
  return executeMarketplaceAction('add', source)
}

/**
 * Remove an existing marketplace via Claude CLI
 * @param name - Marketplace name/identifier to remove
 * @returns Promise resolving to action result
 * @example
 * removeMarketplace('my-marketplace')
 */
export function removeMarketplace(
  name: string,
): Promise<MarketplaceActionResult> {
  return executeMarketplaceAction('remove', name)
}

/**
 * Update marketplace catalog(s) via Claude CLI
 * @param name - Optional marketplace name. If omitted, updates all marketplaces.
 * @returns Promise resolving to action result
 * @example
 * // Update specific marketplace
 * updateMarketplace('claude-plugins-official')
 * // Update all marketplaces
 * updateMarketplace()
 */
export function updateMarketplace(
  name?: string,
): Promise<MarketplaceActionResult> {
  return new Promise((resolve) => {
    const args = ['plugin', 'marketplace', 'update']
    if (name) {
      args.push(name)
    }

    const child = spawn('claude', args, {
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
          message: name ? `Updated ${name}` : 'Updated all marketplaces',
        })
      } else {
        resolve({
          success: false,
          message: `Failed to update ${name || 'marketplaces'}`,
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

/**
 * Execute a marketplace CLI command (add/remove)
 * @param action - 'add' or 'remove'
 * @param target - Source (for add) or name (for remove)
 * @returns Promise resolving to action result
 */
function executeMarketplaceAction(
  action: 'add' | 'remove',
  target: string,
): Promise<MarketplaceActionResult> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['plugin', 'marketplace', action, target], {
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
      const actionPastTense = action === 'add' ? 'Added' : 'Removed'
      const actionVerb = action === 'add' ? 'add' : 'remove'

      if (code === 0) {
        resolve({
          success: true,
          message: `${actionPastTense} marketplace: ${target}`,
        })
      } else {
        resolve({
          success: false,
          message: `Failed to ${actionVerb} marketplace: ${target}`,
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
