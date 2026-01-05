/**
 * EnabledTab component
 * View and manage enabled plugins (installed + enabled)
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import type { Plugin } from '../types/index.js'

interface EnabledTabProps {
  plugins: Plugin[]
  selectedIndex: number
}

/**
 * Enabled tab - view currently active plugins
 * @param plugins - All plugins (will be filtered to enabled only)
 * @param selectedIndex - Currently selected item index
 * @returns Enabled tab component
 * @example
 * <EnabledTab plugins={allPlugins} selectedIndex={0} />
 */
export default function EnabledTab({
  plugins,
  selectedIndex,
}: EnabledTabProps) {
  // Filter to enabled plugins only (installed AND enabled)
  const enabledPlugins = plugins.filter((p) => p.isInstalled && p.isEnabled)
  const selectedPlugin = enabledPlugins[selectedIndex] ?? null

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with count */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Enabled plugins (
          {enabledPlugins.length > 0
            ? `${selectedIndex + 1}/${enabledPlugins.length}`
            : '0'}
          )
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>Currently active in Claude Code</Text>
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column">
          {enabledPlugins.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">No enabled plugins</Text>
              <Text dimColor>
                Enable plugins in the Installed tab or use{' '}
                <Text color="white">/plugin enable</Text> in Claude Code
              </Text>
            </Box>
          ) : (
            <PluginList
              plugins={enabledPlugins}
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
