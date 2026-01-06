/**
 * HelpOverlay component
 * Displays a full-screen overlay with all available keyboard shortcuts
 */

import { Box, Text } from 'ink'

interface HelpOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean
}

/**
 * Help section with title and key-value pairs
 */
interface HelpSection {
  title: string
  items: Array<{ key: string; description: string }>
}

const helpSections: HelpSection[] = [
  {
    title: 'Navigation',
    items: [
      { key: '←/→, Tab', description: 'Switch tabs' },
      { key: '↑/↓, ^P/^N', description: 'Navigate list' },
      { key: '^F/^B', description: 'Switch tabs (Emacs)' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { key: 'i, Enter', description: 'Install / Toggle plugin' },
      { key: 'u', description: 'Uninstall plugin' },
      { key: 'Space', description: 'Toggle enable/disable' },
      { key: 's/S', description: 'Sort options / order' },
    ],
  },
  {
    title: 'Search',
    items: [
      { key: '/', description: 'Enter search mode' },
      { key: 'Esc, ↓', description: 'Exit search mode' },
    ],
  },
  {
    title: 'General',
    items: [
      { key: 'q, ^C', description: 'Quit' },
      { key: 'h', description: 'Toggle this help' },
    ],
  },
]

/**
 * Full-screen help overlay showing all keyboard shortcuts
 * @example
 * <HelpOverlay isVisible={showHelp} />
 */
export default function HelpOverlay({ isVisible }: HelpOverlayProps) {
  if (!isVisible) {
    return null
  }

  const keyWidth = 14

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          ─────────── Help ───────────
        </Text>
      </Box>

      {helpSections.map((section) => (
        <Box key={section.title} flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            {section.title}
          </Text>
          {section.items.map((item, itemIndex) => (
            <Box key={itemIndex}>
              <Box width={keyWidth}>
                <Text color="green">{item.key.padEnd(keyWidth - 2)}</Text>
              </Box>
              <Text dimColor>{item.description}</Text>
            </Box>
          ))}
        </Box>
      ))}

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Press h or Esc to close</Text>
      </Box>
    </Box>
  )
}
