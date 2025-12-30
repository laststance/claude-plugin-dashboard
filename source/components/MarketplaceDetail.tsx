/**
 * MarketplaceDetail component
 * Right panel showing marketplace information
 */

import { Box, Text } from 'ink'
import type { Marketplace } from '../types/index.js'

interface MarketplaceDetailProps {
  marketplace: Marketplace | null
}

/**
 * Displays detailed information about a selected marketplace
 * @example
 * <MarketplaceDetail marketplace={selectedMarketplace} />
 */
export default function MarketplaceDetail({
  marketplace,
}: MarketplaceDetailProps) {
  if (!marketplace) {
    return (
      <Box
        flexDirection="column"
        padding={1}
        borderStyle="round"
        borderColor="gray"
      >
        <Text dimColor>Select a marketplace to view details</Text>
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
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {marketplace.name || marketplace.id}
        </Text>
      </Box>

      {/* Metadata */}
      <Box flexDirection="column" gap={0}>
        <DetailRow label="ID" value={marketplace.id} />
        <DetailRow label="Plugins" value={`${marketplace.pluginCount || 0}`} />
        <DetailRow label="Source" value={marketplace.source.source} />
        {marketplace.source.url && (
          <DetailRow label="URL" value={marketplace.source.url} />
        )}
        {marketplace.source.repo && (
          <DetailRow label="Repo" value={marketplace.source.repo} />
        )}
        <DetailRow
          label="Last Updated"
          value={formatDate(marketplace.lastUpdated)}
        />
      </Box>

      {/* Install location */}
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Install Location:</Text>
        <Text dimColor wrap="truncate-end">
          {marketplace.installLocation}
        </Text>
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
