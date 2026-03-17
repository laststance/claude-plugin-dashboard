/**
 * KeyHints component
 * Displays keyboard shortcuts footer at the bottom of the dashboard
 */

import { Box, Text } from 'ink'
import { match } from 'ts-pattern'
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
  return match(focusZone)
    .with('tabbar', () => [
      { key: '←/→', action: 'switch tabs' },
      { key: '↓', action: 'search/list' },
      { key: 'Tab', action: 'next tab' },
      { key: 'h', action: 'help' },
      { key: 'q or ^C', action: 'quit' },
    ])
    .with('search', () => [
      { key: '↑', action: 'tabs' },
      { key: '↓/Enter', action: 'list' },
      { key: 'ESC', action: 'clear/exit' },
      { key: 'h', action: 'help' },
      { key: 'q or ^C', action: 'quit' },
    ])
    .with('list', () => [
      { key: '↑/↓', action: 'navigate' },
      { key: '↑(top)', action: 'search' },
      { key: 'Space', action: 'toggle' },
      { key: 'Tab', action: 'next tab' },
      { key: 'h', action: 'help' },
      { key: 'q or ^C', action: 'quit' },
    ])
    .with('components', () => [
      { key: '↑/↓', action: 'select component' },
      { key: '←', action: 'back to plugin' },
      { key: 'h', action: 'help' },
      { key: 'q or ^C', action: 'quit' },
    ])
    .exhaustive()
}

/**
 * Displays keyboard shortcut hints in the footer
 * @example
 * <KeyHints focusZone="list" />
 * <KeyHints focusZone="search" extraHints={[{ key: 'i', action: 'install' }]} />
 * <KeyHints focusZone="components" />
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
        {allHints.map((hint) => (
          <Box key={`${hint.key}-${hint.action}`} gap={1}>
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
