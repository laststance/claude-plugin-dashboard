/**
 * Skill component detection and parsing service
 * Handles skills/ directory scanning and SKILL.md parsing
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { directoryExists, fileExists } from '../fileService.js'
import type { ComponentInfo, ComponentDetailedInfo } from '../../types/index.js'

/**
 * Result of parsing full SKILL.md content
 */
export interface SkillMdFullResult {
  description?: string
  allowedTools?: string[]
  fullDescription?: string
}

/**
 * Count skill directories in the skills/ folder
 * Skills are stored as subdirectories with SKILL.md files
 * @param installPath - Plugin install path
 * @returns Number of skill directories
 */
export function countSkills(installPath: string): number {
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
 * Get skill details from skills/ directory
 * Reads directory names and parses SKILL.md frontmatter for descriptions
 * @param installPath - Plugin install path
 * @returns Array of ComponentInfo for each skill
 */
export function getSkillDetails(installPath: string): ComponentInfo[] {
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
 * Parse full SKILL.md content including frontmatter and body
 * Extracts description, allowed-tools, and full markdown body
 * @param skillMdPath - Path to SKILL.md file
 * @returns Parsed content or undefined if file doesn't exist
 * @example
 * parseSkillMdFull('/path/to/SKILL.md')
 * // => { description: "...", allowedTools: ["Read", "Edit"], fullDescription: "..." }
 */
export function parseSkillMdFull(
  skillMdPath: string,
): SkillMdFullResult | undefined {
  if (!fileExists(skillMdPath)) {
    return undefined
  }

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8')
    const result: SkillMdFullResult = {}

    // Check for frontmatter
    if (!content.startsWith('---')) {
      // No frontmatter, entire content is the body
      result.fullDescription = content.trim()
      return result
    }

    // Find closing frontmatter delimiter
    const endIndex = content.indexOf('---', 3)
    if (endIndex === -1) {
      // Malformed frontmatter
      result.fullDescription = content.trim()
      return result
    }

    const frontmatter = content.substring(3, endIndex)
    const body = content.substring(endIndex + 3).trim()

    // Parse description from frontmatter
    const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m)
    if (descMatch?.[1]) {
      result.description = descMatch[1].trim()
    }

    // Parse allowed-tools from frontmatter (can be array or comma-separated)
    const toolsMatch = frontmatter.match(/allowed-tools:\s*\[([^\]]+)\]/m)
    if (toolsMatch?.[1]) {
      // Array format: allowed-tools: [Read, Edit, Write]
      result.allowedTools = toolsMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/["']/g, ''))
        .filter(Boolean)
    } else {
      // Try single line format: allowed-tools: Read, Edit
      const singleMatch = frontmatter.match(/allowed-tools:\s*(.+)$/m)
      if (singleMatch?.[1]) {
        result.allowedTools = singleMatch[1]
          .split(',')
          .map((t) => t.trim().replace(/["']/g, ''))
          .filter(Boolean)
      }
    }

    // Body is the content after frontmatter
    if (body) {
      result.fullDescription = body
    }

    return result
  } catch {
    return undefined
  }
}

/**
 * Get detailed info for a specific skill component
 * @param installPath - Plugin install path
 * @param skillName - Name of the skill directory
 * @returns ComponentDetailedInfo with full SKILL.md content
 * @example
 * getSkillDetailedInfo('/path/to/plugin', 'sentry-code-review')
 * // => { name: 'sentry-code-review', type: 'skill', allowedTools: [...], ... }
 */
export function getSkillDetailedInfo(
  installPath: string,
  skillName: string,
): ComponentDetailedInfo | undefined {
  const skillMdPath = path.join(installPath, 'skills', skillName, 'SKILL.md')

  if (!fileExists(skillMdPath)) {
    return undefined
  }

  const parsed = parseSkillMdFull(skillMdPath)

  return {
    name: skillName,
    type: 'skill',
    description: parsed?.description,
    allowedTools: parsed?.allowedTools,
    fullDescription: parsed?.fullDescription,
    filePath: skillMdPath,
  }
}
