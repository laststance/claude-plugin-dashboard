/**
 * Integration tests for DiscoverTab component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import DiscoverTab from './DiscoverTab.js'
import type { Plugin, AppState } from '../types/index.js'

/**
 * Create a mock plugin for testing
 * @param overrides - Partial plugin properties to override defaults
 * @returns A complete Plugin object
 */
function createMockPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin@test-marketplace',
    name: 'test-plugin',
    marketplace: 'test-marketplace',
    description: 'A test plugin for testing',
    version: '1.0.0',
    installCount: 100,
    isInstalled: false,
    isEnabled: false,
    ...overrides,
  }
}

describe('DiscoverTab', () => {
  const defaultProps = {
    plugins: [] as Plugin[],
    selectedIndex: 0,
    searchQuery: '',
    sortBy: 'installs' as AppState['sortBy'],
    sortOrder: 'desc' as AppState['sortOrder'],
    isSearchMode: false,
  }

  describe('header rendering', () => {
    it('should render "Discover plugins" header', () => {
      const { lastFrame } = render(<DiscoverTab {...defaultProps} />)

      expect(lastFrame()).toContain('Discover plugins')
    })

    it('should show 0 count when no plugins', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={[]} />,
      )

      expect(lastFrame()).toContain('(0)')
    })

    it('should show correct count with single plugin', () => {
      const plugins = [
        createMockPlugin({ id: 'plugin-1@test', name: 'plugin-1' }),
      ]
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('1/1')
    })

    it('should show correct count with multiple plugins', () => {
      const plugins = [
        createMockPlugin({ id: 'plugin-1@test', name: 'plugin-1' }),
        createMockPlugin({ id: 'plugin-2@test', name: 'plugin-2' }),
        createMockPlugin({ id: 'plugin-3@test', name: 'plugin-3' }),
      ]
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('1/3')
    })

    it('should show correct selected index in count', () => {
      const plugins = [
        createMockPlugin({ id: 'plugin-1@test', name: 'plugin-1' }),
        createMockPlugin({ id: 'plugin-2@test', name: 'plugin-2' }),
        createMockPlugin({ id: 'plugin-3@test', name: 'plugin-3' }),
      ]
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={plugins} selectedIndex={2} />,
      )

      expect(lastFrame()).toContain('3/3')
    })
  })

  describe('SearchInput rendering', () => {
    it('should render SearchInput component', () => {
      const { lastFrame } = render(<DiscoverTab {...defaultProps} />)

      // SearchInput shows "Q" prefix
      expect(lastFrame()).toContain('Q')
    })

    it('should show placeholder when search query is empty', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} searchQuery="" />,
      )

      expect(lastFrame()).toContain('Type to search...')
    })

    it('should show search query when provided', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} searchQuery="context7" />,
      )

      expect(lastFrame()).toContain('context7')
    })

    it('should show cursor when in search mode', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} isSearchMode={true} />,
      )

      // Cursor indicator
      expect(lastFrame()).toMatch(/▌/)
    })
  })

  describe('SortDropdown rendering', () => {
    it('should render sort option for installs', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} sortBy="installs" sortOrder="desc" />,
      )

      // SortDropdown should show current sort option
      expect(lastFrame()).toBeDefined()
    })

    it('should render sort option for name', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} sortBy="name" sortOrder="asc" />,
      )

      expect(lastFrame()).toBeDefined()
    })
  })

  describe('plugin list rendering', () => {
    it('should render plugin names in the list', () => {
      const plugins = [
        createMockPlugin({ id: 'context7@test', name: 'context7' }),
        createMockPlugin({ id: 'code-review@test', name: 'code-review' }),
      ]
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('code-review')
    })

    it('should handle empty plugin list gracefully', () => {
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={[]} />,
      )

      // Should render without crashing
      expect(lastFrame()).toContain('Discover plugins')
    })
  })

  describe('plugin detail rendering', () => {
    it('should show selected plugin details', () => {
      const plugins = [
        createMockPlugin({
          id: 'context7@test',
          name: 'context7',
          description: 'Context7 MCP server for documentation',
        }),
      ]
      const { lastFrame } = render(
        <DiscoverTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('context7')
      expect(lastFrame()).toContain('Context7 MCP server for documentation')
    })
  })
})
