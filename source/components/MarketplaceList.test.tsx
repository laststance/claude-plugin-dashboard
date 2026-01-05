/**
 * Integration tests for MarketplaceList component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import MarketplaceList from './MarketplaceList.js'
import type { Marketplace } from '../types/index.js'

/**
 * Create a mock marketplace for testing
 * @param overrides - Partial marketplace properties to override defaults
 * @returns A complete Marketplace object
 */
function createMockMarketplace(
  overrides: Partial<Marketplace> = {},
): Marketplace {
  return {
    id: 'claude-plugins-official',
    name: 'Claude Plugins Official',
    source: { source: 'github', repo: 'anthropics/claude-plugins' },
    installLocation: '/path/to/plugins',
    lastUpdated: '2024-06-15T10:30:00Z',
    pluginCount: 25,
    ...overrides,
  }
}

describe('MarketplaceList', () => {
  describe('empty state', () => {
    it('should render "No marketplaces found" when marketplaces array is empty', () => {
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('No marketplaces found')
    })
  })

  describe('rendering marketplace items', () => {
    it('should render marketplace name when available', () => {
      const marketplace = createMockMarketplace({
        name: 'Claude Plugins Official',
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Claude Plugins Official')
    })

    it('should render marketplace id when name is not available', () => {
      const marketplace = createMockMarketplace({
        id: 'my-custom-marketplace',
        name: '',
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('my-custom-marketplace')
    })

    it('should render plugin count', () => {
      const marketplace = createMockMarketplace({
        pluginCount: 42,
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('42 plugins')
    })

    it('should render 0 plugins when pluginCount is undefined', () => {
      const marketplace = createMockMarketplace({
        pluginCount: undefined,
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('0 plugins')
    })

    it('should render multiple marketplaces', () => {
      const marketplaces = [
        createMockMarketplace({ id: 'official', name: 'Official Plugins' }),
        createMockMarketplace({ id: 'community', name: 'Community Plugins' }),
      ]
      const { lastFrame } = render(
        <MarketplaceList marketplaces={marketplaces} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Official Plugins')
      expect(lastFrame()).toContain('Community Plugins')
    })
  })

  describe('selection indicator', () => {
    it('should show ">" indicator for selected item', () => {
      const marketplace = createMockMarketplace()
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('>')
    })

    it('should show ">" only for the selected item in a list', () => {
      const marketplaces = [
        createMockMarketplace({ id: 'first', name: 'First' }),
        createMockMarketplace({ id: 'second', name: 'Second' }),
        createMockMarketplace({ id: 'third', name: 'Third' }),
      ]
      const { lastFrame } = render(
        <MarketplaceList marketplaces={marketplaces} selectedIndex={1} />,
      )

      const frame = lastFrame()!
      // The indicator should appear before "Second" (selectedIndex=1)
      // Count occurrences of ">" - should be exactly 1
      const indicatorCount = (frame.match(/>/g) || []).length
      expect(indicatorCount).toBe(1)
    })
  })

  describe('getSourceDisplay function', () => {
    it('should return url when source.url is available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'git',
          url: 'https://example.com/plugins.git',
        },
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('https://example.com/plugins.git')
    })

    it('should return github.com/{repo} when source.repo is available but url is not', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'github',
          repo: 'anthropics/claude-plugins',
        },
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('github.com/anthropics/claude-plugins')
    })

    it('should return source.source as fallback when neither url nor repo is available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'git',
        },
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('git')
    })

    it('should prefer url over repo when both are available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'github',
          url: 'https://custom-url.com/plugins',
          repo: 'anthropics/claude-plugins',
        },
      })
      const { lastFrame } = render(
        <MarketplaceList marketplaces={[marketplace]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('https://custom-url.com/plugins')
      // Should not contain the repo format since url takes precedence
      expect(lastFrame()).not.toContain('github.com/anthropics')
    })
  })
})
