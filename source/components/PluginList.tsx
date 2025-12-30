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
}

/**
 * Scrollable plugin list with selection
 * @example
 * <PluginList plugins={plugins} selectedIndex={0} visibleCount={15} />
 */
export default function PluginList({
  plugins,
  selectedIndex,
  visibleCount = 15,
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

  return (
    <Box flexDirection="column">
      {/* Scroll indicator (top) */}
      {hasPrevious && <Text dimColor>↑ {startIndex} more above</Text>}

      {/* Plugin items */}
      {visiblePlugins.map((plugin, index) => {
        const actualIndex = startIndex + index
        const isSelected = actualIndex === selectedIndex

        return (
          <Box key={plugin.id} paddingX={1}>
            <Box width={2}>
              {isSelected ? <Text color="cyan">{'>'}</Text> : <Text> </Text>}
            </Box>
            <Box width={2}>
              <StatusIcon
                isInstalled={plugin.isInstalled}
                isEnabled={plugin.isEnabled}
              />
            </Box>
            <Box flexGrow={1} flexDirection="column">
              <Box gap={1}>
                <Text bold color={isSelected ? 'cyan' : 'white'}>
                  {plugin.name}
                </Text>
                <Text dimColor>·</Text>
                <Text color="gray">{truncate(plugin.marketplace, 20)}</Text>
                {plugin.installCount > 0 && (
                  <>
                    <Text dimColor>·</Text>
                    <Text color="gray">
                      {formatCount(plugin.installCount)} installs
                    </Text>
                  </>
                )}
              </Box>
              <Text dimColor wrap="truncate">
                {truncate(plugin.description, 60)}
              </Text>
            </Box>
          </Box>
        )
      })}

      {/* Scroll indicator (bottom) */}
      {hasMore && (
        <Text dimColor>↓ {plugins.length - endIndex} more below</Text>
      )}
    </Box>
  )
}

/**
 * Truncate text to max length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format large numbers with K/M suffix
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
