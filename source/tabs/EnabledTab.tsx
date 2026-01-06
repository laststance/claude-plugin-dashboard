/**
 * EnabledTab component
 * View and manage enabled plugins (installed + enabled)
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import SearchInput from '../components/SearchInput.js'
import type { Plugin, FocusZone } from '../types/index.js'

interface EnabledTabProps {
  plugins: Plugin[]
  selectedIndex: number
  searchQuery?: string
  /** Current focus zone for keyboard navigation */
  focusZone?: FocusZone
}

/**
 * Enabled tab - view currently active plugins
 * @param plugins - Filtered enabled plugins (search already applied by parent)
 * @param selectedIndex - Currently selected item index
 * @param searchQuery - Current search query string
 * @param focusZone - Current focus zone for keyboard navigation
 * @returns Enabled tab component
 * @example
 * <EnabledTab plugins={enabledPlugins} selectedIndex={0} searchQuery="" focusZone="list" />
 */
export default function EnabledTab({
  plugins,
  selectedIndex,
  searchQuery = '',
  focusZone = 'list',
}: EnabledTabProps) {
  // Plugins are already filtered by parent, use directly
  const selectedPlugin = plugins[selectedIndex] ?? null

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with count */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Enabled plugins (
          {plugins.length > 0 ? `${selectedIndex + 1}/${plugins.length}` : '0'})
        </Text>
        <Box flexGrow={1} />
        <Text dimColor>Currently active in Claude Code</Text>
      </Box>

      {/* Search bar */}
      <Box marginBottom={1}>
        <SearchInput
          query={searchQuery}
          isActive={focusZone === 'search'}
          placeholder="Type to search enabled plugins..."
        />
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column">
          {plugins.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">
                {searchQuery ? 'No matching plugins' : 'No enabled plugins'}
              </Text>
              <Text dimColor>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Enable plugins in the Installed tab or use /plugin enable'}
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
