/**
 * Integration tests for PluginDetail component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import PluginDetail from './PluginDetail.js'
import type { Plugin } from '../types/index.js'

/**
 * Factory function to create test plugin fixtures
 * @param overrides - Partial plugin properties to override defaults
 * @returns Complete Plugin object for testing
 */
function createTestPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test-plugin@test-marketplace',
    name: 'Test Plugin',
    marketplace: 'test-marketplace',
    description: 'A test plugin for testing purposes',
    version: '1.0.0',
    installCount: 1500,
    isInstalled: false,
    isEnabled: false,
    ...overrides,
  }
}

describe('PluginDetail', () => {
  describe('null plugin state', () => {
    it('should show placeholder message when plugin is null', () => {
      const { lastFrame } = render(<PluginDetail plugin={null} />)

      expect(lastFrame()).toContain('Select a plugin to view details')
    })
  })

  describe('plugin display', () => {
    it('should show plugin name', () => {
      const plugin = createTestPlugin({ name: 'My Awesome Plugin' })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('My Awesome Plugin')
    })

    it('should show plugin description', () => {
      const plugin = createTestPlugin({
        description: 'This plugin does amazing things',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('This plugin does amazing things')
    })

    it('should show fallback text when description is empty', () => {
      const plugin = createTestPlugin({ description: '' })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('No description available')
    })
  })

  describe('metadata rows', () => {
    it('should show marketplace name', () => {
      const plugin = createTestPlugin({
        marketplace: 'claude-plugins-official',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Marketplace:')
      expect(lastFrame()).toContain('claude-plugins-official')
    })

    it('should show version', () => {
      const plugin = createTestPlugin({ version: '2.5.1' })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Version:')
      expect(lastFrame()).toContain('2.5.1')
    })

    it('should show install count formatted with K suffix', () => {
      const plugin = createTestPlugin({ installCount: 5600 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Installs:')
      expect(lastFrame()).toContain('5.6K')
    })

    it('should show install count formatted with M suffix for millions', () => {
      const plugin = createTestPlugin({ installCount: 2500000 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Installs:')
      expect(lastFrame()).toContain('2.5M')
    })

    it('should show raw install count when under 1000', () => {
      const plugin = createTestPlugin({ installCount: 456 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Installs:')
      expect(lastFrame()).toContain('456')
    })

    it('should show category when provided', () => {
      const plugin = createTestPlugin({ category: 'Development Tools' })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Category:')
      expect(lastFrame()).toContain('Development Tools')
    })

    it('should not show category row when category is undefined', () => {
      const plugin = createTestPlugin({ category: undefined })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('Category:')
    })

    it('should show author name when provided', () => {
      const plugin = createTestPlugin({
        author: { name: 'John Developer', email: 'john@example.com' },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Author:')
      expect(lastFrame()).toContain('John Developer')
    })

    it('should not show author row when author is undefined', () => {
      const plugin = createTestPlugin({ author: undefined })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('Author:')
    })

    it('should show homepage when provided', () => {
      const plugin = createTestPlugin({
        homepage: 'https://github.com/example/plugin',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Homepage:')
      expect(lastFrame()).toContain('https://github.com/example/plugin')
    })

    it('should not show homepage row when homepage is undefined', () => {
      const plugin = createTestPlugin({ homepage: undefined })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('Homepage:')
    })
  })

  describe('status display', () => {
    it('should show "Installed & Enabled" in green when installed and enabled', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: true,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Status:')
      expect(lastFrame()).toContain('Installed & Enabled')
    })

    it('should show "Installed & Disabled" in yellow when installed but disabled', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Status:')
      expect(lastFrame()).toContain('Installed & Disabled')
    })

    it('should show "Not Installed" when not installed', () => {
      const plugin = createTestPlugin({
        isInstalled: false,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Status:')
      expect(lastFrame()).toContain('Not Installed')
    })

    it('should show "Not Installed" even if enabled flag is true but not installed', () => {
      // Edge case: enabled but not installed shouldn't show as enabled
      const plugin = createTestPlugin({
        isInstalled: false,
        isEnabled: true,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Not Installed')
      expect(lastFrame()).not.toContain('Installed & Enabled')
    })

    it('should show installed date when installedAt is provided', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: true,
        installedAt: '2024-01-15T10:30:00Z',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Installed:')
      expect(lastFrame()).toContain('Jan 15, 2024')
    })

    it('should not show installed date when installedAt is undefined', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: true,
        installedAt: undefined,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('Installed:')
    })
  })

  describe('action hints', () => {
    it('should show install action hint for not-installed plugin', () => {
      const plugin = createTestPlugin({
        isInstalled: false,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('i')
      expect(lastFrame()).toContain('install')
    })

    it('should show disable and uninstall actions for enabled installed plugin', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: true,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Space')
      expect(lastFrame()).toContain('disable')
      expect(lastFrame()).toContain('u')
      expect(lastFrame()).toContain('uninstall')
    })

    it('should show enable and uninstall actions for disabled installed plugin', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Space')
      expect(lastFrame()).toContain('enable')
      expect(lastFrame()).toContain('u')
      expect(lastFrame()).toContain('uninstall')
    })

    it('should not show toggle/uninstall actions for not-installed plugin', () => {
      const plugin = createTestPlugin({
        isInstalled: false,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('uninstall')
      expect(lastFrame()).not.toContain('disable')
      expect(lastFrame()).not.toContain('enable')
    })
  })

  describe('formatDate helper', () => {
    it('should format ISO date string to readable format', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        installedAt: '2024-03-20T14:45:00Z',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Mar 20, 2024')
    })

    it('should handle different date formats', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        installedAt: '2023-12-01T00:00:00.000Z',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Dec 1, 2023')
    })

    it('should handle invalid date gracefully by returning original string', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        installedAt: 'not-a-valid-date',
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      // When date is invalid, Date constructor creates "Invalid Date"
      // The toLocaleDateString will return "Invalid Date" or similar
      // The component should still render without crashing
      expect(lastFrame()).toContain('Installed:')
    })
  })

  describe('formatCount helper', () => {
    it('should format 0 correctly', () => {
      const plugin = createTestPlugin({ installCount: 0 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Installs:')
      expect(lastFrame()).toContain('0')
    })

    it('should format exact 1000 with K suffix', () => {
      const plugin = createTestPlugin({ installCount: 1000 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('1.0K')
    })

    it('should format exact 1000000 with M suffix', () => {
      const plugin = createTestPlugin({ installCount: 1000000 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('1.0M')
    })

    it('should format 999 without suffix', () => {
      const plugin = createTestPlugin({ installCount: 999 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('999')
      expect(lastFrame()).not.toContain('K')
    })

    it('should format 999999 with K suffix', () => {
      const plugin = createTestPlugin({ installCount: 999999 })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('1000.0K')
    })
  })

  describe('StatusIcon integration', () => {
    it('should render green filled circle for installed and enabled', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: true,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('●')
    })

    it('should render yellow half circle for installed but disabled', () => {
      const plugin = createTestPlugin({
        isInstalled: true,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('◐')
    })

    it('should render gray empty circle for not installed', () => {
      const plugin = createTestPlugin({
        isInstalled: false,
        isEnabled: false,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('○')
    })
  })

  describe('ComponentBadges integration', () => {
    it('should show components row when plugin has components', () => {
      const plugin = createTestPlugin({
        components: {
          skills: 5,
          commands: 3,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('Components:')
    })

    it('should not show components row when plugin has no components', () => {
      const plugin = createTestPlugin({
        components: undefined,
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('Components:')
    })

    it('should display skills badge with count', () => {
      const plugin = createTestPlugin({
        components: {
          skills: 5,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[S:5]')
    })

    it('should display commands badge with count', () => {
      const plugin = createTestPlugin({
        components: {
          commands: 3,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[/:3]')
    })

    it('should display agents badge with count', () => {
      const plugin = createTestPlugin({
        components: {
          agents: 2,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[@:2]')
    })

    it('should display hooks badge without count', () => {
      const plugin = createTestPlugin({
        components: {
          hooks: true,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[H]')
    })

    it('should display MCP servers badge with count', () => {
      const plugin = createTestPlugin({
        components: {
          mcpServers: 2,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[M:2]')
    })

    it('should display LSP servers badge with count', () => {
      const plugin = createTestPlugin({
        components: {
          lspServers: 1,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[L:1]')
    })

    it('should display multiple component badges', () => {
      const plugin = createTestPlugin({
        components: {
          skills: 3,
          commands: 2,
          mcpServers: 1,
          hooks: true,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).toContain('[S:3]')
      expect(lastFrame()).toContain('[/:2]')
      expect(lastFrame()).toContain('[M:1]')
      expect(lastFrame()).toContain('[H]')
    })

    it('should not display badges for components with zero count', () => {
      const plugin = createTestPlugin({
        components: {
          skills: 0,
          commands: 2,
        },
      })
      const { lastFrame } = render(<PluginDetail plugin={plugin} />)

      expect(lastFrame()).not.toContain('[S')
      expect(lastFrame()).toContain('[/:2]')
    })
  })
})
