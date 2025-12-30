/**
 * ConfirmDialog component
 * Displays a Y/N confirmation prompt for destructive actions
 */

import { Box, Text } from 'ink'

interface ConfirmDialogProps {
  message: string
}

/**
 * A simple confirmation dialog that prompts Y/N
 * @example
 * <ConfirmDialog message="Uninstall plugin-name@marketplace?" />
 */
export default function ConfirmDialog({ message }: ConfirmDialogProps) {
  return (
    <Box
      marginTop={1}
      paddingX={2}
      paddingY={1}
      borderStyle="double"
      borderColor="yellow"
    >
      <Text>{message} </Text>
      <Text bold color="green">
        Y
      </Text>
      <Text dimColor>/</Text>
      <Text bold color="red">
        N
      </Text>
    </Box>
  )
}
