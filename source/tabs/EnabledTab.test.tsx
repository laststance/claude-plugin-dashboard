/**
 * Integration tests for EnabledTab component
 * Uses ink-testing-library to verify component rendering
 *
 * Note: EnabledTab receives pre-filtered plugins from parent.
 * Filtering logic is tested in App.integration.test.tsx
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import EnabledTab from './EnabledTab.js'
import type { Plugin } from '../types/index.js'

/**
 * Create a mock enabled plugin for testing
 * @param overrides - Partial plugin properties to override defaults
 * @returns A complete Plugin object (isInstalled=true, isEnabled=true)
 */
function createMockEnabledPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin@test-marketplace',
    name: 'test-plugin',
    marketplace: 'test-marketplace',
    description: 'A test plugin for testing',
    version: '1.0.0',
    installCount: 100,
    isInstalled: true,
    isEnabled: true,
    ...overrides,
  }
}

describe('EnabledTab', () => {
  const defaultProps = {
    plugins: [] as Plugin[],
    selectedIndex: 0,
    searchQuery: '',
    isSearchMode: false,
  }

  describe('header rendering', () => {
    it('should render "Enabled plugins" header', () => {
      const { lastFrame } = render(<EnabledTab {...defaultProps} />)

      expect(lastFrame()).toContain('Enabled plugins')
    })

    it('should show 0 count when no enabled plugins', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('(0')
    })

    it('should show correct count with enabled plugins', () => {
      const plugins = [
        createMockEnabledPlugin({ id: 'plugin-1@test', name: 'plugin-1' }),
        createMockEnabledPlugin({ id: 'plugin-2@test', name: 'plugin-2' }),
        createMockEnabledPlugin({ id: 'plugin-3@test', name: 'plugin-3' }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      // 3 enabled plugins, showing 1/3
      expect(lastFrame()).toContain('1/3')
    })
  })

  describe('search bar', () => {
    it('should render search input', () => {
      const { lastFrame } = render(<EnabledTab {...defaultProps} />)

      expect(lastFrame()).toContain('🔍')
      expect(lastFrame()).toContain('search enabled plugins')
    })

    it('should show search query when provided', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} searchQuery="context" />,
      )

      expect(lastFrame()).toContain('context')
    })

    it('should highlight search bar when in search mode', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} isSearchMode={true} />,
      )

      // Search mode shows cursor
      expect(lastFrame()).toContain('▌')
    })

    it('should show "No matching plugins" when search returns empty', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={[]} searchQuery="nonexistent" />,
      )

      expect(lastFrame()).toContain('No matching plugins')
      expect(lastFrame()).toContain('Try a different search term')
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no plugins enabled', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('No enabled plugins')
    })

    it('should show help text in empty state', () => {
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('Installed tab')
      expect(lastFrame()).toContain('/plugin enable')
    })

    it('should not show empty state when plugins are enabled', () => {
      const plugins = [
        createMockEnabledPlugin({ id: 'p1@test', name: 'my-plugin' }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).not.toContain('No enabled plugins')
      expect(lastFrame()).toContain('my-plugin')
    })
  })

  describe('plugin list rendering', () => {
    it('should render enabled plugin names', () => {
      const plugins = [
        createMockEnabledPlugin({ id: 'context7@test', name: 'context7' }),
        createMockEnabledPlugin({
          id: 'code-review@test',
          name: 'code-review',
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('code-review')
    })

    it('should show correct selected index among enabled plugins', () => {
      const plugins = [
        createMockEnabledPlugin({ id: 'p1@test', name: 'first' }),
        createMockEnabledPlugin({ id: 'p2@test', name: 'second' }),
        createMockEnabledPlugin({ id: 'p3@test', name: 'third' }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} selectedIndex={1} />,
      )

      // Should show 2/3 (second of three enabled)
      expect(lastFrame()).toContain('2/3')
    })
  })

  describe('plugin detail rendering', () => {
    it('should show selected enabled plugin details', () => {
      const plugins = [
        createMockEnabledPlugin({
          id: 'context7@test',
          name: 'context7',
          description: 'Context7 MCP server',
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('Context7 MCP server')
    })

    it('should handle null plugin when index is out of bounds', () => {
      const plugins = [
        createMockEnabledPlugin({ id: 'p1@test', name: 'only-one' }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} selectedIndex={5} />,
      )

      // Should render without crashing
      expect(lastFrame()).toContain('Enabled plugins')
    })
  })

  describe('header description', () => {
    it('should show "Currently active in Claude Code" description', () => {
      const { lastFrame } = render(<EnabledTab {...defaultProps} />)

      expect(lastFrame()).toContain('Currently active in Claude Code')
    })
  })
})
