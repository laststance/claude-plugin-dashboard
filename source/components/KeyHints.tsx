/**
 * KeyHints component
 * Displays keyboard shortcuts footer at the bottom of the dashboard
 */

import { Box, Text } from 'ink'

interface KeyHintsProps {
  /** Additional context-specific hints */
  extraHints?: Array<{ key: string; action: string }>
}

/**
 * Displays keyboard shortcut hints in the footer
 * @example
 * <KeyHints />
 * <KeyHints extraHints={[{ key: 'i', action: 'install' }]} />
 */
export default function KeyHints({ extraHints }: KeyHintsProps) {
  const baseHints = [
    { key: '←/→', action: 'tabs' },
    { key: '↑/↓', action: 'navigate' },
    { key: 'Space', action: 'toggle' },
    { key: '/', action: 'search' },
    { key: 'q', action: 'quit' },
  ]

  const allHints = extraHints ? [...baseHints, ...extraHints] : baseHints

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
      <Box gap={2} flexWrap="wrap">
        {allHints.map((hint, index) => (
          <Box key={index} gap={1}>
            <Text bold color="white">
              {hint.key}
            </Text>
            <Text dimColor>{hint.action}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
