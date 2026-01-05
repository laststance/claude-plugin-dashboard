/**
 * Integration tests for StatusIcon component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import StatusIcon from './StatusIcon.js'

describe('StatusIcon', () => {
  it('should render green filled circle when installed and enabled', () => {
    const { lastFrame } = render(
      <StatusIcon isInstalled={true} isEnabled={true} />,
    )

    expect(lastFrame()).toContain('●')
  })

  it('should render yellow half circle when installed but disabled', () => {
    const { lastFrame } = render(
      <StatusIcon isInstalled={true} isEnabled={false} />,
    )

    expect(lastFrame()).toContain('◐')
  })

  it('should render gray empty circle when not installed', () => {
    const { lastFrame } = render(
      <StatusIcon isInstalled={false} isEnabled={false} />,
    )

    expect(lastFrame()).toContain('○')
  })

  it('should render gray empty circle when not installed even if enabled flag is true', () => {
    // Edge case: enabled but not installed shouldn't show as enabled
    const { lastFrame } = render(
      <StatusIcon isInstalled={false} isEnabled={true} />,
    )

    expect(lastFrame()).toContain('○')
  })
})
