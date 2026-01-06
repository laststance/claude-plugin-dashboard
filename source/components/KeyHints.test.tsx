/**
 * Integration tests for KeyHints component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import KeyHints from './KeyHints.js'

describe('KeyHints', () => {
  describe('base hints (list zone default)', () => {
    it('should render tab navigation hint', () => {
      const { lastFrame } = render(<KeyHints />)

      // Default focusZone is 'list', which shows 'Tab' and 'next tab'
      expect(lastFrame()).toContain('Tab')
      expect(lastFrame()).toContain('next tab')
    })

    it('should render navigate hint', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('navigate')
    })

    it('should render toggle hint', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('Space')
      expect(lastFrame()).toContain('toggle')
    })

    it('should render search hint', () => {
      const { lastFrame } = render(<KeyHints />)

      // In list zone, search hint shows as '↑(top)' action
      expect(lastFrame()).toContain('↑(top)')
      expect(lastFrame()).toContain('search')
    })

    it('should render quit hint with Ctrl+C', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('q')
      expect(lastFrame()).toContain('^C')
      expect(lastFrame()).toContain('quit')
    })

    it('should render help hint', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('h')
      expect(lastFrame()).toContain('help')
    })
  })

  describe('focus zone-specific hints', () => {
    it('should show tabbar hints when focusZone is tabbar', () => {
      const { lastFrame } = render(<KeyHints focusZone="tabbar" />)

      expect(lastFrame()).toContain('←/→')
      expect(lastFrame()).toContain('switch tabs')
    })

    it('should show search hints when focusZone is search', () => {
      const { lastFrame } = render(<KeyHints focusZone="search" />)

      expect(lastFrame()).toContain('↑')
      expect(lastFrame()).toContain('tabs')
      expect(lastFrame()).toContain('ESC')
      expect(lastFrame()).toContain('clear/exit')
    })

    it('should show list hints when focusZone is list', () => {
      const { lastFrame } = render(<KeyHints focusZone="list" />)

      expect(lastFrame()).toContain('↑/↓')
      expect(lastFrame()).toContain('navigate')
      expect(lastFrame()).toContain('↑(top)')
      expect(lastFrame()).toContain('search')
    })

    it('should show help hint in all focus zones', () => {
      // Test all three focus zones show help hint
      const zones: Array<'tabbar' | 'search' | 'list'> = [
        'tabbar',
        'search',
        'list',
      ]

      for (const zone of zones) {
        const { lastFrame } = render(<KeyHints focusZone={zone} />)
        expect(lastFrame()).toContain('help')
      }
    })
  })

  describe('extra hints', () => {
    it('should render extra hints when provided', () => {
      const extraHints = [{ key: 'i', action: 'install' }]
      const { lastFrame } = render(<KeyHints extraHints={extraHints} />)

      expect(lastFrame()).toContain('i')
      expect(lastFrame()).toContain('install')
    })

    it('should render multiple extra hints', () => {
      const extraHints = [
        { key: 'i', action: 'install' },
        { key: 'u', action: 'uninstall' },
      ]
      const { lastFrame } = render(<KeyHints extraHints={extraHints} />)

      expect(lastFrame()).toContain('install')
      expect(lastFrame()).toContain('uninstall')
    })

    it('should render base hints alongside extra hints', () => {
      const extraHints = [{ key: 'Enter', action: 'confirm' }]
      const { lastFrame } = render(<KeyHints extraHints={extraHints} />)

      // Base hints should still be present
      expect(lastFrame()).toContain('quit')
      expect(lastFrame()).toContain('search')
      // Extra hint should also be present
      expect(lastFrame()).toContain('confirm')
    })

    it('should not render extra hints when not provided', () => {
      const { lastFrame } = render(<KeyHints />)

      // Should not contain install-specific hints
      expect(lastFrame()).not.toContain('install')
    })
  })
})
