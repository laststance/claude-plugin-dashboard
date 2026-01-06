/**
 * ComponentBadges component
 * Displays plugin component type badges with icons and counts
 * Icons: Skills(S), Commands(/), Agents(@), Hooks(H), MCP(M), LSP(L)
 */

import { Box, Text } from 'ink'
import type { PluginComponents } from '../types/index.js'

/**
 * Props for ComponentBadges
 */
export interface ComponentBadgesProps {
  /** Component counts/flags from plugin */
  components: PluginComponents | undefined
}

/**
 * Badge configuration for each component type
 */
interface BadgeConfig {
  /** Short label for the badge */
  label: string
  /** Color for the badge */
  color: string
  /** Key in PluginComponents */
  key: keyof PluginComponents
  /** Whether this is a boolean (hooks) or count */
  isBoolean?: boolean
}

/**
 * Badge configurations with intuitive abbreviations and colors
 */
const BADGE_CONFIGS: BadgeConfig[] = [
  { label: 'S', color: 'magenta', key: 'skills' },
  { label: '/', color: 'cyan', key: 'commands' },
  { label: '@', color: 'blue', key: 'agents' },
  { label: 'H', color: 'yellow', key: 'hooks', isBoolean: true },
  { label: 'M', color: 'green', key: 'mcpServers' },
  { label: 'L', color: 'blueBright', key: 'lspServers' },
]

/**
 * Displays component type badges for a plugin
 * Only shows badges for components that exist
 * @param components - PluginComponents object with counts/flags
 * @returns Badges component or null if no components
 * @example
 * <ComponentBadges components={{ skills: 5, commands: 2 }} />
 * // Renders: [S:5] [/:2]
 */
export default function ComponentBadges({
  components,
}: ComponentBadgesProps): React.ReactNode {
  if (!components) {
    return null
  }

  const badges = BADGE_CONFIGS.filter((config) => {
    const value = components[config.key]
    if (config.isBoolean) {
      return value === true
    }
    return typeof value === 'number' && value > 0
  })

  if (badges.length === 0) {
    return null
  }

  return (
    <Box gap={1} flexWrap="wrap">
      {badges.map((config) => (
        <Badge
          key={config.key}
          label={config.label}
          count={
            config.isBoolean ? undefined : (components[config.key] as number)
          }
          color={config.color}
        />
      ))}
    </Box>
  )
}

/**
 * Single badge component
 */
function Badge({
  label,
  count,
  color,
}: {
  label: string
  count?: number
  color: string
}): React.ReactNode {
  return (
    <Text>
      <Text dimColor>[</Text>
      <Text color={color} bold>
        {label}
      </Text>
      {count !== undefined && <Text dimColor>:{count}</Text>}
      <Text dimColor>]</Text>
    </Text>
  )
}

/**
 * Get a human-readable description of component types
 * @param components - PluginComponents object
 * @returns Formatted string describing components
 * @example
 * getComponentsDescription({ skills: 3, mcpServers: 1 })
 * // => "3 skills, 1 MCP server"
 */
export function getComponentsDescription(
  components: PluginComponents | undefined,
): string {
  if (!components) {
    return ''
  }

  const parts: string[] = []

  if (components.skills) {
    parts.push(`${components.skills} skill${components.skills > 1 ? 's' : ''}`)
  }
  if (components.commands) {
    parts.push(
      `${components.commands} command${components.commands > 1 ? 's' : ''}`,
    )
  }
  if (components.agents) {
    parts.push(`${components.agents} agent${components.agents > 1 ? 's' : ''}`)
  }
  if (components.hooks) {
    parts.push('hooks')
  }
  if (components.mcpServers) {
    parts.push(
      `${components.mcpServers} MCP server${components.mcpServers > 1 ? 's' : ''}`,
    )
  }
  if (components.lspServers) {
    parts.push(
      `${components.lspServers} LSP server${components.lspServers > 1 ? 's' : ''}`,
    )
  }

  return parts.join(', ')
}
