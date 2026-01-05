/**
 * Integration tests for PluginList component
 * Uses ink-testing-library to verify component rendering
 */

import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import PluginList, { truncate, formatCount } from './PluginList.js'
import type { Plugin } from '../types/index.js'

/**
 * Mock plugins for testing
 */
const mockPlugins: Plugin[] = [
  {
    id: 'plugin1@market',
    name: 'Plugin One',
    marketplace: 'market',
    description: 'Desc',
    version: '1.0',
    installCount: 1500,
    isInstalled: true,
    isEnabled: true,
  },
  {
    id: 'plugin2@market',
    name: 'Plugin Two',
    marketplace: 'market',
    description: 'Desc',
    version: '1.0',
    installCount: 50,
    isInstalled: false,
    isEnabled: false,
  },
]

describe('PluginList', () => {
  describe('Empty state', () => {
    it('should display "No plugins found" when plugins array is empty', () => {
      const { lastFrame } = render(
        <PluginList plugins={[]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('No plugins found')
    })
  })

  describe('Plugin rendering', () => {
    it('should render plugin names', () => {
      const { lastFrame } = render(
        <PluginList plugins={mockPlugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Plugin One')
      expect(lastFrame()).toContain('Plugin Two')
    })

    it('should render marketplace names', () => {
      const { lastFrame } = render(
        <PluginList plugins={mockPlugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('market')
    })

    it('should render install count with K suffix for thousands', () => {
      const { lastFrame } = render(
        <PluginList plugins={mockPlugins} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('1.5K installs')
    })

    it('should not render install count indicator for zero installs', () => {
      const pluginsWithZeroInstalls: Plugin[] = [
        {
          id: 'plugin-zero@market',
          name: 'Plugin Zero',
          marketplace: 'market',
          description: 'Desc',
          version: '1.0',
          installCount: 0,
          isInstalled: false,
          isEnabled: false,
        },
      ]

      const { lastFrame } = render(
        <PluginList plugins={pluginsWithZeroInstalls} selectedIndex={0} />,
      )

      expect(lastFrame()).not.toContain('installs')
    })
  })

  describe('Selection indicator', () => {
    it('should show ">" for selected item at index 0', () => {
      const { lastFrame } = render(
        <PluginList plugins={mockPlugins} selectedIndex={0} />,
      )

      const frame = lastFrame() ?? ''
      // The selected item should have the ">" indicator
      expect(frame).toContain('>')
    })

    it('should highlight correct plugin based on selectedIndex', () => {
      const { lastFrame } = render(
        <PluginList plugins={mockPlugins} selectedIndex={1} />,
      )

      // The frame should contain both plugins
      const frame = lastFrame() ?? ''
      expect(frame).toContain('Plugin One')
      expect(frame).toContain('Plugin Two')
    })
  })

  describe('Virtual scrolling', () => {
    it('should show scroll indicators when items exceed visibleCount', () => {
      // Create many plugins to trigger scrolling
      const manyPlugins: Plugin[] = Array.from({ length: 20 }, (_, i) => ({
        id: `plugin${i}@market`,
        name: `Plugin ${i}`,
        marketplace: 'market',
        description: 'Description',
        version: '1.0',
        installCount: 0,
        isInstalled: false,
        isEnabled: false,
      }))

      // Select an item in the middle to show both scroll indicators
      const { lastFrame } = render(
        <PluginList
          plugins={manyPlugins}
          selectedIndex={10}
          visibleCount={5}
        />,
      )

      const frame = lastFrame() ?? ''
      // Should show scroll indicators
      expect(frame).toContain('more above')
      expect(frame).toContain('more below')
    })

    it('should not show scroll indicators when all items fit', () => {
      const { lastFrame } = render(
        <PluginList
          plugins={mockPlugins}
          selectedIndex={0}
          visibleCount={15}
        />,
      )

      const frame = lastFrame() ?? ''
      expect(frame).not.toContain('more above')
      expect(frame).not.toContain('more below')
    })

    it('should show only bottom indicator when at top of long list', () => {
      const manyPlugins: Plugin[] = Array.from({ length: 20 }, (_, i) => ({
        id: `plugin${i}@market`,
        name: `Plugin ${i}`,
        marketplace: 'market',
        description: 'Description',
        version: '1.0',
        installCount: 0,
        isInstalled: false,
        isEnabled: false,
      }))

      const { lastFrame } = render(
        <PluginList plugins={manyPlugins} selectedIndex={0} visibleCount={5} />,
      )

      const frame = lastFrame() ?? ''
      expect(frame).not.toContain('more above')
      expect(frame).toContain('more below')
    })

    it('should show only top indicator when at bottom of long list', () => {
      const manyPlugins: Plugin[] = Array.from({ length: 20 }, (_, i) => ({
        id: `plugin${i}@market`,
        name: `Plugin ${i}`,
        marketplace: 'market',
        description: 'Description',
        version: '1.0',
        installCount: 0,
        isInstalled: false,
        isEnabled: false,
      }))

      const { lastFrame } = render(
        <PluginList
          plugins={manyPlugins}
          selectedIndex={19}
          visibleCount={5}
        />,
      )

      const frame = lastFrame() ?? ''
      expect(frame).toContain('more above')
      expect(frame).not.toContain('more below')
    })
  })
})

describe('Helper functions', () => {
  describe('formatCount', () => {
    it('should return "1.5K" for 1500', () => {
      expect(formatCount(1500)).toBe('1.5K')
    })

    it('should return "1.2M" for 1200000', () => {
      expect(formatCount(1200000)).toBe('1.2M')
    })

    it('should return "1.0K" for exactly 1000', () => {
      expect(formatCount(1000)).toBe('1.0K')
    })

    it('should return "1.0M" for exactly 1000000', () => {
      expect(formatCount(1000000)).toBe('1.0M')
    })

    it('should return "500" for numbers less than 1000', () => {
      expect(formatCount(500)).toBe('500')
    })

    it('should return "0" for zero', () => {
      expect(formatCount(0)).toBe('0')
    })

    it('should return "999" for 999', () => {
      expect(formatCount(999)).toBe('999')
    })
  })

  describe('truncate', () => {
    it('should return original text when within maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should truncate with "..." when exceeding maxLength', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('should return exact maxLength text unchanged', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('')
    })

    it('should truncate correctly when maxLength is 3', () => {
      // maxLength 3 means only "..." fits
      expect(truncate('Hello', 3)).toBe('...')
    })

    it('should handle long text with proper truncation', () => {
      const longText =
        'This is a very long description that should be truncated'
      const result = truncate(longText, 20)
      expect(result).toBe('This is a very lo...')
      expect(result.length).toBe(20)
    })
  })
})
