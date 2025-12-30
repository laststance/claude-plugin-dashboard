/**
 * ErrorsTab component
 * Display plugin-related errors and issues
 */

import { Box, Text } from 'ink'
import type { PluginError } from '../types/index.js'

interface ErrorsTabProps {
  errors: PluginError[]
  selectedIndex: number
}

/**
 * Errors tab - display plugin errors
 * @example
 * <ErrorsTab errors={errors} selectedIndex={0} />
 */
export default function ErrorsTab({ errors, selectedIndex }: ErrorsTabProps) {
  if (errors.length === 0) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        {/* Header */}
        <Box marginBottom={1}>
          <Text bold>Errors (0)</Text>
        </Box>

        {/* No errors state */}
        <Box
          flexDirection="column"
          padding={2}
          borderStyle="round"
          borderColor="green"
        >
          <Box gap={1}>
            <Text color="green">✓</Text>
            <Text bold color="green">
              No errors to display
            </Text>
          </Box>
          <Text dimColor>All plugins are working correctly</Text>
        </Box>
      </Box>
    )
  }

  const selectedError = errors[selectedIndex] ?? null

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text bold color="red">
          Errors (
          {errors.length > 0 ? `${selectedIndex + 1}/${errors.length}` : '0'})
        </Text>
      </Box>

      {/* Two-column layout */}
      <Box flexGrow={1}>
        {/* Left panel: Error list */}
        <Box width="50%" flexDirection="column">
          {errors.map((error, index) => {
            const isSelected = index === selectedIndex

            return (
              <Box key={`${error.pluginId}-${index}`} paddingX={1}>
                <Box width={2}>
                  {isSelected ? (
                    <Text color="cyan">{'>'}</Text>
                  ) : (
                    <Text> </Text>
                  )}
                </Box>
                <Box width={2}>
                  <Text color="red">✗</Text>
                </Box>
                <Box flexGrow={1} flexDirection="column">
                  <Text bold color={isSelected ? 'cyan' : 'white'}>
                    {error.pluginId}
                  </Text>
                  <Text dimColor wrap="truncate">
                    {error.message}
                  </Text>
                </Box>
              </Box>
            )
          })}
        </Box>

        {/* Right panel: Error detail */}
        <Box width="50%" flexDirection="column">
          {selectedError ? (
            <Box
              flexDirection="column"
              padding={1}
              borderStyle="round"
              borderColor="red"
            >
              <Box marginBottom={1}>
                <Text bold color="red">
                  {selectedError.pluginId}
                </Text>
              </Box>

              <Box flexDirection="column" gap={0}>
                <Box gap={1}>
                  <Text color="gray">Type:</Text>
                  <Text>{selectedError.type}</Text>
                </Box>
                <Box gap={1}>
                  <Text color="gray">Time:</Text>
                  <Text>{formatDate(selectedError.timestamp)}</Text>
                </Box>
              </Box>

              <Box marginTop={1} flexDirection="column">
                <Text color="gray">Message:</Text>
                <Text wrap="wrap">{selectedError.message}</Text>
              </Box>

              {selectedError.details && (
                <Box marginTop={1} flexDirection="column">
                  <Text color="gray">Details:</Text>
                  <Text dimColor wrap="wrap">
                    {selectedError.details}
                  </Text>
                </Box>
              )}
            </Box>
          ) : (
            <Box
              flexDirection="column"
              padding={1}
              borderStyle="round"
              borderColor="gray"
            >
              <Text dimColor>Select an error to view details</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}
