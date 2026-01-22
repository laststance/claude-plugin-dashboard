/**
 * ComponentDetail component
 * Displays detailed information about a selected component
 * Shows name, type, description, allowed tools, and full content
 */

import * as path from 'node:path'
import { Box, Text } from 'ink'
import type { ComponentDetailedInfo, ComponentType } from '../types/index.js'

/**
 * Props for ComponentDetail
 */
export interface ComponentDetailProps {
  /** Detailed component info to display */
  component: ComponentDetailedInfo | null
  /** Maximum height for the detail panel */
  maxHeight?: number
}

/**
 * Type badge colors for visual distinction
 */
const TYPE_COLORS: Record<ComponentType, string> = {
  skill: 'magenta',
  command: 'cyan',
  agent: 'blue',
  hook: 'yellow',
  mcp: 'green',
  lsp: 'blueBright',
}

/**
 * Type labels for display
 */
const TYPE_LABELS: Record<ComponentType, string> = {
  skill: 'Skill',
  command: 'Slash Command',
  agent: 'Agent',
  hook: 'Hook',
  mcp: 'MCP Server',
  lsp: 'LSP Server',
}

/**
 * Displays detailed component information in a panel
 * Used when user selects a component from the ComponentList
 * @param props - ComponentDetailProps
 * @returns React node
 * @example
 * <ComponentDetail
 *   component={{
 *     name: "sentry-code-review",
 *     type: "skill",
 *     description: "Analyze Sentry comments",
 *     allowedTools: ["Read", "Edit"]
 *   }}
 * />
 */
export default function ComponentDetail({
  component,
  maxHeight = 10,
}: ComponentDetailProps): React.ReactNode {
  // Safe content height calculation (at least 1 line)
  const contentHeight = Math.max(1, maxHeight - 6)

  if (!component) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        height={maxHeight}
      >
        <Text dimColor>Select a component to view details</Text>
      </Box>
    )
  }

  const typeColor = TYPE_COLORS[component.type] || 'white'
  const typeLabel = TYPE_LABELS[component.type] || component.type

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      height={maxHeight}
      overflow="hidden"
    >
      {/* Header: Name + Type Badge */}
      <Box height={1}>
        <Text bold color="white">
          📦 {component.name}
        </Text>
        <Text> </Text>
        <Text color={typeColor} bold>
          [{typeLabel}]
        </Text>
      </Box>

      {/* Description */}
      {component.description && (
        <Box height={1}>
          <Text wrap="truncate">{component.description}</Text>
        </Box>
      )}

      {/* Allowed Tools */}
      {component.allowedTools && component.allowedTools.length > 0 && (
        <Box height={1}>
          <Text color="yellow" bold>
            Tools:{' '}
          </Text>
          <Text dimColor wrap="truncate">
            {component.allowedTools.join(', ')}
          </Text>
        </Box>
      )}

      {/* File Path (shortened) */}
      {component.filePath && (
        <Box height={1}>
          <Text color="gray">📄 {shortenPath(component.filePath)}</Text>
        </Box>
      )}

      {/* Full Description Preview */}
      {component.fullDescription && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan" bold>
            ── Content ──
          </Text>
          <Box height={contentHeight} overflow="hidden">
            <Text dimColor wrap="truncate">
              {truncateContent(component.fullDescription, contentHeight)}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

/**
 * Shorten file path for display (cross-platform)
 * Shows only the last few path components
 * @param filePath - Full file path
 * @returns Shortened path with forward slashes for consistent display
 */
function shortenPath(filePath: string): string {
  const normalized = path.normalize(filePath)
  const parts = normalized.split(path.sep)
  // Show last 4 components: .../skills/component-name/SKILL.md
  if (parts.length > 4) {
    return '.../' + parts.slice(-4).join('/')
  }
  return parts.join('/')
}

/**
 * Truncate multi-line content to fit within height
 * @param content - Full content string
 * @param maxLines - Maximum number of lines
 * @returns Truncated content
 */
function truncateContent(content: string, maxLines: number): string {
  const lines = content.split('\n')
  if (lines.length <= maxLines) {
    return content
  }
  return lines.slice(0, maxLines).join('\n') + '\n...'
}
