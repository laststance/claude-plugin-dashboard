/**
 * Unit tests for pluginActionsService
 * Tests installPlugin and uninstallPlugin functions which spawn subprocess
 */

import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import { installPlugin, uninstallPlugin } from './pluginActionsService.js'

vi.mock('node:child_process')

/**
 * Creates a mock child process with stdout/stderr EventEmitters
 * @returns Mock child process object
 */
function createMockChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
  }
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  return child
}

describe('pluginActionsService', () => {
  let mockSpawn: Mock
  let mockChild: ReturnType<typeof createMockChild>

  beforeEach(() => {
    mockChild = createMockChild()
    mockSpawn = spawn as Mock
    mockSpawn.mockReturnValue(mockChild)
  })

  describe('installPlugin', () => {
    it('should return success on exit code 0', async () => {
      const pluginId = 'context7@claude-plugins-official'
      const promise = installPlugin(pluginId)

      // Simulate successful execution
      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'install', pluginId],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Installed ${pluginId}`,
      })
    })

    it('should return failure on non-zero exit code', async () => {
      const pluginId = 'invalid-plugin@marketplace'
      const promise = installPlugin(pluginId)

      // Simulate failed execution with exit code 1
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to install ${pluginId}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const pluginId = 'some-plugin@marketplace'
      const stderrMessage = 'Plugin not found in marketplace'
      const promise = installPlugin(pluginId)

      // Simulate stderr output
      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to install ${pluginId}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const pluginId = 'test-plugin@marketplace'
      const errorMessage = 'spawn ENOENT'
      const promise = installPlugin(pluginId)

      // Simulate spawn error (e.g., claude command not found)
      mockChild.emit('error', new Error(errorMessage))

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to execute claude command',
        error: errorMessage,
      })
    })

    it('should use stdout as fallback error message when stderr is empty', async () => {
      const pluginId = 'test-plugin@marketplace'
      const stdoutMessage = 'Error: Something went wrong'
      const promise = installPlugin(pluginId)

      // Simulate stdout output with no stderr
      mockChild.stdout.emit('data', Buffer.from(stdoutMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to install ${pluginId}`,
        error: stdoutMessage,
      })
    })

    it('should concatenate multiple stderr chunks', async () => {
      const pluginId = 'test-plugin@marketplace'
      const promise = installPlugin(pluginId)

      // Simulate multiple stderr chunks
      mockChild.stderr.emit('data', Buffer.from('Error: '))
      mockChild.stderr.emit('data', Buffer.from('Network timeout'))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to install ${pluginId}`,
        error: 'Error: Network timeout',
      })
    })
  })

  describe('uninstallPlugin', () => {
    it('should return success on exit code 0', async () => {
      const pluginId = 'context7@claude-plugins-official'
      const promise = uninstallPlugin(pluginId)

      // Simulate successful execution
      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'uninstall', pluginId],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Uninstalled ${pluginId}`,
      })
    })

    it('should return failure on non-zero exit code', async () => {
      const pluginId = 'nonexistent-plugin@marketplace'
      const promise = uninstallPlugin(pluginId)

      // Simulate failed execution with exit code 1
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to uninstall ${pluginId}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const pluginId = 'test-plugin@marketplace'
      const stderrMessage = 'Plugin is not installed'
      const promise = uninstallPlugin(pluginId)

      // Simulate stderr output
      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to uninstall ${pluginId}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const pluginId = 'test-plugin@marketplace'
      const errorMessage = 'spawn EACCES'
      const promise = uninstallPlugin(pluginId)

      // Simulate spawn error (e.g., permission denied)
      mockChild.emit('error', new Error(errorMessage))

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to execute claude command',
        error: errorMessage,
      })
    })

    it('should use stdout as fallback error message when stderr is empty', async () => {
      const pluginId = 'test-plugin@marketplace'
      const stdoutMessage = 'Uninstall failed: plugin locked'
      const promise = uninstallPlugin(pluginId)

      // Simulate stdout output with no stderr
      mockChild.stdout.emit('data', Buffer.from(stdoutMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to uninstall ${pluginId}`,
        error: stdoutMessage,
      })
    })

    it('should concatenate multiple stderr chunks', async () => {
      const pluginId = 'test-plugin@marketplace'
      const promise = uninstallPlugin(pluginId)

      // Simulate multiple stderr chunks
      mockChild.stderr.emit('data', Buffer.from('Failed to remove: '))
      mockChild.stderr.emit('data', Buffer.from('directory not empty'))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to uninstall ${pluginId}`,
        error: 'Failed to remove: directory not empty',
      })
    })
  })
})
