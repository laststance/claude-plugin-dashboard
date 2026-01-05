/**
 * Integration tests for SortDropdown component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import SortDropdown, { getNextSort } from './SortDropdown.js'

describe('SortDropdown', () => {
  describe('label rendering', () => {
    it('should show "Sort:" prefix', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="installs" sortOrder="desc" />,
      )

      expect(lastFrame()).toContain('Sort:')
    })

    it('should show "Installs" label when sortBy is installs', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="installs" sortOrder="desc" />,
      )

      expect(lastFrame()).toContain('Installs')
    })

    it('should show "Name" label when sortBy is name', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="name" sortOrder="desc" />,
      )

      expect(lastFrame()).toContain('Name')
    })

    it('should show "Date" label when sortBy is date', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="date" sortOrder="desc" />,
      )

      expect(lastFrame()).toContain('Date')
    })
  })

  describe('sort order arrow', () => {
    it('should show down arrow when sortOrder is desc', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="installs" sortOrder="desc" />,
      )

      expect(lastFrame()).toContain('\u25BC')
    })

    it('should show up arrow when sortOrder is asc', () => {
      const { lastFrame } = render(
        <SortDropdown sortBy="installs" sortOrder="asc" />,
      )

      expect(lastFrame()).toContain('\u25B2')
    })
  })

  describe('all combinations', () => {
    const sortOptions = ['installs', 'name', 'date'] as const
    const orderOptions = ['asc', 'desc'] as const
    const expectedLabels = {
      installs: 'Installs',
      name: 'Name',
      date: 'Date',
    }
    const expectedArrows = {
      asc: '\u25B2',
      desc: '\u25BC',
    }

    for (const sortBy of sortOptions) {
      for (const sortOrder of orderOptions) {
        it(`should render ${expectedLabels[sortBy]} with ${sortOrder === 'desc' ? 'down' : 'up'} arrow for sortBy=${sortBy}, sortOrder=${sortOrder}`, () => {
          const { lastFrame } = render(
            <SortDropdown sortBy={sortBy} sortOrder={sortOrder} />,
          )
          const frame = lastFrame()!

          expect(frame).toContain('Sort:')
          expect(frame).toContain(expectedLabels[sortBy])
          expect(frame).toContain(expectedArrows[sortOrder])
        })
      }
    }
  })
})

describe('getNextSort', () => {
  it('should return name after installs', () => {
    expect(getNextSort('installs')).toBe('name')
  })

  it('should return date after name', () => {
    expect(getNextSort('name')).toBe('date')
  })

  it('should return installs after date (cycle back)', () => {
    expect(getNextSort('date')).toBe('installs')
  })

  it('should cycle through all options correctly', () => {
    let current: 'installs' | 'name' | 'date' = 'installs'

    current = getNextSort(current)
    expect(current).toBe('name')

    current = getNextSort(current)
    expect(current).toBe('date')

    current = getNextSort(current)
    expect(current).toBe('installs')
  })
})
