/**
 * Unit tests for AddMarketplaceDialog component
 */

import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import AddMarketplaceDialog from './AddMarketplaceDialog.js'

describe('AddMarketplaceDialog', () => {
  it('should render with empty value and placeholder', () => {
    const { lastFrame } = render(<AddMarketplaceDialog value="" />)

    expect(lastFrame()).toContain('Add Marketplace')
    expect(lastFrame()).toContain('Enter marketplace source:')
    expect(lastFrame()).toContain('owner/repo')
    expect(lastFrame()).toContain('Supported formats:')
    expect(lastFrame()).toContain('ESC')
    expect(lastFrame()).toContain('Cancel')
    expect(lastFrame()).toContain('Enter')
    expect(lastFrame()).toContain('Add')
  })

  it('should render with input value', () => {
    const { lastFrame } = render(
      <AddMarketplaceDialog value="anthropics/claude-plugins" />,
    )

    expect(lastFrame()).toContain('anthropics/claude-plugins')
    expect(lastFrame()).toContain('▌') // Cursor
  })

  it('should render error message when provided', () => {
    const { lastFrame } = render(
      <AddMarketplaceDialog
        value="invalid"
        error="Invalid marketplace format"
      />,
    )

    expect(lastFrame()).toContain('Invalid marketplace format')
  })

  it('should show all supported format hints', () => {
    const { lastFrame } = render(<AddMarketplaceDialog value="" />)

    expect(lastFrame()).toContain('owner/repo (GitHub)')
    expect(lastFrame()).toContain('https://github.com/org/repo')
    expect(lastFrame()).toContain('./local-path')
  })

  it('should always show cursor indicator', () => {
    const { lastFrame } = render(<AddMarketplaceDialog value="test" />)

    expect(lastFrame()).toContain('▌')
  })

  it('should display action buttons hint', () => {
    const { lastFrame } = render(<AddMarketplaceDialog value="" />)

    expect(lastFrame()).toContain('Cancel')
    expect(lastFrame()).toContain('Add')
  })
})
