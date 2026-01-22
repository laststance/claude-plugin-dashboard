/**
 * Server component detection service
 * Handles MCP and LSP server detection from configuration files
 */

import * as path from 'node:path'
import { readJsonFile } from '../fileService.js'

/**
 * Plugin.json structure with component-related fields
 */
interface PluginJson {
  name?: string
  description?: string
  mcpServers?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * LSP configuration file structure
 */
interface LspConfig {
  [languageId: string]: {
    command: string
    args?: string[]
    [key: string]: unknown
  }
}

/**
 * Count MCP servers defined in plugin.json
 * @param installPath - Plugin install path
 * @returns Number of MCP server configurations
 */
export function countMcpServers(installPath: string): number {
  // Check both .claude-plugin/plugin.json and plugin.json at root
  const pluginJsonPaths = [
    path.join(installPath, '.claude-plugin', 'plugin.json'),
    path.join(installPath, 'plugin.json'),
  ]

  for (const pluginJsonPath of pluginJsonPaths) {
    const pluginJson = readJsonFile<PluginJson>(pluginJsonPath)
    if (pluginJson?.mcpServers) {
      return Object.keys(pluginJson.mcpServers).length
    }
  }

  return 0
}

/**
 * Get MCP server names from plugin.json
 * @param installPath - Plugin install path
 * @returns Array of MCP server names
 */
export function getMcpServerNames(installPath: string): string[] {
  const pluginJsonPaths = [
    path.join(installPath, '.claude-plugin', 'plugin.json'),
    path.join(installPath, 'plugin.json'),
  ]

  for (const pluginJsonPath of pluginJsonPaths) {
    const pluginJson = readJsonFile<PluginJson>(pluginJsonPath)
    if (pluginJson?.mcpServers) {
      return Object.keys(pluginJson.mcpServers)
    }
  }

  return []
}

/**
 * Count LSP servers defined in .lsp.json
 * @param installPath - Plugin install path
 * @returns Number of LSP server configurations
 */
export function countLspServers(installPath: string): number {
  const lspJsonPath = path.join(installPath, '.lsp.json')
  const lspConfig = readJsonFile<LspConfig>(lspJsonPath)

  if (!lspConfig) {
    return 0
  }

  return Object.keys(lspConfig).length
}

/**
 * Get LSP server language IDs from .lsp.json
 * @param installPath - Plugin install path
 * @returns Array of language IDs
 */
export function getLspServerNames(installPath: string): string[] {
  const lspJsonPath = path.join(installPath, '.lsp.json')
  const lspConfig = readJsonFile<LspConfig>(lspJsonPath)

  if (!lspConfig) {
    return []
  }

  return Object.keys(lspConfig)
}
