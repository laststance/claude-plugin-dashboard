/**
 * Integration tests for InstalledTab component
 * Uses ink-testing-library to verify component rendering
 *
 * Note: InstalledTab receives pre-filtered plugins from parent.
 * Filtering logic is tested in App.integration.test.tsx
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import InstalledTab from './InstalledTab.js'
import type { Plugin } from '../types/index.js'

/**
 * Create a mock installed plugin for testing
 * @param overrides - Partial plugin properties to override defaults
 * @returns A complete Plugin object (isInstalled=true)
 */
function createMockInstalledPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin@test-marketplace',
    name: 'test-plugin',
    marketplace: 'test-marketplace',
    description: 'A test plugin for testing',
    version: '1.0.0',
    installCount: 100,
    isInstalled: true,
    isEnabled: false,
    ...overrides,
  }
}

describe('InstalledTab', () => {
  const defaultProps = {
    plugins: [] as Plugin[],
    selectedIndex: 0,
    searchQuery: '',
    isSearchMode: false,
  }

  describe('header rendering', () => {
    it('should render "Installed plugins" header', () => {
      const { lastFrame } = render(<InstalledTab {...defaultProps} />)

      expect(lastFrame()).toContain('Installed plugins')
    })

    it('should show 0 count when no installed plugins', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('(0)')
    })

    it('should show correct count with installed plugins', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'plugin-1@test', name: 'plugin-1' }),
        createMockInstalledPlugin({ id: 'plugin-2@test', name: 'plugin-2' }),
        createMockInstalledPlugin({ id: 'plugin-3@test', name: 'plugin-3' }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      // 3 installed plugins, showing 1/3
      expect(lastFrame()).toContain('1/3')
    })
  })

  describe('search bar', () => {
    it('should render search input', () => {
      const { lastFrame } = render(<InstalledTab {...defaultProps} />)

      expect(lastFrame()).toContain('🔍')
      expect(lastFrame()).toContain('search installed plugins')
    })

    it('should show search query when provided', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} searchQuery="context" />,
      )

      expect(lastFrame()).toContain('context')
    })

    it('should highlight search bar when in search mode', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} isSearchMode={true} />,
      )

      // Search mode shows cursor
      expect(lastFrame()).toContain('▌')
    })

    it('should show "No matching plugins" when search returns empty', () => {
      const { lastFrame } = render(
        <InstalledTab
          {...defaultProps}
          plugins={[]}
          searchQuery="nonexistent"
        />,
      )

      expect(lastFrame()).toContain('No matching plugins')
      expect(lastFrame()).toContain('Try a different search term')
    })
  })

  describe('enabled/disabled counts', () => {
    it('should show enabled count', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', isEnabled: true }),
        createMockInstalledPlugin({ id: 'p2@test', isEnabled: true }),
        createMockInstalledPlugin({ id: 'p3@test', isEnabled: false }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('2 enabled')
    })

    it('should show disabled count', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', isEnabled: true }),
        createMockInstalledPlugin({ id: 'p2@test', isEnabled: false }),
        createMockInstalledPlugin({ id: 'p3@test', isEnabled: false }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('2 disabled')
    })

    it('should show both enabled and disabled indicators', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', isEnabled: true }),
        createMockInstalledPlugin({ id: 'p2@test', isEnabled: false }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      // Check for the indicator symbols
      expect(lastFrame()).toMatch(/●.*1 enabled/)
      expect(lastFrame()).toMatch(/◐.*1 disabled/)
    })

    it('should show zero counts when no installed plugins', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('0 enabled')
      expect(lastFrame()).toContain('0 disabled')
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no plugins installed', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('No plugins installed')
    })

    it('should show help text in empty state', () => {
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('Discover tab')
      expect(lastFrame()).toContain('/plugin install')
    })

    it('should not show empty state when plugins are installed', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', name: 'my-plugin' }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).not.toContain('No plugins installed')
      expect(lastFrame()).toContain('my-plugin')
    })
  })

  describe('plugin list rendering', () => {
    it('should render installed plugin names', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'context7@test', name: 'context7' }),
        createMockInstalledPlugin({
          id: 'code-review@test',
          name: 'code-review',
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('code-review')
    })

    it('should show correct selected index among installed plugins', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', name: 'first' }),
        createMockInstalledPlugin({ id: 'p2@test', name: 'second' }),
        createMockInstalledPlugin({ id: 'p3@test', name: 'third' }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={1} />,
      )

      // Should show 2/3 (second of three installed)
      expect(lastFrame()).toContain('2/3')
    })
  })

  describe('plugin detail rendering', () => {
    it('should show selected installed plugin details', () => {
      const plugins = [
        createMockInstalledPlugin({
          id: 'context7@test',
          name: 'context7',
          description: 'Context7 MCP server',
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('Context7 MCP server')
    })

    it('should handle null plugin when index is out of bounds', () => {
      const plugins = [
        createMockInstalledPlugin({ id: 'p1@test', name: 'only-one' }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={5} />,
      )

      // Should render without crashing
      expect(lastFrame()).toContain('Installed plugins')
    })
  })
})
