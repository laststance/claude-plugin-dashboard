/**
 * SearchInput component
 * Filter/search box for the plugin list
 */

import { Box, Text } from 'ink'

interface SearchInputProps {
  query: string
  isActive?: boolean
  placeholder?: string
}

/**
 * Search input display (read-only display, actual input handled by useInput)
 * @example
 * <SearchInput query={searchQuery} isActive={isSearchMode} />
 */
export default function SearchInput({
  query,
  isActive = false,
  placeholder = 'Type to search...',
}: SearchInputProps) {
  return (
    <Box
      borderStyle={isActive ? 'round' : 'single'}
      borderColor={isActive ? 'cyan' : 'gray'}
      paddingX={1}
    >
      <Text color={isActive ? 'cyan' : 'gray'}>Q </Text>
      {query ? <Text>{query}</Text> : <Text dimColor>{placeholder}</Text>}
      {isActive && <Text color="cyan">▌</Text>}
    </Box>
  )
}
