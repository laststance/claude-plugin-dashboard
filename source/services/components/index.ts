/**
 * Component service module index
 * Re-exports all component detection and parsing functions
 *
 * This module provides a facade for detecting plugin components:
 * - Skills (skills/ directory with SKILL.md files)
 * - Commands (commands/ directory with .md files)
 * - Agents (agents/ directory with .md files)
 * - Hooks (hooks/ directory or hooks.json)
 * - MCP Servers (plugin.json mcpServers)
 * - LSP Servers (.lsp.json)
 */

// Re-export all from submodules for backward compatibility
export { hasAnyComponents, getTotalComponentCount } from './utils.js'

export {
  countSkills,
  getSkillDetails,
  parseSkillMdFull,
  getSkillDetailedInfo,
  type SkillMdFullResult,
} from './skillService.js'

export {
  countMarkdownFiles,
  getMarkdownFileDetails,
  getMarkdownComponentDetailedInfo,
  parseFirstLineDescriptionFromContent,
} from './markdownService.js'

export { detectHooks, getHookNames } from './hookService.js'

export {
  countMcpServers,
  getMcpServerNames,
  countLspServers,
  getLspServerNames,
} from './serverService.js'

// Re-export types
export type { ComponentInfo, ComponentDetailedInfo } from '../../types/index.js'

import { directoryExists } from '../fileService.js'
import type {
  PluginComponents,
  PluginComponentsDetailed,
} from '../../types/index.js'

// Import from submodules for orchestration functions
import { countSkills, getSkillDetails } from './skillService.js'
import {
  countMarkdownFiles,
  getMarkdownFileDetails,
} from './markdownService.js'
import { detectHooks, getHookNames } from './hookService.js'
import {
  countMcpServers,
  getMcpServerNames,
  countLspServers,
  getLspServerNames,
} from './serverService.js'

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

  // Detect commands (legacy location, now unified with skills in Claude Code v2.1.3+)
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
 * Detect detailed components for an installed plugin
 * Reads skills/, commands/, agents/ directories and parses plugin.json
 * @param installPath - Absolute path to installed plugin directory
 * @returns Detailed component info with names and descriptions
 * - Returns undefined if path doesn't exist or has no components
 * @example
 * detectComponentsDetailed('/path/to/plugin')
 * // => { skills: [{ name: 'xlsx', description: '...', type: 'skill' }] }
 */
export function detectComponentsDetailed(
  installPath: string,
): PluginComponentsDetailed | undefined {
  if (!directoryExists(installPath)) {
    return undefined
  }

  const detailed: PluginComponentsDetailed = {}

  // Skills: Read directory names + SKILL.md frontmatter
  const skills = getSkillDetails(installPath)
  if (skills.length > 0) {
    detailed.skills = skills
  }

  // Commands: Read .md filenames
  const commands = getMarkdownFileDetails(installPath, 'commands', 'command')
  if (commands.length > 0) {
    detailed.commands = commands
  }

  // Agents: Read .md filenames
  const agents = getMarkdownFileDetails(installPath, 'agents', 'agent')
  if (agents.length > 0) {
    detailed.agents = agents
  }

  // Hooks: Read event names from hooks.json or hooks/ directory
  const hooks = getHookNames(installPath)
  if (hooks.length > 0) {
    detailed.hooks = hooks
  }

  // MCP Servers: Read plugin.json mcpServers keys
  const mcpServers = getMcpServerNames(installPath)
  if (mcpServers.length > 0) {
    detailed.mcpServers = mcpServers
  }

  // LSP Servers: Read .lsp.json keys
  const lspServers = getLspServerNames(installPath)
  if (lspServers.length > 0) {
    detailed.lspServers = lspServers
  }

  // Return undefined if no components detected
  if (Object.keys(detailed).length === 0) {
    return undefined
  }

  return detailed
}
