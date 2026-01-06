/**
 * Integration tests for MarketplacesTab component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import MarketplacesTab from './MarketplacesTab.js'
import type { Marketplace, FocusZone } from '../types/index.js'

/**
 * Creates mock marketplace data for testing
 * @param overrides - Optional partial marketplace to override defaults
 * @returns Complete Marketplace object
 */
const createMockMarketplace = (
  overrides: Partial<Marketplace> = {},
): Marketplace => ({
  id: 'test-market',
  name: 'Test Marketplace',
  source: { source: 'github', repo: 'test/repo' },
  installLocation: '/path/to/marketplace',
  lastUpdated: '2024-01-01T00:00:00Z',
  pluginCount: 10,
  ...overrides,
})

describe('MarketplacesTab', () => {
  const defaultProps = {
    marketplaces: [] as Marketplace[],
    selectedIndex: 0,
    searchQuery: '',
    focusZone: 'list' as FocusZone,
  }

  describe('empty state', () => {
    it('should display "No marketplaces found" when marketplaces array is empty', () => {
      const { lastFrame } = render(<MarketplacesTab {...defaultProps} />)

      expect(lastFrame()).toContain('No marketplaces found')
    })

    it('should display help text for adding marketplaces when empty', () => {
      const { lastFrame } = render(<MarketplacesTab {...defaultProps} />)

      expect(lastFrame()).toContain('/plugin add-marketplace')
    })

    it('should display "0" in header when no marketplaces', () => {
      const { lastFrame } = render(<MarketplacesTab {...defaultProps} />)

      expect(lastFrame()).toContain('Marketplaces (0)')
    })

    it('should display "0 total plugins" when no marketplaces', () => {
      const { lastFrame } = render(<MarketplacesTab {...defaultProps} />)

      expect(lastFrame()).toContain('0 total plugins')
    })
  })

  describe('search bar', () => {
    it('should render search input', () => {
      const { lastFrame } = render(<MarketplacesTab {...defaultProps} />)

      expect(lastFrame()).toContain('🔍')
      expect(lastFrame()).toContain('search marketplaces')
    })

    it('should show search query when provided', () => {
      const { lastFrame } = render(
        <MarketplacesTab {...defaultProps} searchQuery="official" />,
      )

      expect(lastFrame()).toContain('official')
    })

    it('should highlight search bar when in search mode', () => {
      const { lastFrame } = render(
        <MarketplacesTab {...defaultProps} focusZone="search" />,
      )

      // Search mode shows cursor
      expect(lastFrame()).toContain('▌')
    })

    it('should show "No matching marketplaces" when search returns empty', () => {
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={[]}
          searchQuery="nonexistent"
        />,
      )

      expect(lastFrame()).toContain('No matching marketplaces')
      expect(lastFrame()).toContain('Try a different search term')
    })
  })

  describe('with marketplaces', () => {
    const mockMarketplaces: Marketplace[] = [
      createMockMarketplace({ id: 'm1', name: 'Market 1', pluginCount: 10 }),
      createMockMarketplace({ id: 'm2', name: 'Market 2', pluginCount: 15 }),
      createMockMarketplace({ id: 'm3', name: 'Market 3', pluginCount: 5 }),
    ]

    it('should display header with correct selection index (1/3)', () => {
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={mockMarketplaces}
          selectedIndex={0}
        />,
      )

      expect(lastFrame()).toContain('Marketplaces (1/3)')
    })

    it('should display header with correct selection index (2/3)', () => {
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={mockMarketplaces}
          selectedIndex={1}
        />,
      )

      expect(lastFrame()).toContain('Marketplaces (2/3)')
    })

    it('should display header with correct selection index (3/3)', () => {
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={mockMarketplaces}
          selectedIndex={2}
        />,
      )

      expect(lastFrame()).toContain('Marketplaces (3/3)')
    })

    it('should calculate and display total plugins across all marketplaces', () => {
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={mockMarketplaces}
          selectedIndex={0}
        />,
      )

      // 10 + 15 + 5 = 30
      expect(lastFrame()).toContain('30 total plugins')
    })

    it('should handle marketplaces with undefined pluginCount', () => {
      const marketplacesWithUndefined: Marketplace[] = [
        createMockMarketplace({ id: 'm1', pluginCount: 10 }),
        createMockMarketplace({ id: 'm2', pluginCount: undefined }),
        createMockMarketplace({ id: 'm3', pluginCount: 5 }),
      ]

      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={marketplacesWithUndefined}
          selectedIndex={0}
        />,
      )

      // 10 + 0 + 5 = 15
      expect(lastFrame()).toContain('15 total plugins')
    })

    it('should handle single marketplace correctly', () => {
      const singleMarketplace = [
        createMockMarketplace({
          id: 'm1',
          name: 'Single Market',
          pluginCount: 42,
        }),
      ]

      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={singleMarketplace}
          selectedIndex={0}
        />,
      )

      expect(lastFrame()).toContain('Marketplaces (1/1)')
      expect(lastFrame()).toContain('42 total plugins')
    })
  })

  describe('edge cases', () => {
    it('should handle selectedIndex beyond array bounds gracefully', () => {
      const mockMarketplaces = [
        createMockMarketplace({ id: 'm1', name: 'Market 1' }),
      ]

      // selectedIndex is 5, but only 1 marketplace exists
      // Component should still render without crashing
      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={mockMarketplaces}
          selectedIndex={5}
        />,
      )

      expect(lastFrame()).toContain('Marketplaces (6/1)')
    })

    it('should handle all marketplaces with pluginCount of 0', () => {
      const zeroPluginMarketplaces: Marketplace[] = [
        createMockMarketplace({ id: 'm1', pluginCount: 0 }),
        createMockMarketplace({ id: 'm2', pluginCount: 0 }),
      ]

      const { lastFrame } = render(
        <MarketplacesTab
          {...defaultProps}
          marketplaces={zeroPluginMarketplaces}
          selectedIndex={0}
        />,
      )

      expect(lastFrame()).toContain('0 total plugins')
    })
  })
})
