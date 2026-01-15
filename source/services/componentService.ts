/**
 * Component service for detecting plugin component types
 * Parses plugin.json and scans plugin directory structure to identify
 * skills, commands, agents, hooks, MCP servers, and LSP servers
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { readJsonFile, directoryExists, fileExists } from './fileService.js'
import type {
  ComponentInfo,
  PluginComponents,
  PluginComponentsDetailed,
} from '../types/index.js'

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

/**
 * Get skill details from skills/ directory
 * Reads directory names and parses SKILL.md frontmatter for descriptions
 * @param installPath - Plugin install path
 * @returns Array of ComponentInfo for each skill
 */
function getSkillDetails(installPath: string): ComponentInfo[] {
  const skillsPath = path.join(installPath, 'skills')
  if (!directoryExists(skillsPath)) {
    return []
  }

  try {
    const entries = fs.readdirSync(skillsPath, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const skillMdPath = path.join(skillsPath, entry.name, 'SKILL.md')
        const description = parseSkillMdDescription(skillMdPath)
        return {
          name: entry.name,
          description,
          type: 'skill' as const,
        }
      })
  } catch {
    return []
  }
}

/**
 * Parse SKILL.md frontmatter for description
 * Looks for `description:` field in YAML frontmatter
 * @param skillMdPath - Path to SKILL.md file
 * @returns Description string or undefined
 */
function parseSkillMdDescription(skillMdPath: string): string | undefined {
  if (!fileExists(skillMdPath)) {
    return undefined
  }

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8')
    // Match YAML frontmatter description field
    const match = content.match(
      /^---\n[\s\S]*?description:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/m,
    )
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

/**
 * Get component details from .md files in a directory
 * Uses filename (minus extension) as component name
 * @param installPath - Plugin install path
 * @param subdir - Subdirectory name ('commands' or 'agents')
 * @param type - Component type
 * @returns Array of ComponentInfo
 */
function getMarkdownFileDetails(
  installPath: string,
  subdir: string,
  type: 'command' | 'agent',
): ComponentInfo[] {
  const dirPath = path.join(installPath, subdir)
  if (!directoryExists(dirPath)) {
    return []
  }

  try {
    const files = fs.readdirSync(dirPath)
    return files
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const name = file.replace(/\.md$/, '')
        const filePath = path.join(dirPath, file)
        const description = parseFirstLineDescription(filePath)
        return {
          name,
          description,
          type,
        }
      })
  } catch {
    return []
  }
}

/**
 * Parse first non-empty line of a markdown file as description
 * Properly skips YAML frontmatter block and strips heading markers
 * @param filePath - Path to markdown file
 * @returns First non-frontmatter, non-empty line or undefined
 * @example
 * // File: "---\nname: test\n---\n# My Title\n"
 * parseFirstLineDescription(path) // => "My Title"
 */
function parseFirstLineDescription(filePath: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    let inFrontmatter = false
    let frontmatterClosed = false

    for (const line of lines) {
      const trimmed = line.trim()

      // Detect frontmatter delimiter
      if (trimmed === '---') {
        if (!inFrontmatter && !frontmatterClosed) {
          // Opening delimiter
          inFrontmatter = true
          continue
        } else if (inFrontmatter) {
          // Closing delimiter
          inFrontmatter = false
          frontmatterClosed = true
          continue
        }
      }

      // Skip lines inside frontmatter
      if (inFrontmatter) {
        continue
      }

      // Skip empty lines
      if (!trimmed) {
        continue
      }

      // Found first content line - remove heading markers and return
      return trimmed.replace(/^#+\s*/, '')
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Get hook event names from hooks configuration
 * @param installPath - Plugin install path
 * @returns Array of hook event names
 */
function getHookNames(installPath: string): string[] {
  // Try hooks.json first
  const hooksJsonPath = path.join(installPath, 'hooks.json')
  const hooksJson = readJsonFile<Record<string, unknown>>(hooksJsonPath)
  if (hooksJson) {
    return Object.keys(hooksJson)
  }

  // Try hooks/ directory
  const hooksDir = path.join(installPath, 'hooks')
  if (directoryExists(hooksDir)) {
    try {
      const files = fs.readdirSync(hooksDir)
      return files
        .filter((f) => f.endsWith('.json') || f.endsWith('.js'))
        .map((f) => f.replace(/\.(json|js)$/, ''))
    } catch {
      return []
    }
  }

  return []
}

/**
 * Get MCP server names from plugin.json
 * @param installPath - Plugin install path
 * @returns Array of MCP server names
 */
function getMcpServerNames(installPath: string): string[] {
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
 * Get LSP server language IDs from .lsp.json
 * @param installPath - Plugin install path
 * @returns Array of language IDs
 */
function getLspServerNames(installPath: string): string[] {
  const lspJsonPath = path.join(installPath, '.lsp.json')
  const lspConfig = readJsonFile<LspConfig>(lspJsonPath)

  if (!lspConfig) {
    return []
  }

  return Object.keys(lspConfig)
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
