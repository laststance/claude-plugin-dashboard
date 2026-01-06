/**
 * InstalledTab component
 * View and manage installed plugins
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import SearchInput from '../components/SearchInput.js'
import type { Plugin, FocusZone } from '../types/index.js'

interface InstalledTabProps {
  plugins: Plugin[]
  selectedIndex: number
  searchQuery?: string
  /** Current focus zone for keyboard navigation */
  focusZone?: FocusZone
}

/**
 * Installed tab - manage installed plugins
 * @param plugins - Filtered installed plugins (search already applied by parent)
 * @param selectedIndex - Currently selected item index
 * @param searchQuery - Current search query string
 * @param focusZone - Current focus zone for keyboard navigation
 * @example
 * <InstalledTab plugins={installedPlugins} selectedIndex={0} searchQuery="" focusZone="list" />
 */
export default function InstalledTab({
  plugins,
  selectedIndex,
  searchQuery = '',
  focusZone = 'list',
}: InstalledTabProps) {
  // Plugins are already filtered by parent, use directly
  const selectedPlugin = plugins[selectedIndex] ?? null

  // Count enabled/disabled
  const enabledCount = plugins.filter((p) => p.isEnabled).length
  const disabledCount = plugins.length - enabledCount

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with stats */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Installed plugins (
          {plugins.length > 0 ? `${selectedIndex + 1}/${plugins.length}` : '0'})
        </Text>
        <Box flexGrow={1} />
        <Box gap={2}>
          <Text color="green">● {enabledCount} enabled</Text>
          <Text color="yellow">◐ {disabledCount} disabled</Text>
        </Box>
      </Box>

      {/* Search bar */}
      <Box marginBottom={1}>
        <SearchInput
          query={searchQuery}
          isActive={focusZone === 'search'}
          placeholder="Type to search installed plugins..."
        />
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column">
          {plugins.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">
                {searchQuery ? 'No matching plugins' : 'No plugins installed'}
              </Text>
              <Text dimColor>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Use the Discover tab or /plugin install in Claude Code'}
              </Text>
            </Box>
          ) : (
            <PluginList
              plugins={plugins}
              selectedIndex={selectedIndex}
              visibleCount={12}
              isFocused={focusZone === 'list'}
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
