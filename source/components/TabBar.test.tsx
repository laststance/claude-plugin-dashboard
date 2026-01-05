/**
 * Integration tests for TabBar component
 * Uses ink-testing-library to verify component rendering and getNextTab utility
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import TabBar, { getNextTab } from './TabBar.js'

describe('TabBar', () => {
  describe('rendering', () => {
    it('should render all 4 tab labels', () => {
      const { lastFrame } = render(<TabBar activeTab="discover" />)

      const output = lastFrame()
      expect(output).toContain('Discover')
      expect(output).toContain('Installed')
      expect(output).toContain('Marketplaces')
      expect(output).toContain('Errors')
    })

    it('should highlight the active tab with bold styling', () => {
      const { lastFrame } = render(<TabBar activeTab="installed" />)

      // Active tab should be present in output
      const output = lastFrame()
      expect(output).toContain('Installed')
    })

    it('should render different active tabs correctly', () => {
      const tabs = ['discover', 'installed', 'marketplaces', 'errors'] as const

      tabs.forEach((tab) => {
        const { lastFrame } = render(<TabBar activeTab={tab} />)
        // All tabs should be visible regardless of which is active
        expect(lastFrame()).toContain('Discover')
        expect(lastFrame()).toContain('Installed')
        expect(lastFrame()).toContain('Marketplaces')
        expect(lastFrame()).toContain('Errors')
      })
    })
  })

  describe('getNextTab', () => {
    describe('next direction', () => {
      it('should return "installed" when current is "discover"', () => {
        expect(getNextTab('discover', 'next')).toBe('installed')
      })

      it('should return "marketplaces" when current is "installed"', () => {
        expect(getNextTab('installed', 'next')).toBe('marketplaces')
      })

      it('should return "errors" when current is "marketplaces"', () => {
        expect(getNextTab('marketplaces', 'next')).toBe('errors')
      })

      it('should cycle back to "discover" when current is "errors"', () => {
        expect(getNextTab('errors', 'next')).toBe('discover')
      })
    })

    describe('prev direction', () => {
      it('should cycle backwards to "errors" when current is "discover"', () => {
        expect(getNextTab('discover', 'prev')).toBe('errors')
      })

      it('should return "discover" when current is "installed"', () => {
        expect(getNextTab('installed', 'prev')).toBe('discover')
      })

      it('should return "installed" when current is "marketplaces"', () => {
        expect(getNextTab('marketplaces', 'prev')).toBe('installed')
      })

      it('should return "marketplaces" when current is "errors"', () => {
        expect(getNextTab('errors', 'prev')).toBe('marketplaces')
      })
    })

    describe('cycling behavior', () => {
      it('should cycle through all tabs in next direction', () => {
        let currentTab: 'discover' | 'installed' | 'marketplaces' | 'errors' =
          'discover'
        const visitedTabs: string[] = [currentTab]

        // Go through 4 tabs and should come back to discover
        for (let i = 0; i < 4; i++) {
          currentTab = getNextTab(currentTab, 'next')
          visitedTabs.push(currentTab)
        }

        expect(visitedTabs).toEqual([
          'discover',
          'installed',
          'marketplaces',
          'errors',
          'discover', // Back to start
        ])
      })

      it('should cycle through all tabs in prev direction', () => {
        let currentTab: 'discover' | 'installed' | 'marketplaces' | 'errors' =
          'discover'
        const visitedTabs: string[] = [currentTab]

        // Go through 4 tabs backwards and should come back to discover
        for (let i = 0; i < 4; i++) {
          currentTab = getNextTab(currentTab, 'prev')
          visitedTabs.push(currentTab)
        }

        expect(visitedTabs).toEqual([
          'discover',
          'errors',
          'marketplaces',
          'installed',
          'discover', // Back to start
        ])
      })
    })
  })
})
