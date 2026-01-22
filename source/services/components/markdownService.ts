/**
 * Markdown component detection and parsing service
 * Handles commands/ and agents/ directory scanning
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { directoryExists, fileExists } from '../fileService.js'
import type { ComponentInfo, ComponentDetailedInfo } from '../../types/index.js'

/**
 * Count .md files in a specific directory
 * @param installPath - Plugin install path
 * @param subdir - Subdirectory name ('commands' or 'agents')
 * @returns Number of .md files
 */
export function countMarkdownFiles(
  installPath: string,
  subdir: string,
): number {
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
 * Get component details from .md files in a directory
 * Uses filename (minus extension) as component name
 * @param installPath - Plugin install path
 * @param subdir - Subdirectory name ('commands' or 'agents')
 * @param type - Component type
 * @returns Array of ComponentInfo
 */
export function getMarkdownFileDetails(
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
 * Get detailed info for a command or agent markdown file
 * @param installPath - Plugin install path
 * @param componentName - Name of the component (without .md)
 * @param type - Component type ('command' or 'agent')
 * @returns ComponentDetailedInfo with full content
 */
export function getMarkdownComponentDetailedInfo(
  installPath: string,
  componentName: string,
  type: 'command' | 'agent',
): ComponentDetailedInfo | undefined {
  const subdir = type === 'command' ? 'commands' : 'agents'
  const filePath = path.join(installPath, subdir, `${componentName}.md`)

  if (!fileExists(filePath)) {
    return undefined
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // Reuse content instead of reading file twice
    const description = parseFirstLineDescriptionFromContent(content)

    return {
      name: componentName,
      type,
      description,
      fullDescription: content,
      filePath,
    }
  } catch {
    return undefined
  }
}

/**
 * Parse first non-empty line of content as description
 * Properly skips YAML frontmatter block and strips heading markers
 * @param content - Markdown content string
 * @returns First non-frontmatter, non-empty line or undefined
 * @example
 * parseFirstLineDescriptionFromContent("---\nname: test\n---\n# My Title\n")
 * // => "My Title"
 */
export function parseFirstLineDescriptionFromContent(
  content: string,
): string | undefined {
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
    return parseFirstLineDescriptionFromContent(content)
  } catch {
    return undefined
  }
}
