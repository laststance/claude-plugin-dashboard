/**
 * PluginDetail component
 * Right panel showing detailed plugin information
 *
 * Uses fixed height to prevent layout jumping when switching between plugins
 * with different amounts of content (e.g., varying component counts).
 *
 * Supports component focus mode for navigating and viewing component details
 */

import { Box, Text } from 'ink'
import StatusIcon from './StatusIcon.js'
import ComponentBadges from './ComponentBadges.js'
import ComponentList, {
  hasAnyCountComponents,
  hasAnyDetailedComponents,
} from './ComponentList.js'
import ComponentDetail from './ComponentDetail.js'
import type { ComponentDetailedInfo, Plugin } from '../types/index.js'

/**
 * Fixed height for PluginDetail panel (in terminal lines)
 * Matches PluginList's visibleCount * 2 + 2 = 26 lines
 * This ensures both panels have consistent height regardless of content
 */
const DETAIL_PANEL_HEIGHT = 26

interface PluginDetailProps {
  plugin: Plugin | null
  /** Whether component focus mode is active */
  componentFocusMode?: boolean
  /** Currently selected component index */
  selectedComponentIndex?: number
  /** Selected component's detailed info (fetched from service) */
  selectedComponentDetail?: ComponentDetailedInfo | null
}

/**
 * Displays detailed information about a selected plugin
 * Supports component focus mode for drilling into component details
 * @example
 * <PluginDetail
 *   plugin={selectedPlugin}
 *   componentFocusMode={true}
 *   selectedComponentIndex={0}
 * />
 */
export default function PluginDetail({
  plugin,
  componentFocusMode = false,
  selectedComponentIndex = 0,
  selectedComponentDetail = null,
}: PluginDetailProps) {
  if (!plugin) {
    return (
      <Box
        flexDirection="column"
        padding={1}
        borderStyle="round"
        borderColor="gray"
        height={DETAIL_PANEL_HEIGHT}
      >
        <Text dimColor>Select a plugin to view details</Text>
      </Box>
    )
  }

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="cyan"
      height={DETAIL_PANEL_HEIGHT}
      overflow="hidden"
    >
      {/* Header */}
      <Box marginBottom={1} gap={1}>
        <StatusIcon
          isInstalled={plugin.isInstalled}
          isEnabled={plugin.isEnabled}
        />
        <Text bold color="cyan">
          {plugin.name}
        </Text>
      </Box>

      {/* Description */}
      <Box marginBottom={1}>
        <Text wrap="wrap">
          {plugin.description || 'No description available'}
        </Text>
      </Box>

      {/* Metadata - ALWAYS render all rows unconditionally to prevent ghost text */}
      <Box flexDirection="column" gap={0}>
        <DetailRow label="Marketplace" value={plugin.marketplace} />
        <DetailRow label="Version" value={plugin.version || '-'} />
        <DetailRow label="Installs" value={formatCount(plugin.installCount)} />
        <DetailRow label="Category" value={plugin.category || '-'} />
        <DetailRow label="Author" value={plugin.author?.name || '-'} />
        <DetailRow label="Homepage" value={plugin.homepage || '-'} />
        <Box gap={1}>
          <Text color="gray">{'Components:'.padEnd(12)}</Text>
          {plugin.components ? (
            <ComponentBadges components={plugin.components} />
          ) : (
            <Text color="gray">-</Text>
          )}
        </Box>
      </Box>

      {/* Component List Section */}
      {((plugin.components && hasAnyCountComponents(plugin.components)) ||
        (plugin.componentsDetailed &&
          hasAnyDetailedComponents(plugin.componentsDetailed))) && (
        <>
          <Box marginY={1}>
            <Text dimColor>{'─'.repeat(36)}</Text>
          </Box>
          <ComponentList
            components={plugin.components}
            componentsDetailed={plugin.componentsDetailed}
            maxItems={componentFocusMode ? 99 : 3}
            isFocused={componentFocusMode}
            selectedIndex={selectedComponentIndex}
          />
        </>
      )}

      {/* Component Detail Panel (shown when component is selected) */}
      {componentFocusMode && selectedComponentDetail && (
        <>
          <Box marginY={1}>
            <Text dimColor>{'─'.repeat(36)}</Text>
          </Box>
          <ComponentDetail component={selectedComponentDetail} maxHeight={8} />
        </>
      )}

      {/* Status */}
      <Box marginTop={1} flexDirection="column">
        <Box gap={1}>
          <Text>Status:</Text>
          {plugin.isInstalled ? (
            plugin.isEnabled ? (
              <Text color="green" bold wrap="truncate">
                Enabled
              </Text>
            ) : (
              <Text color="yellow" bold wrap="truncate">
                Disabled
              </Text>
            )
          ) : (
            <Text color="gray" wrap="truncate">
              Not Installed
            </Text>
          )}
        </Box>

        {plugin.installedAt && (
          <Text dimColor wrap="truncate">
            Installed: {formatDate(plugin.installedAt)}
          </Text>
        )}
      </Box>

      {/* Actions hint */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        flexDirection="column"
      >
        {componentFocusMode ? (
          <Text dimColor>
            <Text bold color="white">
              ↑↓
            </Text>{' '}
            navigate |{' '}
            <Text bold color="white">
              ←
            </Text>{' '}
            back to plugin
          </Text>
        ) : plugin.isInstalled ? (
          <Box flexDirection="column">
            <Text dimColor>
              <Text bold color="white">
                Space
              </Text>{' '}
              {plugin.isEnabled ? 'disable' : 'enable'} |{' '}
              <Text bold color="white">
                u
              </Text>{' '}
              uninstall |{' '}
              <Text bold color="white">
                →
              </Text>{' '}
              components
            </Text>
          </Box>
        ) : (
          <Text dimColor>
            <Text bold color="white">
              i
            </Text>{' '}
            install |{' '}
            <Text bold color="white">
              →
            </Text>{' '}
            components
          </Text>
        )}
      </Box>
    </Box>
  )
}

/**
 * Single detail row with label and value
 * Pads both label and value to fixed widths to prevent ghost text artifacts
 * when content changes between selections
 * @param label - Label text (e.g., "Marketplace", "Version")
 * @param value - Value to display
 * @returns Detail row with fixed-width padding to overwrite previous content
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  // Fixed widths to ensure consistent line length and prevent ghost text
  const LABEL_WIDTH = 12
  const VALUE_WIDTH = 40

  const paddedLabel = `${label}:`.padEnd(LABEL_WIDTH)
  // Truncate long values, pad short values with spaces to overwrite old content
  const truncatedValue =
    value.length > VALUE_WIDTH ? value.slice(0, VALUE_WIDTH - 1) + '…' : value
  const paddedValue = truncatedValue.padEnd(VALUE_WIDTH)

  return (
    <Text>
      <Text color="gray">{paddedLabel}</Text>
      <Text>{paddedValue}</Text>
    </Text>
  )
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

/**
 * Format ISO date string to readable format
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoString
  }
}
