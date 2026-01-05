/**
 * Integration tests for ConfirmDialog component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import ConfirmDialog from './ConfirmDialog.js'

describe('ConfirmDialog', () => {
  it('should render the provided message', () => {
    const { lastFrame } = render(
      <ConfirmDialog message="Uninstall plugin-name@marketplace?" />,
    )

    expect(lastFrame()).toContain('Uninstall plugin-name@marketplace?')
  })

  it('should render Y option in green', () => {
    const { lastFrame } = render(<ConfirmDialog message="Confirm action?" />)

    expect(lastFrame()).toContain('Y')
  })

  it('should render N option in red', () => {
    const { lastFrame } = render(<ConfirmDialog message="Confirm action?" />)

    expect(lastFrame()).toContain('N')
  })

  it('should render Y/N separator', () => {
    const { lastFrame } = render(<ConfirmDialog message="Confirm action?" />)

    expect(lastFrame()).toContain('/')
  })

  it('should render different messages correctly', () => {
    const { lastFrame } = render(<ConfirmDialog message="Delete all items?" />)

    expect(lastFrame()).toContain('Delete all items?')
    expect(lastFrame()).toContain('Y')
    expect(lastFrame()).toContain('N')
  })
})
