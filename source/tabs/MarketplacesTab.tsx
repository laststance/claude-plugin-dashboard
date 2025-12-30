/**
 * MarketplacesTab component
 * View and manage marketplace sources
 */

import { Box, Text } from 'ink'
import MarketplaceList from '../components/MarketplaceList.js'
import MarketplaceDetail from '../components/MarketplaceDetail.js'
import type { Marketplace } from '../types/index.js'

interface MarketplacesTabProps {
  marketplaces: Marketplace[]
  selectedIndex: number
}

/**
 * Marketplaces tab - manage plugin sources
 * @example
 * <MarketplacesTab marketplaces={marketplaces} selectedIndex={0} />
 */
export default function MarketplacesTab({
  marketplaces,
  selectedIndex,
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

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Marketplace list */}
        <Box width="50%" flexDirection="column">
          {marketplaces.length === 0 ? (
            <Box padding={1} flexDirection="column">
              <Text color="gray">No marketplaces found</Text>
              <Text dimColor>
                Add marketplaces with{' '}
                <Text color="white">/plugin add-marketplace</Text>
              </Text>
            </Box>
          ) : (
            <MarketplaceList
              marketplaces={marketplaces}
              selectedIndex={selectedIndex}
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
