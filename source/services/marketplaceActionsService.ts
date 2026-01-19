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
  return executeMarketplaceCommand(
    ['plugin', 'marketplace', 'add', source],
    `Added marketplace: ${source}`,
    `Failed to add marketplace: ${source}`,
  )
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
  return executeMarketplaceCommand(
    ['plugin', 'marketplace', 'remove', name],
    `Removed marketplace: ${name}`,
    `Failed to remove marketplace: ${name}`,
  )
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
  const args = ['plugin', 'marketplace', 'update']
  if (name) {
    args.push(name)
  }
  return executeMarketplaceCommand(
    args,
    name ? `Updated ${name}` : 'Updated all marketplaces',
    `Failed to update ${name || 'marketplaces'}`,
  )
}

/**
 * Execute a marketplace CLI command with generic args and messages
 * @param args - CLI arguments to pass to claude command
 * @param successMessage - Message to return on success
 * @param failureMessage - Message to return on failure
 * @returns Promise resolving to action result
 */

/**
 * Toggle auto-update setting for a marketplace
 * @param marketplaceId - The marketplace identifier
 * @param currentValue - Current auto-update state
 * @returns Promise resolving to action result with new state
 * @example
 * toggleAutoUpdate('claude-plugins-official', false) // enables auto-update
 * toggleAutoUpdate('claude-plugins-official', true) // disables auto-update
 */
export function toggleAutoUpdate(
  marketplaceId: string,
  currentValue: boolean,
): Promise<MarketplaceActionResult> {
  const newValue = !currentValue
  const args = newValue
    ? ['plugin', 'marketplace', 'auto-update', 'enable', marketplaceId]
    : ['plugin', 'marketplace', 'auto-update', 'disable', marketplaceId]
  return executeMarketplaceCommand(
    args,
    newValue
      ? `Enabled auto-update for ${marketplaceId}`
      : `Disabled auto-update for ${marketplaceId}`,
    `Failed to toggle auto-update for ${marketplaceId}`,
  )
}

function executeMarketplaceCommand(
  args: string[],
  successMessage: string,
  failureMessage: string,
): Promise<MarketplaceActionResult> {
  return new Promise((resolve) => {
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
          message: successMessage,
        })
      } else {
        resolve({
          success: false,
          message: failureMessage,
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
