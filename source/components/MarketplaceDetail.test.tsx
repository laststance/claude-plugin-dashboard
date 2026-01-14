/**
 * Integration tests for MarketplaceDetail component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import MarketplaceDetail from './MarketplaceDetail.js'
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

describe('MarketplaceDetail', () => {
  describe('null state', () => {
    it('should render "Select a marketplace to view details" when marketplace is null', () => {
      const { lastFrame } = render(<MarketplaceDetail marketplace={null} />)

      expect(lastFrame()).toContain('Select a marketplace to view details')
    })
  })

  describe('marketplace details', () => {
    it('should render marketplace name when available', () => {
      const marketplace = createMockMarketplace({
        name: 'Claude Plugins Official',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Claude Plugins Official')
    })

    it('should render marketplace id when name is not available', () => {
      const marketplace = createMockMarketplace({
        id: 'my-custom-marketplace',
        name: '',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('my-custom-marketplace')
    })

    it('should render marketplace ID field', () => {
      const marketplace = createMockMarketplace({
        id: 'claude-plugins-official',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('ID:')
      expect(lastFrame()).toContain('claude-plugins-official')
    })

    it('should render plugin count', () => {
      const marketplace = createMockMarketplace({
        pluginCount: 42,
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Plugins:')
      expect(lastFrame()).toContain('42')
    })

    it('should render 0 for plugin count when undefined', () => {
      const marketplace = createMockMarketplace({
        pluginCount: undefined,
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Plugins:')
      expect(lastFrame()).toContain('0')
    })

    it('should render source type', () => {
      const marketplace = createMockMarketplace({
        source: { source: 'github' },
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Source:')
      expect(lastFrame()).toContain('github')
    })

    it('should render URL when available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'git',
          url: 'https://example.com/plugins.git',
        },
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('URL:')
      expect(lastFrame()).toContain('https://example.com/plugins.git')
    })

    it('should not render URL row when url is not available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'github',
          repo: 'anthropics/claude-plugins',
        },
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).not.toContain('URL:')
    })

    it('should render Repo when available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'github',
          repo: 'anthropics/claude-plugins',
        },
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Repo:')
      expect(lastFrame()).toContain('anthropics/claude-plugins')
    })

    it('should not render Repo row when repo is not available', () => {
      const marketplace = createMockMarketplace({
        source: {
          source: 'git',
          url: 'https://example.com/plugins.git',
        },
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).not.toContain('Repo:')
    })

    it('should render install location', () => {
      const marketplace = createMockMarketplace({
        installLocation: '/Users/test/.claude/plugins/marketplace',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Install Location:')
      expect(lastFrame()).toContain('/Users/test/.claude/plugins/marketplace')
    })
  })

  describe('formatDate function', () => {
    it('should format valid ISO date string to readable format', () => {
      const marketplace = createMockMarketplace({
        lastUpdated: '2024-06-15T10:30:00Z',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Last Updated:')
      // The formatted date should be "Jun 15, 2024" in en-US locale
      expect(lastFrame()).toContain('Jun 15, 2024')
    })

    it('should format another valid ISO date string correctly', () => {
      const marketplace = createMockMarketplace({
        lastUpdated: '2025-01-01T00:00:00Z',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Jan 1, 2025')
    })

    it('should handle date string with different time', () => {
      const marketplace = createMockMarketplace({
        lastUpdated: '2024-12-25T12:00:00Z',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      // Date should be formatted (exact date may vary by timezone)
      expect(lastFrame()).toContain('Last Updated:')
      expect(lastFrame()).toContain('Dec')
      expect(lastFrame()).toContain('2024')
    })

    it('should display Invalid Date for malformed date string', () => {
      const marketplace = createMockMarketplace({
        lastUpdated: 'invalid-date-string',
      })
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('Last Updated:')
      // Invalid date string results in "Invalid Date" from toLocaleDateString
      expect(lastFrame()).toContain('Invalid Date')
    })
  })

  describe('action hints', () => {
    it('should render action hints with keybindings', () => {
      const marketplace = createMockMarketplace()
      const { lastFrame } = render(
        <MarketplaceDetail marketplace={marketplace} />,
      )

      expect(lastFrame()).toContain('a')
      expect(lastFrame()).toContain('add')
      expect(lastFrame()).toContain('d')
      expect(lastFrame()).toContain('remove')
      expect(lastFrame()).toContain('u')
      expect(lastFrame()).toContain('update')
    })
  })
})
