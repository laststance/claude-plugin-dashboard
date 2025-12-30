/**
 * InstalledTab component
 * View and manage installed plugins
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import type { Plugin } from '../types/index.js'

interface InstalledTabProps {
  plugins: Plugin[]
  selectedIndex: number
}

/**
 * Installed tab - manage installed plugins
 * @example
 * <InstalledTab plugins={installedPlugins} selectedIndex={0} />
 */
export default function InstalledTab({
  plugins,
  selectedIndex,
}: InstalledTabProps) {
  // Filter to installed plugins only
  const installedPlugins = plugins.filter((p) => p.isInstalled)
  const selectedPlugin = installedPlugins[selectedIndex] ?? null

  // Count enabled/disabled
  const enabledCount = installedPlugins.filter((p) => p.isEnabled).length
  const disabledCount = installedPlugins.length - enabledCount

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with stats */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Installed plugins (
          {installedPlugins.length > 0
            ? `${selectedIndex + 1}/${installedPlugins.length}`
            : '0'}
          )
        </Text>
        <Box flexGrow={1} />
        <Box gap={2}>
          <Text color="green">● {enabledCount} enabled</Text>
          <Text color="yellow">◐ {disabledCount} disabled</Text>
        </Box>
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column">
          {installedPlugins.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">No plugins installed</Text>
              <Text dimColor>
                Use the Discover tab or{' '}
                <Text color="white">/plugin install</Text> in Claude Code
              </Text>
            </Box>
          ) : (
            <PluginList
              plugins={installedPlugins}
              selectedIndex={selectedIndex}
              visibleCount={12}
            />
          )}
        </Box>

        {/* Right panel: Plugin detail */}
        <Box width="50%" flexDirection="column">
          <PluginDetail plugin={selectedPlugin} />
        </Box>
      </Box>
    </Box>
  )
}
