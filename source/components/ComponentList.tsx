/**
 * ComponentList component
 * Displays detailed plugin components in a collapsible list format
 * Shows component names when available, falls back to counts
 *
 * Data Source Architecture:
 * - Installed plugins: Names + descriptions from file system scan
 * - Not installed: Names only from marketplace JSON (if available)
 * - Fallback: Count-only display from PluginComponents
 */

import { Box, Text } from 'ink'
import type {
  ComponentInfo,
  ComponentType,
  PluginComponents,
  PluginComponentsDetailed,
} from '../types/index.js'

/**
 * Props for ComponentList
 */
export interface ComponentListProps {
  /** Component counts (backward compat fallback) */
  components?: PluginComponents
  /** Detailed component info with names */
  componentsDetailed?: PluginComponentsDetailed
  /** Maximum visible items per category (default: 3) */
  maxItems?: number
}

/**
 * Category display configuration
 */
interface CategoryConfig {
  /** Display label */
  label: string
  /** Color for the category header */
  color: string
  /** Key in PluginComponentsDetailed for detailed info */
  detailedKey: keyof PluginComponentsDetailed
  /** Key in PluginComponents for count fallback */
  countKey: keyof PluginComponents
  /** Component type */
  type: ComponentType
}

/**
 * Category configurations with display settings
 */
const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    label: 'Skills',
    color: 'magenta',
    detailedKey: 'skills',
    countKey: 'skills',
    type: 'skill',
  },
  {
    label: 'Slash',
    color: 'cyan',
    detailedKey: 'commands',
    countKey: 'commands',
    type: 'command',
  },
  {
    label: 'Agents',
    color: 'blue',
    detailedKey: 'agents',
    countKey: 'agents',
    type: 'agent',
  },
  {
    label: 'MCP',
    color: 'green',
    detailedKey: 'mcpServers',
    countKey: 'mcpServers',
    type: 'mcp',
  },
  {
    label: 'LSP',
    color: 'blueBright',
    detailedKey: 'lspServers',
    countKey: 'lspServers',
    type: 'lsp',
  },
  {
    label: 'Hooks',
    color: 'yellow',
    detailedKey: 'hooks',
    countKey: 'hooks',
    type: 'hook',
  },
]

/**
 * Default maximum visible items per category
 */
const DEFAULT_MAX_ITEMS = 3

/**
 * Displays component details in a collapsible list
 * Shows names when available, falls back to counts
 * @param props - ComponentListProps
 * @returns React node or null if no components
 * @example
 * <ComponentList
 *   componentsDetailed={{ skills: [{ name: 'xlsx', type: 'skill' }] }}
 *   maxItems={3}
 * />
 */
export default function ComponentList({
  components,
  componentsDetailed,
  maxItems = DEFAULT_MAX_ITEMS,
}: ComponentListProps): React.ReactNode {
  // No data at all
  if (!components && !componentsDetailed) {
    return null
  }

  // Check if we have any components to display
  const hasDetailedData =
    componentsDetailed && hasAnyDetailedComponents(componentsDetailed)
  const hasCountData = components && hasAnyCountComponents(components)

  if (!hasDetailedData && !hasCountData) {
    return null
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={0}>
        <Text color="cyan" bold>
          ── Components ──
        </Text>
      </Box>

      {/* Categories */}
      {CATEGORY_CONFIGS.map((config) => {
        const detailedItems = componentsDetailed?.[config.detailedKey]
        const count = components?.[config.countKey]

        // Skip if no data for this category
        if (!detailedItems?.length && !count) {
          return null
        }

        // Prefer detailed data, fall back to count
        if (detailedItems && detailedItems.length > 0) {
          // Type guard: detailedItems could be ComponentInfo[] or string[]
          if (isComponentInfoArray(detailedItems)) {
            return (
              <CategorySection
                key={config.detailedKey}
                label={config.label}
                color={config.color}
                items={detailedItems}
                maxItems={maxItems}
              />
            )
          } else {
            // String array (mcpServers, lspServers, hooks)
            return (
              <CategorySectionSimple
                key={config.detailedKey}
                label={config.label}
                color={config.color}
                items={detailedItems}
                maxItems={maxItems}
              />
            )
          }
        }

        // Count-only fallback (number) or boolean hooks fallback
        if (typeof count === 'number' && count > 0) {
          return (
            <CountOnlySection
              key={config.countKey}
              label={config.label}
              color={config.color}
              count={count}
            />
          )
        }

        // Boolean hooks fallback (hooks: true without detailed info)
        if (config.countKey === 'hooks' && count === true) {
          return (
            <Box key={config.countKey}>
              <Text color={config.color} bold>
                {config.label}
              </Text>
              <Text dimColor> (configured)</Text>
            </Box>
          )
        }

        return null
      })}
    </Box>
  )
}

/**
 * Props for CategorySection
 */
interface CategorySectionProps {
  /** Category display label */
  label: string
  /** Color for the category header */
  color: string
  /** Component items to display */
  items: ComponentInfo[]
  /** Maximum visible items */
  maxItems: number
}

/**
 * Single category section with collapsible ComponentInfo items
 * Shows first N items, then "+M more..." for overflow
 * @returns React node for the category section
 */
function CategorySection({
  label,
  color,
  items,
  maxItems,
}: CategorySectionProps): React.ReactNode {
  const visibleItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={color} bold>
          {label}
        </Text>
        <Text dimColor> ({items.length})</Text>
      </Box>
      {visibleItems.map((item) => (
        <Text key={item.name}>
          {'  '}• {item.name}
          {item.description && (
            <Text dimColor> - {truncate(item.description, 30)}</Text>
          )}
        </Text>
      ))}
      {remainingCount > 0 && (
        <Text dimColor>
          {'  '}└─ +{remainingCount} more...
        </Text>
      )}
    </Box>
  )
}

/**
 * Props for CategorySectionSimple
 */
interface CategorySectionSimpleProps {
  /** Category display label */
  label: string
  /** Color for the category header */
  color: string
  /** Simple string items to display */
  items: string[]
  /** Maximum visible items */
  maxItems: number
}

/**
 * Category section for simple string arrays (mcpServers, lspServers, hooks)
 * @returns React node for the category section
 */
function CategorySectionSimple({
  label,
  color,
  items,
  maxItems,
}: CategorySectionSimpleProps): React.ReactNode {
  const visibleItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={color} bold>
          {label}
        </Text>
        <Text dimColor> ({items.length})</Text>
      </Box>
      {visibleItems.map((item) => (
        <Text key={item}>
          {'  '}• {item}
        </Text>
      ))}
      {remainingCount > 0 && (
        <Text dimColor>
          {'  '}└─ +{remainingCount} more...
        </Text>
      )}
    </Box>
  )
}

/**
 * Props for CountOnlySection
 */
interface CountOnlySectionProps {
  /** Category display label */
  label: string
  /** Color for the category header */
  color: string
  /** Component count */
  count: number
}

/**
 * Category section showing only count (fallback when no detailed info)
 * @returns React node for the count-only section
 */
function CountOnlySection({
  label,
  color,
  count,
}: CountOnlySectionProps): React.ReactNode {
  return (
    <Box>
      <Text color={color} bold>
        {label}
      </Text>
      <Text dimColor>: {count}</Text>
    </Box>
  )
}

/**
 * Type guard to check if array is ComponentInfo[]
 * @param arr - Array to check
 * @returns true if array contains ComponentInfo objects
 */
function isComponentInfoArray(
  arr: ComponentInfo[] | string[],
): arr is ComponentInfo[] {
  return arr.length > 0 && typeof arr[0] === 'object' && 'name' in arr[0]
}

/**
 * Check if PluginComponentsDetailed has any data
 * @param detailed - Detailed components object
 * @returns true if any category has items
 * @example
 * hasAnyDetailedComponents({ skills: [{ name: 'xlsx', type: 'skill' }] }) // => true
 * hasAnyDetailedComponents({}) // => false
 */
export function hasAnyDetailedComponents(
  detailed: PluginComponentsDetailed,
): boolean {
  return (
    (detailed.skills?.length ?? 0) > 0 ||
    (detailed.commands?.length ?? 0) > 0 ||
    (detailed.agents?.length ?? 0) > 0 ||
    (detailed.hooks?.length ?? 0) > 0 ||
    (detailed.mcpServers?.length ?? 0) > 0 ||
    (detailed.lspServers?.length ?? 0) > 0
  )
}

/**
 * Check if PluginComponents has any count data
 * @param components - Components counts object
 * @returns true if any category has count > 0
 * @example
 * hasAnyCountComponents({ skills: 5 }) // => true
 * hasAnyCountComponents({ hooks: true }) // => true
 * hasAnyCountComponents({}) // => false
 */
export function hasAnyCountComponents(components: PluginComponents): boolean {
  return (
    (components.skills ?? 0) > 0 ||
    (components.commands ?? 0) > 0 ||
    (components.agents ?? 0) > 0 ||
    components.hooks === true ||
    (components.mcpServers ?? 0) > 0 ||
    (components.lspServers ?? 0) > 0
  )
}

/**
 * Truncate string to max length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength - 3) + '...'
}
