/**
 * Hook component detection service
 * Handles hooks/ directory and hooks.json scanning
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { readJsonFile, directoryExists, fileExists } from '../fileService.js'

/**
 * Detect if plugin has hooks configured
 * Checks for hooks/ directory or hooks.json file
 * @param installPath - Plugin install path
 * @returns true if hooks are configured
 */
export function detectHooks(installPath: string): boolean {
  const hooksDir = path.join(installPath, 'hooks')
  const hooksJson = path.join(installPath, 'hooks.json')

  return directoryExists(hooksDir) || fileExists(hooksJson)
}

/**
 * Get hook event names from hooks configuration
 * @param installPath - Plugin install path
 * @returns Array of hook event names
 */
export function getHookNames(installPath: string): string[] {
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
