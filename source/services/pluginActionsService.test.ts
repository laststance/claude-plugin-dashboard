/**
 * Unit tests for pluginActionsService
 * Tests installPlugin, uninstallPlugin, updatePlugin, and updateAllPlugins
 */

import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import {
  installPlugin,
  uninstallPlugin,
  updatePlugin,
  updateAllPlugins,
} from './pluginActionsService.js'

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

  describe('updatePlugin', () => {
    it('should return success on exit code 0', async () => {
      const pluginId = 'superpowers@claude-plugins-official'
      const promise = updatePlugin(pluginId)

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'update', pluginId],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Updated ${pluginId}`,
      })
    })

    it('should return failure on non-zero exit code', async () => {
      const pluginId = 'invalid-plugin@marketplace'
      const promise = updatePlugin(pluginId)

      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${pluginId}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const pluginId = 'some-plugin@marketplace'
      const stderrMessage = 'No update available'
      const promise = updatePlugin(pluginId)

      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${pluginId}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const pluginId = 'test-plugin@marketplace'
      const errorMessage = 'spawn ENOENT'
      const promise = updatePlugin(pluginId)

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
      const stdoutMessage = 'Update failed: network error'
      const promise = updatePlugin(pluginId)

      mockChild.stdout.emit('data', Buffer.from(stdoutMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${pluginId}`,
        error: stdoutMessage,
      })
    })

    it('should concatenate multiple stderr chunks', async () => {
      const pluginId = 'test-plugin@marketplace'
      const promise = updatePlugin(pluginId)

      mockChild.stderr.emit('data', Buffer.from('Error: '))
      mockChild.stderr.emit('data', Buffer.from('connection refused'))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${pluginId}`,
        error: 'Error: connection refused',
      })
    })
  })

  describe('updateAllPlugins', () => {
    it('should update all plugins sequentially and return summary', async () => {
      const pluginIds = ['plugin-a@mp', 'plugin-b@mp']

      // First call succeeds, second call succeeds
      const child1 = createMockChild()
      const child2 = createMockChild()
      mockSpawn.mockReturnValueOnce(child1).mockReturnValueOnce(child2)

      const promise = updateAllPlugins(pluginIds)

      // Resolve sequentially
      child1.emit('close', 0)
      // Wait for microtask to process before emitting next
      await new Promise((r) => setTimeout(r, 0))
      child2.emit('close', 0)

      const result = await promise

      expect(result).toEqual({
        total: 2,
        succeeded: 2,
        failed: 0,
        results: [
          {
            pluginId: 'plugin-a@mp',
            result: { success: true, message: 'Updated plugin-a@mp' },
          },
          {
            pluginId: 'plugin-b@mp',
            result: { success: true, message: 'Updated plugin-b@mp' },
          },
        ],
      })
    })

    it('should call onProgress callback for each plugin', async () => {
      const pluginIds = ['plugin-a@mp', 'plugin-b@mp']
      const onProgress = vi.fn()

      const child1 = createMockChild()
      const child2 = createMockChild()
      mockSpawn.mockReturnValueOnce(child1).mockReturnValueOnce(child2)

      const promise = updateAllPlugins(pluginIds, onProgress)

      child1.emit('close', 0)
      await new Promise((r) => setTimeout(r, 0))
      child2.emit('close', 0)

      await promise

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, 'plugin-a@mp')
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, 'plugin-b@mp')
    })

    it('should handle mixed results (some success, some failure)', async () => {
      const pluginIds = ['plugin-a@mp', 'plugin-b@mp']

      const child1 = createMockChild()
      const child2 = createMockChild()
      mockSpawn.mockReturnValueOnce(child1).mockReturnValueOnce(child2)

      const promise = updateAllPlugins(pluginIds)

      child1.emit('close', 0) // success
      await new Promise((r) => setTimeout(r, 0))
      child2.emit('close', 1) // failure

      const result = await promise

      expect(result.total).toBe(2)
      expect(result.succeeded).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.results[0]!.result.success).toBe(true)
      expect(result.results[1]!.result.success).toBe(false)
    })

    it('should handle all failures', async () => {
      const pluginIds = ['plugin-a@mp', 'plugin-b@mp']

      const child1 = createMockChild()
      const child2 = createMockChild()
      mockSpawn.mockReturnValueOnce(child1).mockReturnValueOnce(child2)

      const promise = updateAllPlugins(pluginIds)

      child1.emit('close', 1)
      await new Promise((r) => setTimeout(r, 0))
      child2.emit('close', 1)

      const result = await promise

      expect(result).toEqual(
        expect.objectContaining({
          total: 2,
          succeeded: 0,
          failed: 2,
        }),
      )
    })

    it('should handle empty plugin list', async () => {
      const result = await updateAllPlugins([])

      expect(result).toEqual({
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      })
      expect(mockSpawn).not.toHaveBeenCalled()
    })
  })
})
