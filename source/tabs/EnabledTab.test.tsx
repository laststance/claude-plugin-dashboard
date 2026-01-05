/**
 * Integration tests for EnabledTab component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import EnabledTab from './EnabledTab.js'
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

describe('EnabledTab', () => {
  const defaultProps = {
    plugins: [] as Plugin[],
    selectedIndex: 0,
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

    it('should show correct count with enabled plugins only', () => {
      const plugins = [
        createMockPlugin({
          id: 'plugin-1@test',
          name: 'plugin-1',
          isInstalled: true,
          isEnabled: true,
        }),
        createMockPlugin({
          id: 'plugin-2@test',
          name: 'plugin-2',
          isInstalled: true,
          isEnabled: false,
        }),
        createMockPlugin({
          id: 'plugin-3@test',
          name: 'plugin-3',
          isInstalled: true,
          isEnabled: true,
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} selectedIndex={0} />,
      )

      // Only 2 enabled plugins, showing 1/2
      expect(lastFrame()).toContain('1/2')
    })
  })

  describe('filtering', () => {
    it('should filter to enabled plugins only (installed AND enabled)', () => {
      const plugins = [
        createMockPlugin({
          id: 'enabled@test',
          name: 'enabled-plugin',
          isInstalled: true,
          isEnabled: true,
        }),
        createMockPlugin({
          id: 'installed-only@test',
          name: 'installed-only',
          isInstalled: true,
          isEnabled: false,
        }),
        createMockPlugin({
          id: 'not-installed@test',
          name: 'not-installed',
          isInstalled: false,
          isEnabled: false,
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('enabled-plugin')
      expect(lastFrame()).not.toContain('installed-only')
      expect(lastFrame()).not.toContain('not-installed')
    })

    it('should not show plugin that is enabled but not installed', () => {
      const plugins = [
        createMockPlugin({
          id: 'weird@test',
          name: 'weird-state',
          isInstalled: false,
          isEnabled: true, // Enabled but not installed (edge case)
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).not.toContain('weird-state')
      expect(lastFrame()).toContain('No enabled plugins')
    })

    it('should show empty state when no plugins are enabled', () => {
      const plugins = [
        createMockPlugin({
          id: 'plugin-1@test',
          name: 'plugin-1',
          isInstalled: true,
          isEnabled: false,
        }),
        createMockPlugin({
          id: 'plugin-2@test',
          name: 'plugin-2',
          isInstalled: false,
          isEnabled: false,
        }),
      ]
      const { lastFrame } = render(
        <EnabledTab {...defaultProps} plugins={plugins} />,
      )

      expect(lastFrame()).toContain('No enabled plugins')
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
        createMockPlugin({
          id: 'p1@test',
          name: 'my-plugin',
          isInstalled: true,
          isEnabled: true,
        }),
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
        createMockPlugin({
          id: 'context7@test',
          name: 'context7',
          isInstalled: true,
          isEnabled: true,
        }),
        createMockPlugin({
          id: 'code-review@test',
          name: 'code-review',
          isInstalled: true,
          isEnabled: true,
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
        createMockPlugin({
          id: 'p1@test',
          name: 'first',
          isInstalled: true,
          isEnabled: true,
        }),
        createMockPlugin({
          id: 'p2@test',
          name: 'second',
          isInstalled: true,
          isEnabled: true,
        }),
        createMockPlugin({
          id: 'p3@test',
          name: 'third',
          isInstalled: true,
          isEnabled: true,
        }),
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
        createMockPlugin({
          id: 'context7@test',
          name: 'context7',
          description: 'Context7 MCP server',
          isInstalled: true,
          isEnabled: true,
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
        createMockPlugin({
          id: 'p1@test',
          name: 'only-one',
          isInstalled: true,
          isEnabled: true,
        }),
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
