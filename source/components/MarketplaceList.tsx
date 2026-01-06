/**
 * MarketplaceList component
 * List of marketplace sources
 */

import { Box, Text } from 'ink'
import type { Marketplace } from '../types/index.js'

interface MarketplaceListProps {
  marketplaces: Marketplace[]
  selectedIndex: number
  /** Whether the list has keyboard focus */
  isFocused?: boolean
}

/**
 * Displays a list of marketplaces
 * @example
 * <MarketplaceList marketplaces={marketplaces} selectedIndex={0} isFocused={true} />
 */
export default function MarketplaceList({
  marketplaces,
  selectedIndex,
  isFocused = true,
}: MarketplaceListProps) {
  if (marketplaces.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No marketplaces found</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {marketplaces.map((marketplace, index) => {
        const isSelected = index === selectedIndex

        return (
          <Box key={marketplace.id} paddingX={1}>
            <Box width={2}>
              {isSelected && isFocused ? (
                <Text color="cyan">{'>'}</Text>
              ) : isSelected ? (
                <Text color="gray">{'›'}</Text>
              ) : (
                <Text> </Text>
              )}
            </Box>
            <Box flexGrow={1} flexDirection="column">
              <Box gap={1}>
                <Text
                  bold
                  color={
                    isSelected && isFocused
                      ? 'cyan'
                      : isSelected
                        ? 'gray'
                        : 'white'
                  }
                >
                  {marketplace.name || marketplace.id}
                </Text>
                <Text dimColor>·</Text>
                <Text color="gray">{marketplace.pluginCount || 0} plugins</Text>
              </Box>
              <Text dimColor wrap="truncate">
                {getSourceDisplay(marketplace)}
              </Text>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

/**
 * Get display string for marketplace source
 */
function getSourceDisplay(marketplace: Marketplace): string {
  if (marketplace.source.url) {
    return marketplace.source.url
  }
  if (marketplace.source.repo) {
    return `github.com/${marketplace.source.repo}`
  }
  return marketplace.source.source
}
