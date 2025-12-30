/**
 * DiscoverTab component
 * Browse all available plugins from all marketplaces
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import SearchInput from '../components/SearchInput.js'
import SortDropdown from '../components/SortDropdown.js'
import type { Plugin, AppState } from '../types/index.js'

interface DiscoverTabProps {
  plugins: Plugin[]
  selectedIndex: number
  searchQuery: string
  sortBy: AppState['sortBy']
  sortOrder: AppState['sortOrder']
  isSearchMode?: boolean
}

/**
 * Discover tab - browse all plugins
 * @example
 * <DiscoverTab
 *   plugins={filteredPlugins}
 *   selectedIndex={state.selectedIndex}
 *   searchQuery={state.searchQuery}
 *   sortBy={state.sortBy}
 *   sortOrder={state.sortOrder}
 * />
 */
export default function DiscoverTab({
  plugins,
  selectedIndex,
  searchQuery,
  sortBy,
  sortOrder,
  isSearchMode = false,
}: DiscoverTabProps) {
  const selectedPlugin = plugins[selectedIndex] ?? null

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with search and sort */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Discover plugins (
          {plugins.length > 0 ? `${selectedIndex + 1}/${plugins.length}` : '0'})
        </Text>
        <Box flexGrow={1} />
        <SortDropdown sortBy={sortBy} sortOrder={sortOrder} />
      </Box>

      {/* Search bar */}
      <Box marginBottom={1}>
        <SearchInput
          query={searchQuery}
          isActive={isSearchMode}
          placeholder="Type to search..."
        />
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column">
          <PluginList
            plugins={plugins}
            selectedIndex={selectedIndex}
            visibleCount={12}
          />
        </Box>

        {/* Right panel: Plugin detail */}
        <Box width="50%" flexDirection="column">
          <PluginDetail plugin={selectedPlugin} />
        </Box>
      </Box>
    </Box>
  )
}
