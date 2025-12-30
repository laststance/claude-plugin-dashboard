/**
 * PluginDetail component
 * Right panel showing detailed plugin information
 */

import { Box, Text } from 'ink'
import StatusIcon from './StatusIcon.js'
import type { Plugin } from '../types/index.js'

interface PluginDetailProps {
  plugin: Plugin | null
}

/**
 * Displays detailed information about a selected plugin
 * @example
 * <PluginDetail plugin={selectedPlugin} />
 */
export default function PluginDetail({ plugin }: PluginDetailProps) {
  if (!plugin) {
    return (
      <Box
        flexDirection="column"
        padding={1}
        borderStyle="round"
        borderColor="gray"
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

      {/* Metadata */}
      <Box flexDirection="column" gap={0}>
        <DetailRow label="Marketplace" value={plugin.marketplace} />
        <DetailRow label="Version" value={plugin.version} />
        <DetailRow label="Installs" value={formatCount(plugin.installCount)} />
        {plugin.category && (
          <DetailRow label="Category" value={plugin.category} />
        )}
        {plugin.author && (
          <DetailRow label="Author" value={plugin.author.name} />
        )}
        {plugin.homepage && (
          <DetailRow label="Homepage" value={plugin.homepage} />
        )}
      </Box>

      {/* Status */}
      <Box marginTop={1} flexDirection="column">
        <Box gap={1}>
          <Text>Status:</Text>
          {plugin.isInstalled ? (
            plugin.isEnabled ? (
              <Text color="green" bold>
                Installed & Enabled
              </Text>
            ) : (
              <Text color="yellow" bold>
                Installed & Disabled
              </Text>
            )
          ) : (
            <Text color="gray">Not Installed</Text>
          )}
        </Box>

        {plugin.installedAt && (
          <Text dimColor>Installed: {formatDate(plugin.installedAt)}</Text>
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
        {plugin.isInstalled ? (
          <Box flexDirection="column">
            <Text dimColor>
              <Text bold color="white">
                Space
              </Text>{' '}
              {plugin.isEnabled ? 'disable' : 'enable'} |{' '}
              <Text bold color="white">
                u
              </Text>{' '}
              uninstall
            </Text>
          </Box>
        ) : (
          <Text dimColor>
            <Text bold color="white">
              i
            </Text>{' '}
            install
          </Text>
        )}
      </Box>
    </Box>
  )
}

/**
 * Single detail row with label and value
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box gap={1}>
      <Text color="gray">{label}:</Text>
      <Text>{value}</Text>
    </Box>
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
