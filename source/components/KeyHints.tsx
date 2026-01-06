/**
 * KeyHints component
 * Displays keyboard shortcuts footer at the bottom of the dashboard
 */

import { Box, Text } from 'ink'
import type { FocusZone } from '../types/index.js'

interface KeyHintsProps {
  /** Additional context-specific hints */
  extraHints?: Array<{ key: string; action: string }>
  /** Current focus zone for context-aware hints */
  focusZone?: FocusZone
}

/**
 * Get base hints based on current focus zone
 * @param focusZone - Current focus zone
 * @returns Array of hint objects
 */
function getBaseHints(
  focusZone: FocusZone,
): Array<{ key: string; action: string }> {
  switch (focusZone) {
    case 'tabbar':
      return [
        { key: '←/→', action: 'switch tabs' },
        { key: '↓', action: 'search/list' },
        { key: 'Tab', action: 'next tab' },
        { key: 'h', action: 'help' },
        { key: 'q or ^C', action: 'quit' },
      ]
    case 'search':
      return [
        { key: '↑', action: 'tabs' },
        { key: '↓/Enter', action: 'list' },
        { key: 'ESC', action: 'clear/exit' },
        { key: 'h', action: 'help' },
        { key: 'q or ^C', action: 'quit' },
      ]
    case 'list':
    default:
      return [
        { key: '↑/↓', action: 'navigate' },
        { key: '↑(top)', action: 'search' },
        { key: 'Space', action: 'toggle' },
        { key: 'Tab', action: 'next tab' },
        { key: 'h', action: 'help' },
        { key: 'q or ^C', action: 'quit' },
      ]
  }
}

/**
 * Displays keyboard shortcut hints in the footer
 * @example
 * <KeyHints focusZone="list" />
 * <KeyHints focusZone="search" extraHints={[{ key: 'i', action: 'install' }]} />
 */
export default function KeyHints({
  extraHints,
  focusZone = 'list',
}: KeyHintsProps) {
  const baseHints = getBaseHints(focusZone)
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
