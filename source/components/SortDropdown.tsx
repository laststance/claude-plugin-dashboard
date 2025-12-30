/**
 * SortDropdown component
 * Displays current sort option
 */

import { Box, Text } from 'ink'

type SortBy = 'installs' | 'name' | 'date'
type SortOrder = 'asc' | 'desc'

interface SortDropdownProps {
  sortBy: SortBy
  sortOrder: SortOrder
}

const SORT_LABELS: Record<SortBy, string> = {
  installs: 'Installs',
  name: 'Name',
  date: 'Date',
}

/**
 * Displays the current sort option
 * @example
 * <SortDropdown sortBy="installs" sortOrder="desc" />
 */
export default function SortDropdown({ sortBy, sortOrder }: SortDropdownProps) {
  const label = SORT_LABELS[sortBy]
  const arrow = sortOrder === 'desc' ? '▼' : '▲'

  return (
    <Box gap={1}>
      <Text dimColor>Sort:</Text>
      <Text color="cyan">{label}</Text>
      <Text color="cyan">{arrow}</Text>
    </Box>
  )
}

/**
 * Get next sort option in cycle
 */
export function getNextSort(current: SortBy): SortBy {
  const options: SortBy[] = ['installs', 'name', 'date']
  const currentIndex = options.indexOf(current)
  return options[(currentIndex + 1) % options.length]!
}
