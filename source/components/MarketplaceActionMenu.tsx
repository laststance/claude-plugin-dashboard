/**
 * Action menu component for marketplace operations
 * Displays selectable list of actions: Browse, Update, Auto-update toggle, Remove
 */

import { Box, Text } from 'ink'
import type { Marketplace } from '../types/index.js'

/**
 * Available marketplace actions
 */
export type MarketplaceAction = 'browse' | 'update' | 'autoUpdate' | 'remove'

/**
 * Props for MarketplaceActionMenu component
 */
export interface MarketplaceActionMenuProps {
  /** Currently selected marketplace */
  marketplace: Marketplace
  /** Index of selected action in menu */
  selectedIndex: number
}

/**
 * Action item definition
 */
interface ActionItem {
  id: MarketplaceAction
  label: string
  description?: string
}

/**
 * Get action items for the marketplace
 * @param marketplace - The marketplace to get actions for
 * @returns Array of action items with dynamic labels
 */
function getActionItems(marketplace: Marketplace): ActionItem[] {
  return [
    {
      id: 'browse',
      label: `Browse plugins (${marketplace.pluginCount || 0})`,
    },
    {
      id: 'update',
      label: 'Update marketplace',
      description: `last updated ${marketplace.lastUpdated}`,
    },
    {
      id: 'autoUpdate',
      label: marketplace.autoUpdate
        ? 'Disable auto-update'
        : 'Enable auto-update',
    },
    {
      id: 'remove',
      label: 'Remove marketplace',
    },
  ]
}

/**
 * MarketplaceActionMenu - Selectable action list for marketplace operations
 * @param props - Component props
 * @returns Action menu UI with keyboard navigation support
 * @example
 * <MarketplaceActionMenu
 *   marketplace={selectedMarketplace}
 *   selectedIndex={0}
 * />
 */
export default function MarketplaceActionMenu({
  marketplace,
  selectedIndex,
}: MarketplaceActionMenuProps) {
  const actions = getActionItems(marketplace)

  return (
    <Box flexDirection="column" marginTop={1}>
      {actions.map((action, index) => {
        const isSelected = index === selectedIndex
        return (
          <Box key={action.id} gap={1}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '❯' : ' '}
            </Text>
            <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
              {action.label}
            </Text>
            {action.description && <Text dimColor>({action.description})</Text>}
          </Box>
        )
      })}
      <Box marginTop={1}>
        <Text dimColor>Enter to select · escape to go back</Text>
      </Box>
    </Box>
  )
}

/**
 * Get action at specified index
 * @param marketplace - The marketplace
 * @param index - Action index
 * @returns The action id at the index
 */
export function getActionAtIndex(
  marketplace: Marketplace,
  index: number,
): MarketplaceAction {
  const actions = getActionItems(marketplace)
  return actions[index]?.id ?? 'browse'
}

/**
 * Get total number of actions available
 * @returns Number of actions in menu
 */
export function getActionCount(): number {
  return 4 // browse, update, autoUpdate, remove
}
