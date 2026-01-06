/**
 * Component service for detecting plugin component types
 * Parses plugin.json and scans plugin directory structure to identify
 * skills, commands, agents, hooks, MCP servers, and LSP servers
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { readJsonFile, directoryExists, fileExists } from './fileService.js'
import type { PluginComponents } from '../types/index.js'

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
 * Detect all component types for a plugin at the given install path
 * @param installPath - Absolute path to the installed plugin directory
 * @returns PluginComponents object with detected component counts
 * - Returns undefined values for components that are not present
 * - Returns counts > 0 for components that exist
 * @example
 * const components = detectPluginComponents('/path/to/plugin')
 * // => { skills: 5, commands: 2, mcpServers: 1 }
 */
export function detectPluginComponents(
  installPath: string,
): PluginComponents | undefined {
  if (!directoryExists(installPath)) {
    return undefined
  }

  const components: PluginComponents = {}

  // Detect skills (count directories in skills/ folder)
  const skillsCount = countSkills(installPath)
  if (skillsCount > 0) {
    components.skills = skillsCount
  }

  // Detect commands (count .md files in commands/ folder)
  const commandsCount = countMarkdownFiles(installPath, 'commands')
  if (commandsCount > 0) {
    components.commands = commandsCount
  }

  // Detect agents (count .md files in agents/ folder)
  const agentsCount = countMarkdownFiles(installPath, 'agents')
  if (agentsCount > 0) {
    components.agents = agentsCount
  }

  // Detect hooks
  const hasHooks = detectHooks(installPath)
  if (hasHooks) {
    components.hooks = true
  }

  // Detect MCP servers from plugin.json
  const mcpCount = countMcpServers(installPath)
  if (mcpCount > 0) {
    components.mcpServers = mcpCount
  }

  // Detect LSP servers from .lsp.json
  const lspCount = countLspServers(installPath)
  if (lspCount > 0) {
    components.lspServers = lspCount
  }

  // Return undefined if no components detected
  if (Object.keys(components).length === 0) {
    return undefined
  }

  return components
}

/**
 * Count skill directories in the skills/ folder
 * Skills are stored as subdirectories with SKILL.md files
 * @param installPath - Plugin install path
 * @returns Number of skill directories
 */
function countSkills(installPath: string): number {
  const skillsPath = path.join(installPath, 'skills')
  if (!directoryExists(skillsPath)) {
    return 0
  }

  try {
    const entries = fs.readdirSync(skillsPath, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).length
  } catch {
    return 0
  }
}

/**
 * Count .md files in a specific directory
 * @param installPath - Plugin install path
 * @param subdir - Subdirectory name ('commands' or 'agents')
 * @returns Number of .md files
 */
function countMarkdownFiles(installPath: string, subdir: string): number {
  const dirPath = path.join(installPath, subdir)
  if (!directoryExists(dirPath)) {
    return 0
  }

  try {
    const files = fs.readdirSync(dirPath)
    return files.filter((file) => file.endsWith('.md')).length
  } catch {
    return 0
  }
}

/**
 * Detect if plugin has hooks configured
 * Checks for hooks/ directory or hooks.json file
 * @param installPath - Plugin install path
 * @returns true if hooks are configured
 */
function detectHooks(installPath: string): boolean {
  const hooksDir = path.join(installPath, 'hooks')
  const hooksJson = path.join(installPath, 'hooks.json')

  return directoryExists(hooksDir) || fileExists(hooksJson)
}

/**
 * Count MCP servers defined in plugin.json
 * @param installPath - Plugin install path
 * @returns Number of MCP server configurations
 */
function countMcpServers(installPath: string): number {
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
 * Count LSP servers defined in .lsp.json
 * @param installPath - Plugin install path
 * @returns Number of LSP server configurations
 */
function countLspServers(installPath: string): number {
  const lspJsonPath = path.join(installPath, '.lsp.json')
  const lspConfig = readJsonFile<LspConfig>(lspJsonPath)

  if (!lspConfig) {
    return 0
  }

  return Object.keys(lspConfig).length
}

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
