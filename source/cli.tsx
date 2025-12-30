#!/usr/bin/env node
/**
 * CLI entry point for Claude Code Plugin Dashboard
 * Supports both interactive (TUI) and non-interactive (command) modes
 *
 * Usage:
 *   claude-plugin-dashboard                    # Interactive mode
 *   claude-plugin-dashboard status             # Show summary
 *   claude-plugin-dashboard list               # List all plugins
 *   claude-plugin-dashboard list --installed   # List installed plugins
 *   claude-plugin-dashboard enable <plugin-id> # Enable plugin
 *   claude-plugin-dashboard disable <plugin-id># Disable plugin
 *   claude-plugin-dashboard toggle <plugin-id> # Toggle plugin
 *   claude-plugin-dashboard help               # Show help
 */

import { render } from 'ink'
import App from './app.js'
import {
  loadAllPlugins,
  loadInstalledPlugins,
  loadMarketplaces,
  getPluginStatistics,
  getPluginById,
} from './services/pluginService.js'
import {
  enablePlugin,
  disablePlugin,
  togglePlugin,
} from './services/settingsService.js'
import { fileExists } from './services/fileService.js'
import { PATHS } from './utils/paths.js'

const args = process.argv.slice(2)
const command = args[0]
const subCommand = args[1]

/**
 * Show status summary
 */
function showStatus(): void {
  try {
    const stats = getPluginStatistics()
    const marketplaces = loadMarketplaces()

    console.log('')
    console.log('⚡ Claude Code Plugin Dashboard')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   Total plugins:    ${stats.total}`)
    console.log(`   Installed:        ${stats.installed}`)
    console.log(`   Enabled:          ${stats.enabled}`)
    console.log(`   Marketplaces:     ${marketplaces.length}`)
    console.log('')
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * List plugins
 */
function listPlugins(options: {
  installed?: boolean
  marketplace?: string
}): void {
  try {
    let plugins = options.installed ? loadInstalledPlugins() : loadAllPlugins()

    if (options.marketplace) {
      plugins = plugins.filter((p) => p.marketplace === options.marketplace)
    }

    if (plugins.length === 0) {
      console.log('No plugins found')
      return
    }

    console.log('')
    console.log(`Found ${plugins.length} plugins:`)
    console.log('')

    for (const plugin of plugins) {
      const status = plugin.isInstalled ? (plugin.isEnabled ? '●' : '◐') : '○'
      const statusColor = plugin.isInstalled
        ? plugin.isEnabled
          ? '\x1b[32m'
          : '\x1b[33m'
        : '\x1b[90m'
      const reset = '\x1b[0m'

      console.log(`${statusColor}${status}${reset} ${plugin.id}`)
      console.log(
        `  ${plugin.description.slice(0, 60)}${plugin.description.length > 60 ? '...' : ''}`,
      )
    }
    console.log('')
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * Enable a plugin
 */
function handleEnable(pluginId: string): void {
  try {
    const plugin = getPluginById(pluginId)
    if (!plugin) {
      console.error(`Plugin not found: ${pluginId}`)
      process.exit(1)
    }
    if (!plugin.isInstalled) {
      console.error(`Plugin not installed: ${pluginId}`)
      console.log('Install it first with: /plugin install in Claude Code')
      process.exit(1)
    }

    enablePlugin(pluginId)
    console.log(`✅ ${plugin.name} enabled`)
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * Disable a plugin
 */
function handleDisable(pluginId: string): void {
  try {
    const plugin = getPluginById(pluginId)
    if (!plugin) {
      console.error(`Plugin not found: ${pluginId}`)
      process.exit(1)
    }

    disablePlugin(pluginId)
    console.log(`❌ ${plugin.name} disabled`)
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * Toggle a plugin
 */
function handleToggle(pluginId: string): void {
  try {
    const plugin = getPluginById(pluginId)
    if (!plugin) {
      console.error(`Plugin not found: ${pluginId}`)
      process.exit(1)
    }
    if (!plugin.isInstalled) {
      console.error(`Plugin not installed: ${pluginId}`)
      console.log('Install it first with: /plugin install in Claude Code')
      process.exit(1)
    }

    const newState = togglePlugin(pluginId)
    console.log(
      `${newState ? '✅' : '❌'} ${plugin.name} ${newState ? 'enabled' : 'disabled'}`,
    )
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * Show plugin info
 */
function showPluginInfo(pluginId: string): void {
  try {
    const plugin = getPluginById(pluginId)
    if (!plugin) {
      console.error(`Plugin not found: ${pluginId}`)
      process.exit(1)
    }

    console.log('')
    console.log(`📦 ${plugin.name}`)
    console.log('')
    console.log(`ID:          ${plugin.id}`)
    console.log(`Marketplace: ${plugin.marketplace}`)
    console.log(`Version:     ${plugin.version}`)
    console.log(`Installs:    ${plugin.installCount.toLocaleString()}`)
    console.log(
      `Status:      ${plugin.isInstalled ? (plugin.isEnabled ? 'Installed & Enabled' : 'Installed & Disabled') : 'Not Installed'}`,
    )
    if (plugin.category) console.log(`Category:    ${plugin.category}`)
    if (plugin.author) console.log(`Author:      ${plugin.author.name}`)
    if (plugin.homepage) console.log(`Homepage:    ${plugin.homepage}`)
    console.log('')
    console.log('Description:')
    console.log(`  ${plugin.description}`)
    console.log('')
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    process.exit(1)
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
⚡ Claude Code Plugin Dashboard

An interactive CLI tool to browse and manage Claude Code plugins.

USAGE:
  claude-plugin-dashboard [command] [options]

COMMANDS:
  (none)                    Open interactive dashboard
  status                    Show summary statistics
  list                      List all available plugins
  list --installed          List installed plugins only
  list --marketplace <id>   List plugins from specific marketplace
  info <plugin-id>          Show plugin details
  enable <plugin-id>        Enable an installed plugin
  disable <plugin-id>       Disable a plugin
  toggle <plugin-id>        Toggle plugin enabled state
  help                      Show this help message

EXAMPLES:
  claude-plugin-dashboard
  claude-plugin-dashboard status
  claude-plugin-dashboard list --installed
  claude-plugin-dashboard info context7@claude-plugins-official
  claude-plugin-dashboard toggle context7@claude-plugins-official

INTERACTIVE MODE:
  ← →     Switch tabs
  ↑ ↓     Navigate list
  ^P ^N   Navigate list (Emacs-style)
  i       Install selected plugin
  u       Uninstall selected plugin
  Space   Toggle plugin enable/disable
  /       Search plugins
  s       Cycle sort options
  q       Quit

For more information, visit:
  https://github.com/laststance/claude-code-plugin-dashboard
`)
}

/**
 * Check if Claude Code is installed
 */
function checkClaudeCodeInstalled(): void {
  if (!fileExists(PATHS.settings)) {
    console.error('')
    console.error('❌ Claude Code not found')
    console.error('')
    console.error('This tool requires Claude Code to be installed.')
    console.error('Expected settings file at: ' + PATHS.settings)
    console.error('')
    console.error('Install Claude Code: https://claude.ai/code')
    console.error('')
    process.exit(1)
  }
}

// Main execution
if (command) {
  // Non-interactive mode
  checkClaudeCodeInstalled()

  switch (command) {
    case 'status':
      showStatus()
      break

    case 'list':
      if (subCommand === '--installed' || args.includes('--installed')) {
        listPlugins({ installed: true })
      } else if (
        subCommand === '--marketplace' ||
        args.includes('--marketplace')
      ) {
        const marketplaceIndex = args.indexOf('--marketplace')
        const marketplace = args[marketplaceIndex + 1]
        listPlugins({ marketplace })
      } else {
        listPlugins({})
      }
      break

    case 'info':
      if (!subCommand) {
        console.error('Usage: claude-plugin-dashboard info <plugin-id>')
        process.exit(1)
      }
      showPluginInfo(subCommand)
      break

    case 'enable':
      if (!subCommand) {
        console.error('Usage: claude-plugin-dashboard enable <plugin-id>')
        process.exit(1)
      }
      handleEnable(subCommand)
      break

    case 'disable':
      if (!subCommand) {
        console.error('Usage: claude-plugin-dashboard disable <plugin-id>')
        process.exit(1)
      }
      handleDisable(subCommand)
      break

    case 'toggle':
      if (!subCommand) {
        console.error('Usage: claude-plugin-dashboard toggle <plugin-id>')
        process.exit(1)
      }
      handleToggle(subCommand)
      break

    case 'help':
    case '-h':
    case '--help':
      showHelp()
      break

    case '-v':
    case '--version':
      console.log('claude-plugin-dashboard v0.1.0')
      break

    default:
      console.error(`Unknown command: ${command}`)
      console.log('Run "claude-plugin-dashboard help" for usage information.')
      process.exit(1)
  }
} else {
  // Interactive mode
  checkClaudeCodeInstalled()

  if (!process.stdin.isTTY) {
    console.log('Interactive mode requires a TTY.')
    console.log(
      'Use "claude-plugin-dashboard help" for non-interactive commands.',
    )
    process.exit(1)
  }

  render(<App />)
}
