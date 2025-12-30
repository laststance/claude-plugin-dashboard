/**
 * Settings service for managing plugin enable/disable state
 * Reads and writes to ~/.claude/settings.json
 */

import { readJsonFile, writeJsonFile } from './fileService.js'
import { PATHS } from '../utils/paths.js'
import type { Settings } from '../types/index.js'

/**
 * Read current settings from settings.json
 * @returns Settings object
 * @throws Error if settings.json doesn't exist or is invalid
 * @example
 * const settings = readSettings();
 * console.log(settings.enabledPlugins);
 */
export function readSettings(): Settings {
  const settings = readJsonFile<Settings>(PATHS.settings)
  if (!settings) {
    throw new Error(
      `settings.json not found at ${PATHS.settings}. Is Claude Code installed?`,
    )
  }
  return settings
}

/**
 * Write settings to settings.json
 * @param settings - Settings object to write
 * @example
 * const settings = readSettings();
 * settings.enabledPlugins['my-plugin@marketplace'] = true;
 * writeSettings(settings);
 */
export function writeSettings(settings: Settings): void {
  writeJsonFile(PATHS.settings, settings)
}

/**
 * Get enabled plugins map from settings
 * @returns Record of plugin IDs to enabled state
 * @example
 * const enabled = getEnabledPlugins();
 * // { "context7@claude-plugins-official": true, ... }
 */
export function getEnabledPlugins(): Record<string, boolean> {
  const settings = readSettings()
  return settings.enabledPlugins ?? {}
}

/**
 * Check if a plugin is enabled
 * @param pluginId - Plugin identifier (e.g., "context7@claude-plugins-official")
 * @returns true if enabled, false if disabled or not found
 * @example
 * isPluginEnabled("context7@claude-plugins-official"); // true/false
 */
export function isPluginEnabled(pluginId: string): boolean {
  const enabled = getEnabledPlugins()
  return enabled[pluginId] ?? false
}

/**
 * Set plugin enabled state
 * @param pluginId - Plugin identifier
 * @param enabled - Whether to enable or disable
 * @example
 * setPluginEnabled("context7@claude-plugins-official", true);
 */
export function setPluginEnabled(pluginId: string, enabled: boolean): void {
  const settings = readSettings()
  if (!settings.enabledPlugins) {
    settings.enabledPlugins = {}
  }
  settings.enabledPlugins[pluginId] = enabled
  writeSettings(settings)
}

/**
 * Enable a plugin
 * @param pluginId - Plugin identifier
 * @example
 * enablePlugin("context7@claude-plugins-official");
 */
export function enablePlugin(pluginId: string): void {
  setPluginEnabled(pluginId, true)
}

/**
 * Disable a plugin
 * @param pluginId - Plugin identifier
 * @example
 * disablePlugin("context7@claude-plugins-official");
 */
export function disablePlugin(pluginId: string): void {
  setPluginEnabled(pluginId, false)
}

/**
 * Toggle plugin enabled state
 * @param pluginId - Plugin identifier
 * @returns New enabled state
 * @example
 * const newState = togglePlugin("context7@claude-plugins-official");
 * console.log(`Plugin is now ${newState ? 'enabled' : 'disabled'}`);
 */
export function togglePlugin(pluginId: string): boolean {
  const currentState = isPluginEnabled(pluginId)
  setPluginEnabled(pluginId, !currentState)
  return !currentState
}

/**
 * Get plugin statistics from settings
 * @returns Object with counts of enabled/disabled plugins
 * @example
 * const stats = getPluginStats();
 * // { total: 21, enabled: 13, disabled: 8 }
 */
export function getPluginStats(): {
  total: number
  enabled: number
  disabled: number
} {
  const enabled = getEnabledPlugins()
  const entries = Object.entries(enabled)
  const enabledCount = entries.filter(([, v]) => v === true).length
  return {
    total: entries.length,
    enabled: enabledCount,
    disabled: entries.length - enabledCount,
  }
}
