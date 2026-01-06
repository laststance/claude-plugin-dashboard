/**
 * Integration tests for HelpOverlay component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import HelpOverlay from './HelpOverlay.js'

describe('HelpOverlay', () => {
  describe('visibility', () => {
    it('should not render when isVisible is false', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={false} />)

      expect(lastFrame()).toBe('')
    })

    it('should render when isVisible is true', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Help')
    })
  })

  describe('navigation section', () => {
    it('should display tab navigation shortcuts', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Switch tabs')
      expect(lastFrame()).toContain('Tab')
    })

    it('should display list navigation shortcuts', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Navigate list')
    })

    it('should display Emacs-style navigation', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('^F')
      expect(lastFrame()).toContain('^B')
      expect(lastFrame()).toContain('Emacs')
    })
  })

  describe('actions section', () => {
    it('should display install/toggle shortcut', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Install')
      expect(lastFrame()).toContain('Enter')
    })

    it('should display uninstall shortcut', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Uninstall')
    })

    it('should display toggle shortcut', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Toggle')
      expect(lastFrame()).toContain('Space')
    })

    it('should display sort shortcuts', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Sort')
    })
  })

  describe('search section', () => {
    it('should display search mode activation', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Enter search mode')
      expect(lastFrame()).toContain('/')
    })

    it('should display search exit shortcuts', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Exit search mode')
      expect(lastFrame()).toContain('Esc')
    })
  })

  describe('general section', () => {
    it('should display quit shortcuts', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Quit')
      expect(lastFrame()).toContain('^C')
    })

    it('should display help toggle shortcut', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Toggle this help')
    })
  })

  describe('close hint', () => {
    it('should display close instructions', () => {
      const { lastFrame } = render(<HelpOverlay isVisible={true} />)

      expect(lastFrame()).toContain('Press h or Esc to close')
    })
  })
})
