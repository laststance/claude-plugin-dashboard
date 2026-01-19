/**
 * PluginList component
 * Scrollable list of plugins with selection highlighting
 * Supports ↑ ↓ arrow key navigation
 */

import { Box, Text } from 'ink'
import StatusIcon from './StatusIcon.js'
import type { Plugin } from '../types/index.js'

interface PluginListProps {
  plugins: Plugin[]
  selectedIndex: number
  /** Maximum visible items (for virtual scrolling) */
  visibleCount?: number
  /** Whether the list has keyboard focus */
  isFocused?: boolean
}

/**
 * Scrollable plugin list with selection
 * @example
 * <PluginList plugins={plugins} selectedIndex={0} visibleCount={15} isFocused={true} />
 */
export default function PluginList({
  plugins,
  selectedIndex,
  visibleCount = 15,
  isFocused = true,
}: PluginListProps) {
  if (plugins.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No plugins found</Text>
      </Box>
    )
  }

  // Calculate visible window
  const halfVisible = Math.floor(visibleCount / 2)
  let startIndex = Math.max(0, selectedIndex - halfVisible)
  const endIndex = Math.min(plugins.length, startIndex + visibleCount)

  // Adjust start if we're near the end
  if (endIndex - startIndex < visibleCount) {
    startIndex = Math.max(0, endIndex - visibleCount)
  }

  const visiblePlugins = plugins.slice(startIndex, endIndex)
  const hasMore = endIndex < plugins.length
  const hasPrevious = startIndex > 0

  // Calculate fixed height: each item is 2 lines + 1 line for top indicator + 1 line for bottom indicator
  // Total fixed lines: visibleCount * 2 (items) + 2 (indicators)
  const totalLines = visibleCount * 2 + 2
  // Lines used by items
  const itemLines = visiblePlugins.length * 2
  // Lines used by indicators (always rendered, but may be empty)
  const topIndicatorLine = 1
  const bottomIndicatorLine = 1
  // Calculate padding lines needed to maintain fixed height
  const usedLines = itemLines + topIndicatorLine + bottomIndicatorLine
  const paddingLines = Math.max(0, totalLines - usedLines)

  return (
    <Box flexDirection="column" height={totalLines}>
      {/* Scroll indicator (top) - always takes 1 line */}
      <Text dimColor>{hasPrevious ? `↑ ${startIndex} more above` : ' '}</Text>

      {/* Plugin items */}
      {visiblePlugins.map((plugin, index) => {
        const actualIndex = startIndex + index
        const isSelected = actualIndex === selectedIndex

        return (
          <Box key={plugin.id} paddingX={1} height={2}>
            <Box width={2}>
              {isSelected && isFocused ? (
                <Text color="cyan">{'>'}</Text>
              ) : isSelected ? (
                <Text color="gray">{'›'}</Text>
              ) : (
                <Text> </Text>
              )}
            </Box>
            <Box width={2}>
              <StatusIcon
                isInstalled={plugin.isInstalled}
                isEnabled={plugin.isEnabled}
              />
            </Box>
            <Box flexDirection="column" overflow="hidden">
              <Box height={1}>
                <Text wrap="truncate">
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
                    {plugin.name}
                  </Text>
                  <Text dimColor> · </Text>
                  <Text color="gray">{truncate(plugin.marketplace, 20)}</Text>
                  {plugin.installCount > 0 && (
                    <>
                      <Text dimColor> · </Text>
                      <Text color="gray">
                        {formatCount(plugin.installCount)} installs
                      </Text>
                    </>
                  )}
                </Text>
              </Box>
              <Box height={1}>
                <Text dimColor wrap="truncate">
                  {truncate(plugin.description, 60)}
                </Text>
              </Box>
            </Box>
          </Box>
        )
      })}

      {/* Padding to maintain fixed height */}
      {paddingLines > 0 &&
        Array.from({ length: paddingLines }).map((_, i) => (
          <Text key={`pad-${i}`}> </Text>
        ))}

      {/* Scroll indicator (bottom) - always takes 1 line */}
      <Text dimColor>
        {hasMore ? `↓ ${plugins.length - endIndex} more below` : ' '}
      </Text>
    </Box>
  )
}

/**
 * Truncate text to max length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns
 * - Original text if within maxLength
 * - Truncated text with "..." suffix if exceeds maxLength
 * @example
 * truncate('Hello', 10)        // => 'Hello'
 * truncate('Hello World', 8)   // => 'Hello...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format large numbers with K/M suffix
 * @param count - The number to format
 * @returns
 * - "X.XM" for millions (>= 1,000,000)
 * - "X.XK" for thousands (>= 1,000)
 * - String representation for smaller numbers
 * @example
 * formatCount(1500)     // => '1.5K'
 * formatCount(1200000)  // => '1.2M'
 * formatCount(500)      // => '500'
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
