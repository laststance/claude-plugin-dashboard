/**
 * Integration tests for ErrorsTab component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import ErrorsTab from './ErrorsTab.js'
import type { PluginError } from '../types/index.js'

/**
 * Creates mock error data for testing
 * @param overrides - Optional partial error to override defaults
 * @returns Complete PluginError object
 */
const createMockError = (
  overrides: Partial<PluginError> = {},
): PluginError => ({
  pluginId: 'test-plugin@test-market',
  type: 'installation',
  message: 'Test error message',
  timestamp: '2024-01-15T10:30:00Z',
  ...overrides,
})

describe('ErrorsTab', () => {
  describe('empty state (no errors)', () => {
    it('should display "Errors (0)" in header when no errors', () => {
      const { lastFrame } = render(<ErrorsTab errors={[]} selectedIndex={0} />)

      expect(lastFrame()).toContain('Errors (0)')
    })

    it('should display green success message when no errors', () => {
      const { lastFrame } = render(<ErrorsTab errors={[]} selectedIndex={0} />)

      expect(lastFrame()).toContain('No errors to display')
    })

    it('should display "All plugins are working correctly" when no errors', () => {
      const { lastFrame } = render(<ErrorsTab errors={[]} selectedIndex={0} />)

      expect(lastFrame()).toContain('All plugins are working correctly')
    })

    it('should display checkmark icon when no errors', () => {
      const { lastFrame } = render(<ErrorsTab errors={[]} selectedIndex={0} />)

      expect(lastFrame()).toContain('✓')
    })
  })

  describe('with errors', () => {
    const mockErrors: PluginError[] = [
      createMockError({
        pluginId: 'plugin-a@market',
        type: 'installation',
        message: 'Failed to install',
        timestamp: '2024-01-15T10:30:00Z',
      }),
      createMockError({
        pluginId: 'plugin-b@market',
        type: 'runtime',
        message: 'Runtime error occurred',
        timestamp: '2024-01-16T14:45:00Z',
      }),
      createMockError({
        pluginId: 'plugin-c@market',
        type: 'config',
        message: 'Configuration invalid',
        timestamp: '2024-01-17T09:00:00Z',
      }),
    ]

    it('should display header with correct selection index (1/3)', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Errors (1/3)')
    })

    it('should display header with correct selection index (2/3)', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={1} />,
      )

      expect(lastFrame()).toContain('Errors (2/3)')
    })

    it('should display header with correct selection index (3/3)', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={2} />,
      )

      expect(lastFrame()).toContain('Errors (3/3)')
    })

    it('should display plugin IDs in error list', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('plugin-a@market')
      expect(lastFrame()).toContain('plugin-b@market')
      expect(lastFrame()).toContain('plugin-c@market')
    })

    it('should display error messages in list', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Failed to install')
      expect(lastFrame()).toContain('Runtime error occurred')
      expect(lastFrame()).toContain('Configuration invalid')
    })

    it('should display X icon for each error', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={0} />,
      )

      // Count occurrences of ✗ - should have at least 3 (one per error)
      const frame = lastFrame() ?? ''
      const xCount = (frame.match(/✗/g) || []).length
      expect(xCount).toBeGreaterThanOrEqual(3)
    })

    it('should display selection indicator (>) for selected item', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={mockErrors} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('>')
    })
  })

  describe('error detail panel', () => {
    const errorWithDetails: PluginError = createMockError({
      pluginId: 'detailed-plugin@market',
      type: 'installation',
      message: 'Installation failed due to network error',
      timestamp: '2024-06-15T14:30:00Z',
      details: 'Connection timeout after 30 seconds',
    })

    it('should display error type in detail panel', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithDetails]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Type:')
      expect(lastFrame()).toContain('installation')
    })

    it('should display "Time:" label in detail panel', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithDetails]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Time:')
    })

    it('should display "Message:" label in detail panel', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithDetails]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Message:')
      expect(lastFrame()).toContain('Installation failed due to network error')
    })

    it('should display "Details:" section when details exist', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithDetails]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Details:')
      expect(lastFrame()).toContain('Connection timeout after 30 seconds')
    })

    it('should not display "Details:" section when details is undefined', () => {
      const errorWithoutDetails = createMockError({
        pluginId: 'no-details@market',
        details: undefined,
      })

      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithoutDetails]} selectedIndex={0} />,
      )

      // Should not contain the Details label (checking it doesn't appear in the frame)
      // Note: lastFrame contains the full output, so we verify by context
      const frame = lastFrame() ?? ''
      // The word "Details:" should not appear since there are no details
      // But "Message:" should appear
      expect(frame).toContain('Message:')
      // This is a bit tricky - we need to verify Details: doesn't show
      // We can check the count of "Details:" in the output
      const detailsMatches = frame.match(/Details:/g)
      expect(detailsMatches).toBeNull()
    })

    it('should display pluginId in detail panel header', () => {
      const { lastFrame } = render(
        <ErrorsTab errors={[errorWithDetails]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('detailed-plugin@market')
    })
  })

  describe('formatDate function', () => {
    // Mock timezone for consistent test results
    let originalToLocaleString: typeof Date.prototype.toLocaleString

    beforeEach(() => {
      originalToLocaleString = Date.prototype.toLocaleString
      // Mock toLocaleString to return consistent format
      Date.prototype.toLocaleString = vi.fn(function (
        this: Date,
        locale?: string,
        options?: Intl.DateTimeFormatOptions,
      ) {
        if (locale === 'en-US' && options) {
          // Return a predictable format for testing
          return 'Jan 15, 2024, 10:30 AM'
        }
        return originalToLocaleString.call(this, locale, options)
      }) as typeof Date.prototype.toLocaleString
    })

    afterEach(() => {
      Date.prototype.toLocaleString = originalToLocaleString
    })

    it('should format valid ISO timestamp correctly', () => {
      const error = createMockError({
        timestamp: '2024-01-15T10:30:00Z',
      })

      const { lastFrame } = render(
        <ErrorsTab errors={[error]} selectedIndex={0} />,
      )

      // The mocked toLocaleString returns 'Jan 15, 2024, 10:30 AM'
      expect(lastFrame()).toContain('Jan 15, 2024, 10:30 AM')
    })

    it('should handle invalid timestamp gracefully', () => {
      // Restore original for this test
      Date.prototype.toLocaleString = originalToLocaleString

      const error = createMockError({
        timestamp: 'invalid-date-string',
      })

      const { lastFrame } = render(
        <ErrorsTab errors={[error]} selectedIndex={0} />,
      )

      // When date parsing fails, formatDate returns the original string
      // However, new Date('invalid-date-string') creates Invalid Date
      // and toLocaleString on Invalid Date returns 'Invalid Date'
      // The component catches this and falls back to the original string
      const frame = lastFrame() ?? ''
      // Should contain Time: label
      expect(frame).toContain('Time:')
    })
  })

  describe('edge cases', () => {
    it('should handle single error correctly', () => {
      const singleError = [createMockError({ pluginId: 'single@market' })]

      const { lastFrame } = render(
        <ErrorsTab errors={singleError} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Errors (1/1)')
      expect(lastFrame()).toContain('single@market')
    })

    it('should handle five errors correctly (1/5)', () => {
      const fiveErrors = [
        createMockError({ pluginId: 'error-1@market' }),
        createMockError({ pluginId: 'error-2@market' }),
        createMockError({ pluginId: 'error-3@market' }),
        createMockError({ pluginId: 'error-4@market' }),
        createMockError({ pluginId: 'error-5@market' }),
      ]

      const { lastFrame } = render(
        <ErrorsTab errors={fiveErrors} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('Errors (1/5)')
    })

    it('should handle different error types', () => {
      const mixedErrors: PluginError[] = [
        createMockError({ type: 'installation', pluginId: 'install@market' }),
        createMockError({ type: 'runtime', pluginId: 'runtime@market' }),
        createMockError({ type: 'config', pluginId: 'config@market' }),
      ]

      const { lastFrame } = render(
        <ErrorsTab errors={mixedErrors} selectedIndex={0} />,
      )

      // First error is selected, so its type should be visible in detail
      expect(lastFrame()).toContain('installation')
    })

    it('should show runtime type when runtime error is selected', () => {
      const mixedErrors: PluginError[] = [
        createMockError({ type: 'installation', pluginId: 'install@market' }),
        createMockError({ type: 'runtime', pluginId: 'runtime@market' }),
      ]

      const { lastFrame } = render(
        <ErrorsTab errors={mixedErrors} selectedIndex={1} />,
      )

      expect(lastFrame()).toContain('runtime')
    })

    it('should show config type when config error is selected', () => {
      const mixedErrors: PluginError[] = [
        createMockError({ type: 'installation', pluginId: 'install@market' }),
        createMockError({ type: 'config', pluginId: 'config@market' }),
      ]

      const { lastFrame } = render(
        <ErrorsTab errors={mixedErrors} selectedIndex={1} />,
      )

      expect(lastFrame()).toContain('config')
    })

    it('should handle very long plugin IDs', () => {
      const longIdError = createMockError({
        pluginId:
          'very-long-plugin-name-that-might-cause-wrapping@extremely-long-marketplace-name',
      })

      const { lastFrame } = render(
        <ErrorsTab errors={[longIdError]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('very-long-plugin-name')
    })

    it('should handle very long error messages', () => {
      const longMessageError = createMockError({
        message:
          'This is a very long error message that contains a lot of detail about what went wrong during the installation process',
      })

      const { lastFrame } = render(
        <ErrorsTab errors={[longMessageError]} selectedIndex={0} />,
      )

      expect(lastFrame()).toContain('This is a very long error message')
    })
  })
})
