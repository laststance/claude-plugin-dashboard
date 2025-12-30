/**
 * File service for safe JSON read/write operations
 * Provides atomic writes and proper error handling
 */

import * as fs from 'node:fs'

/**
 * Safely read a JSON file with error handling
 * @param filePath - Absolute path to JSON file
 * @returns Parsed JSON or null if file doesn't exist
 * @throws Error if file exists but contains invalid JSON
 * @example
 * const data = readJsonFile<Settings>('/path/to/settings.json');
 * // Returns parsed Settings or null
 */
export function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Safely write a JSON file with atomic write (write to temp, then rename)
 * @param filePath - Absolute path to JSON file
 * @param data - Data to write
 * @throws Error if write fails
 * @example
 * writeJsonFile('/path/to/settings.json', { enabledPlugins: {} });
 */
export function writeJsonFile<T>(filePath: string, data: T): void {
  const tempPath = `${filePath}.tmp`
  try {
    const content = JSON.stringify(data, null, 2) + '\n'
    // Write to temp file first
    fs.writeFileSync(tempPath, content, 'utf-8')
    // Atomic rename
    fs.renameSync(tempPath, filePath)
  } catch (error) {
    // Cleanup temp file on error
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
    throw new Error(
      `Failed to write ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Check if a directory exists
 * @param dirPath - Absolute path to directory
 * @returns true if directory exists
 */
export function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if a file exists
 * @param filePath - Absolute path to file
 * @returns true if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

/**
 * List directories in a directory
 * @param dirPath - Absolute path to directory
 * @returns Array of directory names (not full paths)
 */
export function listDirectories(dirPath: string): string[] {
  try {
    if (!directoryExists(dirPath)) {
      return []
    }
    return fs.readdirSync(dirPath).filter((name) => {
      const fullPath = `${dirPath}/${name}`
      return fs.statSync(fullPath).isDirectory()
    })
  } catch {
    return []
  }
}
