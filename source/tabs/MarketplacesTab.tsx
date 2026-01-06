/**
 * MarketplacesTab component
 * View and manage marketplace sources
 */

import { Box, Text } from 'ink'
import MarketplaceList from '../components/MarketplaceList.js'
import MarketplaceDetail from '../components/MarketplaceDetail.js'
import SearchInput from '../components/SearchInput.js'
import type { Marketplace, FocusZone } from '../types/index.js'

interface MarketplacesTabProps {
  marketplaces: Marketplace[]
  selectedIndex: number
  searchQuery?: string
  /** Current focus zone for keyboard navigation */
  focusZone?: FocusZone
}

/**
 * Marketplaces tab - manage plugin sources
 * @param marketplaces - Filtered marketplaces (search already applied by parent)
 * @param selectedIndex - Currently selected item index
 * @param searchQuery - Current search query string
 * @param focusZone - Current focus zone for keyboard navigation
 * @example
 * <MarketplacesTab marketplaces={marketplaces} selectedIndex={0} searchQuery="" focusZone="list" />
 */
export default function MarketplacesTab({
  marketplaces,
  selectedIndex,
  searchQuery = '',
  focusZone = 'list',
}: MarketplacesTabProps) {
  const selectedMarketplace = marketplaces[selectedIndex] ?? null

  // Count total plugins across all marketplaces
  const totalPlugins = marketplaces.reduce(
    (sum, m) => sum + (m.pluginCount || 0),
    0,
  )

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with stats */}
      <Box marginBottom={1} gap={2}>
        <Text bold>
          Marketplaces (
          {marketplaces.length > 0
            ? `${selectedIndex + 1}/${marketplaces.length}`
            : '0'}
          )
        </Text>
        <Box flexGrow={1} />
        <Text color="gray">{totalPlugins} total plugins</Text>
      </Box>

      {/* Search bar */}
      <Box marginBottom={1}>
        <SearchInput
          query={searchQuery}
          isActive={focusZone === 'search'}
          placeholder="Type to search marketplaces..."
        />
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Marketplace list */}
        <Box width="50%" flexDirection="column">
          {marketplaces.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">
                {searchQuery
                  ? 'No matching marketplaces'
                  : 'No marketplaces found'}
              </Text>
              <Text dimColor>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add marketplaces with /plugin add-marketplace'}
              </Text>
            </Box>
          ) : (
            <MarketplaceList
              marketplaces={marketplaces}
              selectedIndex={selectedIndex}
              isFocused={focusZone === 'list'}
            />
          )}
        </Box>

        {/* Right panel: Marketplace detail */}
        <Box width="50%" flexDirection="column">
          <MarketplaceDetail marketplace={selectedMarketplace} />
        </Box>
      </Box>
    </Box>
  )
}
