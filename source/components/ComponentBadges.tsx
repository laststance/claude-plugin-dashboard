/**
 * ComponentBadges component
 * Displays plugin component type badges with readable text labels and counts
 * Labels: Skills, Slash, Agents, Hooks, MCP, LSP
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
 * Badge configurations with readable text labels and colors
 */
const BADGE_CONFIGS: BadgeConfig[] = [
  { label: 'Skills', color: 'magenta', key: 'skills' },
  { label: 'Slash', color: 'cyan', key: 'commands' },
  { label: 'Agents', color: 'blue', key: 'agents' },
  { label: 'Hooks', color: 'yellow', key: 'hooks', isBoolean: true },
  { label: 'MCP', color: 'green', key: 'mcpServers' },
  { label: 'LSP', color: 'blueBright', key: 'lspServers' },
]

/**
 * Displays component type badges for a plugin
 * Only shows badges for components that exist
 * @param components - PluginComponents object with counts/flags
 * @returns Badges component or null if no components
 * @example
 * <ComponentBadges components={{ skills: 5, commands: 2 }} />
 * // Renders: Skills:5 Slash:2
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
 * Renders as "Label:count" without brackets for better readability
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
      <Text color={color} bold>
        {label}
      </Text>
      {count !== undefined && <Text dimColor>:{count}</Text>}
    </Text>
  )
}
