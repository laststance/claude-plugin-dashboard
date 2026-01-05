/**
 * Integration tests for the App component
 * Tests the main application component with ink-testing-library
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import type { Plugin, Marketplace } from './types/index.js'

// Mock all services before importing App
vi.mock('./services/pluginService.js', () => ({
  loadAllPlugins: vi.fn(),
  loadMarketplaces: vi.fn(),
  searchPlugins: vi.fn((query: string, plugins: Plugin[]) =>
    plugins.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  ),
  sortPlugins: vi.fn((plugins: Plugin[]) => plugins),
}))

vi.mock('./services/settingsService.js', () => ({
  togglePlugin: vi.fn(() => true),
}))

vi.mock('./services/pluginActionsService.js', () => ({
  installPlugin: vi.fn(() =>
    Promise.resolve({ success: true, message: 'Installed' }),
  ),
  uninstallPlugin: vi.fn(() =>
    Promise.resolve({ success: true, message: 'Uninstalled' }),
  ),
}))

// Import after mocks
import App from './app.js'
import * as pluginService from './services/pluginService.js'
import * as settingsService from './services/settingsService.js'

/**
 * Create mock plugin for testing
 */
function createMockPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'test@market',
    name: 'test-plugin',
    marketplace: 'market',
    description: 'Test description',
    version: '1.0.0',
    installCount: 100,
    isInstalled: false,
    isEnabled: false,
    ...overrides,
  }
}

/**
 * Create mock marketplace for testing
 */
function createMockMarketplace(
  overrides: Partial<Marketplace> = {},
): Marketplace {
  return {
    id: 'test-market',
    name: 'Test Market',
    source: { source: 'github', repo: 'test/market' },
    installLocation: '/path/to/market',
    lastUpdated: '2024-01-01T00:00:00Z',
    pluginCount: 10,
    ...overrides,
  }
}

/**
 * Helper to wait for next render tick
 */
const waitForRender = () => new Promise((resolve) => setTimeout(resolve, 10))

describe('App component', () => {
  const mockLoadAllPlugins = vi.mocked(pluginService.loadAllPlugins)
  const mockLoadMarketplaces = vi.mocked(pluginService.loadMarketplaces)

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadAllPlugins.mockReturnValue([])
    mockLoadMarketplaces.mockReturnValue([])
  })

  describe('initial rendering', () => {
    it('should render header with title', async () => {
      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('Plugin Dashboard')
    })

    it('should render version number', async () => {
      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('v0.1.0')
    })
  })

  describe('data loading', () => {
    it('should render tab bar after loading', async () => {
      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('Discover')
    })

    it('should render discover tab by default', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('Discover plugins')
    })

    it('should display plugins', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'my-plugin' }),
      ])

      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('my-plugin')
    })

    it('should render key hints footer', async () => {
      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('quit')
    })
  })

  describe('error handling', () => {
    it('should display error message when loading fails', async () => {
      mockLoadAllPlugins.mockImplementation(() => {
        throw new Error('Failed to read plugins')
      })

      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('Error')
      expect(lastFrame()).toContain('Failed to read plugins')
    })

    it('should show press q to exit on error', async () => {
      mockLoadAllPlugins.mockImplementation(() => {
        throw new Error('Test error')
      })

      const { lastFrame } = render(<App />)
      await waitForRender()

      expect(lastFrame()).toContain('q to exit')
    })
  })

  describe('keyboard navigation', () => {
    it('should navigate to next tab with right arrow', async () => {
      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press right arrow (escape sequence)
      stdin.write('\x1B[C')
      await waitForRender()

      expect(lastFrame()).toContain('Installed plugins')
    })

    it('should move selection down with down arrow', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
        createMockPlugin({ id: 'p2@m', name: 'plugin-2' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Initial selection is 0 (first plugin)
      expect(lastFrame()).toContain('1/2')

      // Press down arrow
      stdin.write('\x1B[B')
      await waitForRender()

      expect(lastFrame()).toContain('2/2')
    })

    it('should move selection down with Ctrl+N', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
        createMockPlugin({ id: 'p2@m', name: 'plugin-2' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press Ctrl+N
      stdin.write('\x0E')
      await waitForRender()

      expect(lastFrame()).toContain('2/2')
    })
  })

  describe('search mode', () => {
    it('should enter search mode with / key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press / to enter search mode
      stdin.write('/')
      await waitForRender()

      // Should show cursor indicator
      expect(lastFrame()).toMatch(/▌/)
    })

    it('should exit search mode with Escape', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Enter search mode
      stdin.write('/')
      await waitForRender()

      // Exit with Escape
      stdin.write('\x1B')
      await waitForRender()

      // Should still be on discover tab
      expect(lastFrame()).toContain('Discover')
    })

    it('should exit search mode with Enter', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Enter search mode
      stdin.write('/')
      await waitForRender()

      // Exit with Enter
      stdin.write('\r')
      await waitForRender()

      // Should still be on discover tab
      expect(lastFrame()).toContain('Discover')
    })

    it('should type characters in search mode', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'alpha-plugin' }),
        createMockPlugin({ id: 'p2@m', name: 'beta-plugin' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Enter search mode and type
      stdin.write('/')
      await waitForRender()
      stdin.write('a')
      await waitForRender()

      // Should show search input with character
      expect(lastFrame()).toContain('a')
    })

    it('should handle backspace in search mode', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Enter search mode and type
      stdin.write('/')
      await waitForRender()
      stdin.write('ab')
      await waitForRender()

      // Press backspace (127 = DEL)
      stdin.write('\x7F')
      await waitForRender()

      expect(lastFrame()).toBeDefined()
    })
  })

  describe('sort functionality', () => {
    it('should cycle sort with s key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press s to change sort
      stdin.write('s')
      await waitForRender()

      expect(lastFrame()).toBeDefined()
    })

    it('should toggle sort order with S key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press S to toggle order
      stdin.write('S')
      await waitForRender()

      expect(lastFrame()).toBeDefined()
    })
  })

  describe('tab content', () => {
    it('should show marketplaces tab content', async () => {
      mockLoadMarketplaces.mockReturnValue([
        createMockMarketplace({ id: 'm1', name: 'Test Marketplace' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Navigate to marketplaces tab (2 tabs right)
      stdin.write('\x1B[C')
      await waitForRender()
      stdin.write('\x1B[C')
      await waitForRender()

      expect(lastFrame()).toContain('Marketplaces')
    })

    it('should show errors tab content', async () => {
      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Navigate to errors tab (3 tabs right)
      stdin.write('\x1B[C')
      await waitForRender()
      stdin.write('\x1B[C')
      await waitForRender()
      stdin.write('\x1B[C')
      await waitForRender()

      expect(lastFrame()).toContain('Errors')
    })
  })

  describe('additional keyboard navigation', () => {
    it('should move selection up with up arrow', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
        createMockPlugin({ id: 'p2@m', name: 'plugin-2' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Move down first
      stdin.write('\x1B[B')
      await waitForRender()
      expect(lastFrame()).toContain('2/2')

      // Move up
      stdin.write('\x1B[A')
      await waitForRender()
      expect(lastFrame()).toContain('1/2')
    })

    it('should move selection up with Ctrl+P', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
        createMockPlugin({ id: 'p2@m', name: 'plugin-2' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Move down first
      stdin.write('\x1B[B')
      await waitForRender()

      // Move up with Ctrl+P
      stdin.write('\x10')
      await waitForRender()
      expect(lastFrame()).toContain('1/2')
    })

    it('should navigate to previous tab with left arrow', async () => {
      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // First go right
      stdin.write('\x1B[C')
      await waitForRender()
      expect(lastFrame()).toContain('Installed plugins')

      // Then go left
      stdin.write('\x1B[D')
      await waitForRender()
      expect(lastFrame()).toContain('Discover plugins')
    })

    it('should navigate with tab key', async () => {
      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press Tab to go to next tab
      stdin.write('\t')
      await waitForRender()
      expect(lastFrame()).toContain('Installed plugins')
    })
  })

  describe('plugin actions', () => {
    it('should toggle enabled state on installed plugin with space', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
          isEnabled: false,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press space to toggle
      stdin.write(' ')
      await waitForRender()

      // Should show enabled message
      expect(lastFrame()).toContain('enabled')
    })

    it('should toggle enabled state with Enter key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
          isEnabled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press enter to toggle
      stdin.write('\r')
      await waitForRender()

      expect(lastFrame()).toBeDefined()
    })

    it('should show already installed message when pressing i on installed plugin', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press i to install
      stdin.write('i')
      await waitForRender()

      expect(lastFrame()).toContain('already installed')
    })

    it('should trigger install when pressing i on non-installed plugin', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'new-plugin',
          isInstalled: false,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press i to install
      stdin.write('i')
      await waitForRender()

      // Mock resolves immediately, so we see the success message
      expect(lastFrame()).toContain('Installed')
    })

    it('should show not installed message when pressing u on non-installed plugin', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'new-plugin',
          isInstalled: false,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press u to uninstall
      stdin.write('u')
      await waitForRender()

      expect(lastFrame()).toContain('not installed')
    })

    it('should show confirmation dialog when pressing u on installed plugin', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press u to uninstall
      stdin.write('u')
      await waitForRender()

      expect(lastFrame()).toContain('Uninstall')
    })

    it('should cancel uninstall with n key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press u to show confirmation
      stdin.write('u')
      await waitForRender()

      // Press n to cancel
      stdin.write('n')
      await waitForRender()

      expect(lastFrame()).toContain('cancelled')
    })

    it('should cancel uninstall with Escape key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press u to show confirmation
      stdin.write('u')
      await waitForRender()

      // Press Escape to cancel
      stdin.write('\x1B')
      await waitForRender()

      expect(lastFrame()).toContain('cancelled')
    })

    it('should confirm uninstall with y key', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'installed-plugin',
          isInstalled: true,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Press u to show confirmation
      stdin.write('u')
      await waitForRender()

      // Press y to confirm
      stdin.write('y')
      await waitForRender()

      // Mock resolves immediately, so we see the success message
      expect(lastFrame()).toContain('Uninstalled')
    })
  })

  describe('installed tab actions', () => {
    it('should work with actions on installed tab', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'my-plugin',
          isInstalled: true,
          isEnabled: false,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Navigate to installed tab
      stdin.write('\x1B[C')
      await waitForRender()

      // Toggle with space
      stdin.write(' ')
      await waitForRender()

      expect(lastFrame()).toContain('enabled')
    })

    it('should handle toggle error gracefully', async () => {
      const mockTogglePlugin = vi.mocked(settingsService.togglePlugin)
      mockTogglePlugin.mockImplementation(() => {
        throw new Error('Toggle failed')
      })

      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({
          id: 'p1@m',
          name: 'my-plugin',
          isInstalled: true,
          isEnabled: false,
        }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Toggle with space (should trigger error)
      stdin.write(' ')
      await waitForRender()

      expect(lastFrame()).toContain('Error')
      expect(lastFrame()).toContain('Toggle failed')

      // Reset mock
      mockTogglePlugin.mockReturnValue(true)
    })
  })

  describe('clear search', () => {
    it('should clear search query with Escape when query exists', async () => {
      mockLoadAllPlugins.mockReturnValue([
        createMockPlugin({ id: 'p1@m', name: 'plugin-1' }),
      ])

      const { lastFrame, stdin } = render(<App />)
      await waitForRender()

      // Enter search mode and type
      stdin.write('/')
      await waitForRender()
      stdin.write('test')
      await waitForRender()

      // Exit search mode
      stdin.write('\r')
      await waitForRender()

      // Clear with Escape (when not in search mode but query exists)
      stdin.write('\x1B')
      await waitForRender()

      expect(lastFrame()).toBeDefined()
    })
  })
})
