/**
 * Integration tests for KeyHints component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import KeyHints from './KeyHints.js'

describe('KeyHints', () => {
  describe('base hints', () => {
    it('should render tab navigation hint', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('tabs')
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

      expect(lastFrame()).toContain('/')
      expect(lastFrame()).toContain('search')
    })

    it('should render quit hint with Ctrl+C', () => {
      const { lastFrame } = render(<KeyHints />)

      expect(lastFrame()).toContain('q')
      expect(lastFrame()).toContain('^C')
      expect(lastFrame()).toContain('quit')
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
