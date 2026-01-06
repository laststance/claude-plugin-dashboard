/**
 * AddMarketplaceDialog component
 * Dialog for adding a new marketplace source
 */

import { Box, Text } from 'ink'

export interface AddMarketplaceDialogProps {
  /** Current input value */
  value: string
  /** Error message to display (if any) */
  error?: string
}

/**
 * Dialog for adding a new marketplace
 * Displays input field with format hints
 * @param value - Current input value (controlled by parent)
 * @param error - Error message to display
 * @returns Dialog component
 * @example
 * <AddMarketplaceDialog value={inputValue} />
 */
export default function AddMarketplaceDialog({
  value,
  error,
}: AddMarketplaceDialogProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginTop={1}
    >
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Add Marketplace
        </Text>
      </Box>

      {/* Input label */}
      <Text>Enter marketplace source:</Text>

      {/* Input field */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1} marginY={1}>
        {value ? <Text>{value}</Text> : <Text dimColor>owner/repo</Text>}
        <Text color="cyan">▌</Text>
      </Box>

      {/* Error message */}
      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {/* Format hints */}
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Supported formats:</Text>
        <Text dimColor> • owner/repo (GitHub)</Text>
        <Text dimColor> • https://github.com/org/repo</Text>
        <Text dimColor> • ./local-path</Text>
      </Box>

      {/* Action buttons hint */}
      <Box gap={2}>
        <Text>
          <Text dimColor>[</Text>
          <Text color="red">ESC</Text>
          <Text dimColor>] Cancel</Text>
        </Text>
        <Text>
          <Text dimColor>[</Text>
          <Text color="green">Enter</Text>
          <Text dimColor>] Add</Text>
        </Text>
      </Box>
    </Box>
  )
}
