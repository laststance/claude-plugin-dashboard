/**
 * Unit tests for marketplaceActionsService
 * Tests addMarketplace, removeMarketplace, and updateMarketplace functions
 */

import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import {
  addMarketplace,
  removeMarketplace,
  updateMarketplace,
} from './marketplaceActionsService.js'

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

describe('marketplaceActionsService', () => {
  let mockSpawn: Mock
  let mockChild: ReturnType<typeof createMockChild>

  beforeEach(() => {
    mockChild = createMockChild()
    mockSpawn = spawn as Mock
    mockSpawn.mockReturnValue(mockChild)
  })

  describe('addMarketplace', () => {
    it('should return success on exit code 0 for GitHub shorthand', async () => {
      const source = 'anthropics/claude-plugins'
      const promise = addMarketplace(source)

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'marketplace', 'add', source],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Added marketplace: ${source}`,
      })
    })

    it('should return success for Git URL source', async () => {
      const source = 'https://github.com/org/plugins.git'
      const promise = addMarketplace(source)

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'marketplace', 'add', source],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Added marketplace: ${source}`,
      })
    })

    it('should return success for local path source', async () => {
      const source = './my-marketplace'
      const promise = addMarketplace(source)

      mockChild.emit('close', 0)

      const result = await promise

      expect(result).toEqual({
        success: true,
        message: `Added marketplace: ${source}`,
      })
    })

    it('should return failure on non-zero exit code', async () => {
      const source = 'invalid/repo'
      const promise = addMarketplace(source)

      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to add marketplace: ${source}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const source = 'nonexistent/repo'
      const stderrMessage = 'Repository not found'
      const promise = addMarketplace(source)

      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to add marketplace: ${source}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const source = 'test/repo'
      const errorMessage = 'spawn ENOENT'
      const promise = addMarketplace(source)

      mockChild.emit('error', new Error(errorMessage))

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to execute claude command',
        error: errorMessage,
      })
    })

    it('should use stdout as fallback error message when stderr is empty', async () => {
      const source = 'test/repo'
      const stdoutMessage = 'Error: Marketplace already exists'
      const promise = addMarketplace(source)

      mockChild.stdout.emit('data', Buffer.from(stdoutMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to add marketplace: ${source}`,
        error: stdoutMessage,
      })
    })
  })

  describe('removeMarketplace', () => {
    it('should return success on exit code 0', async () => {
      const name = 'my-marketplace'
      const promise = removeMarketplace(name)

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'marketplace', 'remove', name],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Removed marketplace: ${name}`,
      })
    })

    it('should return failure on non-zero exit code', async () => {
      const name = 'nonexistent-marketplace'
      const promise = removeMarketplace(name)

      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to remove marketplace: ${name}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const name = 'protected-marketplace'
      const stderrMessage = 'Cannot remove built-in marketplace'
      const promise = removeMarketplace(name)

      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to remove marketplace: ${name}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const name = 'test-marketplace'
      const errorMessage = 'spawn EACCES'
      const promise = removeMarketplace(name)

      mockChild.emit('error', new Error(errorMessage))

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to execute claude command',
        error: errorMessage,
      })
    })

    it('should concatenate multiple stderr chunks', async () => {
      const name = 'test-marketplace'
      const promise = removeMarketplace(name)

      mockChild.stderr.emit('data', Buffer.from('Error: '))
      mockChild.stderr.emit('data', Buffer.from('Marketplace is locked'))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to remove marketplace: ${name}`,
        error: 'Error: Marketplace is locked',
      })
    })
  })

  describe('updateMarketplace', () => {
    it('should return success when updating specific marketplace', async () => {
      const name = 'claude-plugins-official'
      const promise = updateMarketplace(name)

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'marketplace', 'update', name],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: `Updated ${name}`,
      })
    })

    it('should return success when updating all marketplaces', async () => {
      const promise = updateMarketplace()

      mockChild.emit('close', 0)

      const result = await promise

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        ['plugin', 'marketplace', 'update'],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
      )
      expect(result).toEqual({
        success: true,
        message: 'Updated all marketplaces',
      })
    })

    it('should return failure on non-zero exit code for specific marketplace', async () => {
      const name = 'offline-marketplace'
      const promise = updateMarketplace(name)

      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${name}`,
        error: 'Exit code: 1',
      })
    })

    it('should return failure on non-zero exit code for all marketplaces', async () => {
      const promise = updateMarketplace()

      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to update marketplaces',
        error: 'Exit code: 1',
      })
    })

    it('should return failure with stderr message', async () => {
      const name = 'broken-marketplace'
      const stderrMessage = 'Network connection failed'
      const promise = updateMarketplace(name)

      mockChild.stderr.emit('data', Buffer.from(stderrMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${name}`,
        error: stderrMessage,
      })
    })

    it('should handle spawn error', async () => {
      const name = 'test-marketplace'
      const errorMessage = 'spawn ENOENT'
      const promise = updateMarketplace(name)

      mockChild.emit('error', new Error(errorMessage))

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: 'Failed to execute claude command',
        error: errorMessage,
      })
    })

    it('should use stdout as fallback error message when stderr is empty', async () => {
      const name = 'test-marketplace'
      const stdoutMessage = 'Update failed: invalid manifest'
      const promise = updateMarketplace(name)

      mockChild.stdout.emit('data', Buffer.from(stdoutMessage))
      mockChild.emit('close', 1)

      const result = await promise

      expect(result).toEqual({
        success: false,
        message: `Failed to update ${name}`,
        error: stdoutMessage,
      })
    })
  })
})
