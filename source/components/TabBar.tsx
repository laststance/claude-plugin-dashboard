/**
 * TabBar component
 * Horizontal tab navigation for the dashboard
 * Supports ← → arrow key navigation
 */

import { Box, Text } from 'ink'

type Tab = 'enabled' | 'installed' | 'discover' | 'marketplaces' | 'errors'

interface TabBarProps {
  activeTab: Tab
  onTabChange?: (tab: Tab) => void
  /** Whether the tab bar has keyboard focus */
  isFocused?: boolean
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'enabled', label: 'Enabled' },
  { id: 'installed', label: 'Installed' },
  { id: 'discover', label: 'Discover' },
  { id: 'marketplaces', label: 'Marketplaces' },
  { id: 'errors', label: 'Errors' },
]

/**
 * Horizontal tab bar component
 * @example
 * <TabBar activeTab="discover" isFocused={true} />
 */
export default function TabBar({ activeTab, isFocused = false }: TabBarProps) {
  return (
    <Box gap={2} marginBottom={1}>
      {/* Focus indicator prefix */}
      {isFocused && <Text color="cyan">▶</Text>}
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <Box key={tab.id}>
            {isActive ? (
              <Text
                bold
                color="cyan"
                backgroundColor={isFocused ? '#1a3a4a' : '#333333'}
              >
                {isFocused ? `[${tab.label}]` : ` ${tab.label} `}
              </Text>
            ) : (
              <Text color="gray">{` ${tab.label} `}</Text>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

/**
 * Get the next tab in the cycle
 * @param currentTab - Current active tab
 * @param direction - Navigation direction
 * @returns Next tab ID
 */
export function getNextTab(currentTab: Tab, direction: 'next' | 'prev'): Tab {
  const currentIndex = TABS.findIndex((t) => t.id === currentTab)
  const tabCount = TABS.length

  const newIndex =
    direction === 'next'
      ? (currentIndex + 1) % tabCount
      : (currentIndex - 1 + tabCount) % tabCount

  return TABS[newIndex]!.id
}
