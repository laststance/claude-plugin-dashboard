/**
 * DiscoverTab component
 * Browse all available plugins from all marketplaces
 */

import { Box, Text } from 'ink'
import PluginList from '../components/PluginList.js'
import PluginDetail from '../components/PluginDetail.js'
import SearchInput from '../components/SearchInput.js'
import SortDropdown from '../components/SortDropdown.js'
import type {
  Plugin,
  AppState,
  FocusZone,
  ComponentDetailedInfo,
} from '../types/index.js'

interface DiscoverTabProps {
  plugins: Plugin[]
  selectedIndex: number
  searchQuery: string
  sortBy: AppState['sortBy']
  sortOrder: AppState['sortOrder']
  /** Current focus zone for keyboard navigation */
  focusZone?: FocusZone
  /** Whether component focus mode is active */
  componentFocusMode?: boolean
  /** Currently selected component index */
  selectedComponentIndex?: number
  /** Selected component's detailed info */
  selectedComponentDetail?: ComponentDetailedInfo | null
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
 *   focusZone="list"
 * />
 */
export default function DiscoverTab({
  plugins,
  selectedIndex,
  searchQuery,
  sortBy,
  sortOrder,
  focusZone = 'list',
  componentFocusMode = false,
  selectedComponentIndex = 0,
  selectedComponentDetail = null,
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
          isActive={focusZone === 'search'}
          placeholder="Type to search..."
        />
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1} overflow="hidden">
        {/* Left panel: Plugin list */}
        <Box width="50%" flexDirection="column" overflow="hidden">
          <PluginList
            plugins={plugins}
            selectedIndex={selectedIndex}
            visibleCount={12}
            isFocused={focusZone === 'list'}
          />
        </Box>

        {/* Right panel: Plugin detail */}
        <Box width="50%" flexDirection="column" overflow="hidden">
          <PluginDetail
            key={selectedPlugin?.id ?? 'none'}
            plugin={selectedPlugin}
            componentFocusMode={componentFocusMode}
            selectedComponentIndex={selectedComponentIndex}
            selectedComponentDetail={selectedComponentDetail}
          />
        </Box>
      </Box>
    </Box>
  )
}
