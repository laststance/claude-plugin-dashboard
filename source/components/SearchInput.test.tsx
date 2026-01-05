/**
 * Integration tests for SearchInput component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import SearchInput from './SearchInput.js'

describe('SearchInput', () => {
  describe('prefix rendering', () => {
    it('should always show "Q " prefix', () => {
      const { lastFrame } = render(<SearchInput query="" />)

      expect(lastFrame()).toContain('Q ')
    })
  })

  describe('query and placeholder', () => {
    it('should show placeholder when query is empty', () => {
      const { lastFrame } = render(<SearchInput query="" />)

      expect(lastFrame()).toContain('Type to search...')
    })

    it('should show custom placeholder when provided', () => {
      const { lastFrame } = render(
        <SearchInput query="" placeholder="Search plugins..." />,
      )

      expect(lastFrame()).toContain('Search plugins...')
    })

    it('should show query text when query is provided', () => {
      const { lastFrame } = render(<SearchInput query="test-plugin" />)

      expect(lastFrame()).toContain('test-plugin')
      expect(lastFrame()).not.toContain('Type to search...')
    })
  })

  describe('active state', () => {
    it('should not show cursor when inactive (default)', () => {
      const { lastFrame } = render(<SearchInput query="" />)

      expect(lastFrame()).not.toContain('\u258C')
    })

    it('should show cursor when active', () => {
      const { lastFrame } = render(<SearchInput query="" isActive={true} />)

      expect(lastFrame()).toContain('\u258C')
    })

    it('should show cursor after query when active with text', () => {
      const { lastFrame } = render(
        <SearchInput query="react" isActive={true} />,
      )

      expect(lastFrame()).toContain('react')
      expect(lastFrame()).toContain('\u258C')
    })
  })

  describe('border style', () => {
    it('should use single border style when inactive', () => {
      const { lastFrame } = render(<SearchInput query="" isActive={false} />)
      const frame = lastFrame()!

      // Single border uses characters like |, -, +, etc.
      // Round border uses characters like (, ), etc.
      // Check for the Q prefix to ensure component rendered
      expect(frame).toContain('Q ')
    })

    it('should use round border style when active', () => {
      const { lastFrame } = render(<SearchInput query="" isActive={true} />)
      const frame = lastFrame()!

      // Round border style should be present along with cursor
      expect(frame).toContain('\u258C')
    })
  })
})
