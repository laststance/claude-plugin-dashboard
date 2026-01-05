/**
 * Integration tests for InstalledTab component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import InstalledTab from './InstalledTab.js'
import type { Plugin } from '../types/index.js'

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

describe('InstalledTab', () => {
  const defaultProps = {
    plugins: [] as Plugin[],
    selectedIndex: 0,
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

    it('should show correct count with installed plugins only', () => {
      const plugins = [
        createMockPlugin({
          id: 'plugin-1@test',
          name: 'plugin-1',
          isInstalled: true,
        }),
        createMockPlugin({
          id: 'plugin-2@test',
          name: 'plugin-2',
          isInstalled: false,
        }),
        createMockPlugin({
          id: 'plugin-3@test',
          name: 'plugin-3',
          isInstalled: true,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      // Only 2 installed plugins, showing 1/2
      expect(lastFrame()).toContain('1/2')
    })
  })

  describe('filtering', () => {
    it('should filter to installed plugins only', () => {
      const plugins = [
        createMockPlugin({
          id: 'installed@test',
          name: 'installed',
          isInstalled: true,
        }),
        createMockPlugin({
          id: 'not-installed@test',
          name: 'not-installed',
          isInstalled: false,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('installed')
      expect(lastFrame()).not.toContain('not-installed')
    })

    it('should show empty state when no plugins are installed', () => {
      const plugins = [
        createMockPlugin({
          id: 'plugin-1@test',
          name: 'plugin-1',
          isInstalled: false,
        }),
        createMockPlugin({
          id: 'plugin-2@test',
          name: 'plugin-2',
          isInstalled: false,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('No plugins installed')
    })
  })

  describe('enabled/disabled counts', () => {
    it('should show enabled count', () => {
      const plugins = [
        createMockPlugin({ id: 'p1@test', isInstalled: true, isEnabled: true }),
        createMockPlugin({ id: 'p2@test', isInstalled: true, isEnabled: true }),
        createMockPlugin({
          id: 'p3@test',
          isInstalled: true,
          isEnabled: false,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('2 enabled')
    })

    it('should show disabled count', () => {
      const plugins = [
        createMockPlugin({ id: 'p1@test', isInstalled: true, isEnabled: true }),
        createMockPlugin({
          id: 'p2@test',
          isInstalled: true,
          isEnabled: false,
        }),
        createMockPlugin({
          id: 'p3@test',
          isInstalled: true,
          isEnabled: false,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('2 disabled')
    })

    it('should show both enabled and disabled indicators', () => {
      const plugins = [
        createMockPlugin({ id: 'p1@test', isInstalled: true, isEnabled: true }),
        createMockPlugin({
          id: 'p2@test',
          isInstalled: true,
          isEnabled: false,
        }),
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

    it('should not count non-installed plugins in stats', () => {
      const plugins = [
        createMockPlugin({ id: 'p1@test', isInstalled: true, isEnabled: true }),
        createMockPlugin({
          id: 'p2@test',
          isInstalled: false,
          isEnabled: true,
        }), // Not installed, shouldn't count
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('1 enabled')
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
        createMockPlugin({
          id: 'p1@test',
          name: 'my-plugin',
          isInstalled: true,
        }),
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
        createMockPlugin({
          id: 'context7@test',
          name: 'context7',
          isInstalled: true,
        }),
        createMockPlugin({
          id: 'code-review@test',
          name: 'code-review',
          isInstalled: true,
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
        createMockPlugin({ id: 'p1@test', name: 'first', isInstalled: true }),
        createMockPlugin({ id: 'p2@test', name: 'second', isInstalled: true }),
        createMockPlugin({ id: 'p3@test', name: 'third', isInstalled: true }),
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
        createMockPlugin({
          id: 'context7@test',
          name: 'context7',
          description: 'Context7 MCP server',
          isInstalled: true,
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
        createMockPlugin({
          id: 'p1@test',
          name: 'only-one',
          isInstalled: true,
        }),
      ]
      const { lastFrame } = render(
        <InstalledTab {...defaultProps} plugins={plugins} selectedIndex={5} />,
      )

      // Should render without crashing
      expect(lastFrame()).toContain('Installed plugins')
    })
  })
})
