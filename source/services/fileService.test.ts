/**
 * Unit tests for fileService functions
 * Tests file I/O operations with mocked node:fs module
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'node:fs'

vi.mock('node:fs')

// Import after mocking
import {
  readJsonFile,
  writeJsonFile,
  directoryExists,
  fileExists,
  listDirectories,
} from './fileService.js'

const mockedFs = vi.mocked(fs)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('readJsonFile', () => {
  it('should return null when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false)

    const result = readJsonFile<{ name: string }>('/path/to/nonexistent.json')

    expect(result).toBeNull()
    expect(mockedFs.existsSync).toHaveBeenCalledWith(
      '/path/to/nonexistent.json',
    )
    expect(mockedFs.readFileSync).not.toHaveBeenCalled()
  })

  it('should parse and return valid JSON', () => {
    const mockData = { name: 'test', version: '1.0.0' }
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData))

    const result = readJsonFile<typeof mockData>('/path/to/valid.json')

    expect(result).toEqual(mockData)
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/valid.json')
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      '/path/to/valid.json',
      'utf-8',
    )
  })

  it('should throw Error with "Invalid JSON in {path}" for SyntaxError', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue('{ invalid json }')

    expect(() => readJsonFile('/path/to/invalid.json')).toThrow(
      /Invalid JSON in \/path\/to\/invalid\.json/,
    )
  })

  it('should re-throw non-SyntaxError errors', () => {
    const permissionError = new Error('EACCES: permission denied')
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockImplementation(() => {
      throw permissionError
    })

    expect(() => readJsonFile('/path/to/protected.json')).toThrow(
      'EACCES: permission denied',
    )
  })

  it('should handle nested JSON structures', () => {
    const nestedData = {
      plugins: [{ name: 'plugin1' }, { name: 'plugin2' }],
      settings: { enabled: true, count: 42 },
    }
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(nestedData))

    const result = readJsonFile<typeof nestedData>('/path/to/nested.json')

    expect(result).toEqual(nestedData)
  })
})

describe('writeJsonFile', () => {
  it('should write with atomic rename (temp file then rename)', () => {
    const data = { name: 'test', enabled: true }
    mockedFs.writeFileSync.mockReturnValue(undefined)
    mockedFs.renameSync.mockReturnValue(undefined)

    writeJsonFile('/path/to/output.json', data)

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/output.json.tmp',
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    )
    expect(mockedFs.renameSync).toHaveBeenCalledWith(
      '/path/to/output.json.tmp',
      '/path/to/output.json',
    )
  })

  it('should clean up temp file on write error', () => {
    const data = { name: 'test' }
    const writeError = new Error('ENOSPC: no space left on device')
    mockedFs.writeFileSync.mockImplementation(() => {
      throw writeError
    })
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.unlinkSync.mockReturnValue(undefined)

    expect(() => writeJsonFile('/path/to/output.json', data)).toThrow(
      /Failed to write \/path\/to\/output\.json: ENOSPC: no space left on device/,
    )
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/output.json.tmp')
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith('/path/to/output.json.tmp')
  })

  it('should clean up temp file on rename error', () => {
    const data = { name: 'test' }
    const renameError = new Error('EXDEV: cross-device link not permitted')
    mockedFs.writeFileSync.mockReturnValue(undefined)
    mockedFs.renameSync.mockImplementation(() => {
      throw renameError
    })
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.unlinkSync.mockReturnValue(undefined)

    expect(() => writeJsonFile('/path/to/output.json', data)).toThrow(
      /Failed to write \/path\/to\/output\.json: EXDEV: cross-device link not permitted/,
    )
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith('/path/to/output.json.tmp')
  })

  it('should not attempt cleanup when temp file does not exist', () => {
    const data = { name: 'test' }
    mockedFs.writeFileSync.mockImplementation(() => {
      throw new Error('Write failed')
    })
    mockedFs.existsSync.mockReturnValue(false)

    expect(() => writeJsonFile('/path/to/output.json', data)).toThrow(
      /Failed to write/,
    )
    expect(mockedFs.unlinkSync).not.toHaveBeenCalled()
  })

  it('should ignore cleanup errors silently', () => {
    const data = { name: 'test' }
    mockedFs.writeFileSync.mockImplementation(() => {
      throw new Error('Write failed')
    })
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.unlinkSync.mockImplementation(() => {
      throw new Error('Cleanup failed')
    })

    // Should throw original error, not cleanup error
    expect(() => writeJsonFile('/path/to/output.json', data)).toThrow(
      /Failed to write \/path\/to\/output\.json: Write failed/,
    )
  })

  it('should handle non-Error objects thrown', () => {
    const data = { name: 'test' }
    mockedFs.writeFileSync.mockImplementation(() => {
      throw 'string error'
    })
    mockedFs.existsSync.mockReturnValue(false)

    expect(() => writeJsonFile('/path/to/output.json', data)).toThrow(
      /Failed to write \/path\/to\/output\.json: Unknown error/,
    )
  })

  it('should format JSON with 2-space indentation and trailing newline', () => {
    const data = { name: 'test', nested: { value: 1 } }
    mockedFs.writeFileSync.mockReturnValue(undefined)
    mockedFs.renameSync.mockReturnValue(undefined)

    writeJsonFile('/path/to/output.json', data)

    const expectedContent = JSON.stringify(data, null, 2) + '\n'
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/output.json.tmp',
      expectedContent,
      'utf-8',
    )
  })
})

describe('directoryExists', () => {
  it('should return true when directory exists', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as fs.Stats)

    const result = directoryExists('/path/to/directory')

    expect(result).toBe(true)
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/directory')
    expect(mockedFs.statSync).toHaveBeenCalledWith('/path/to/directory')
  })

  it('should return false when path does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false)

    const result = directoryExists('/path/to/nonexistent')

    expect(result).toBe(false)
    expect(mockedFs.statSync).not.toHaveBeenCalled()
  })

  it('should return false when path is a file, not a directory', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isDirectory: () => false } as fs.Stats)

    const result = directoryExists('/path/to/file.txt')

    expect(result).toBe(false)
  })

  it('should return false when statSync throws an error', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const result = directoryExists('/path/to/protected')

    expect(result).toBe(false)
  })
})

describe('fileExists', () => {
  it('should return true when file exists', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isFile: () => true } as fs.Stats)

    const result = fileExists('/path/to/file.json')

    expect(result).toBe(true)
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/file.json')
    expect(mockedFs.statSync).toHaveBeenCalledWith('/path/to/file.json')
  })

  it('should return false when path does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false)

    const result = fileExists('/path/to/nonexistent.json')

    expect(result).toBe(false)
    expect(mockedFs.statSync).not.toHaveBeenCalled()
  })

  it('should return false when path is a directory, not a file', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isFile: () => false } as fs.Stats)

    const result = fileExists('/path/to/directory')

    expect(result).toBe(false)
  })

  it('should return false when statSync throws an error', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const result = fileExists('/path/to/protected.json')

    expect(result).toBe(false)
  })
})

describe('listDirectories', () => {
  it('should return list of directory names', () => {
    // Mock directoryExists check
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // For directoryExists check
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // For 'dir1'
      .mockReturnValueOnce({ isDirectory: () => false } as fs.Stats) // For 'file.txt'
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // For 'dir2'
    // readdirSync returns string[] when called without options
    ;(mockedFs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
      'dir1',
      'file.txt',
      'dir2',
    ])

    const result = listDirectories('/path/to/parent')

    expect(result).toEqual(['dir1', 'dir2'])
  })

  it('should return empty array when directory does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false)

    const result = listDirectories('/path/to/nonexistent')

    expect(result).toEqual([])
    expect(mockedFs.readdirSync).not.toHaveBeenCalled()
  })

  it('should return empty array when readdirSync throws', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as fs.Stats)
    mockedFs.readdirSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const result = listDirectories('/path/to/protected')

    expect(result).toEqual([])
  })

  it('should return empty array when statSync throws during filtering', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // For directoryExists check
      .mockImplementation(() => {
        throw new Error('Permission denied')
      })
    ;(mockedFs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
      'dir1',
    ])

    const result = listDirectories('/path/to/parent')

    expect(result).toEqual([])
  })

  it('should construct full path correctly for stat check', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as fs.Stats)
    ;(mockedFs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
      'subdir',
    ])

    listDirectories('/path/to/parent')

    // Check that full path is constructed: /path/to/parent/subdir
    expect(mockedFs.statSync).toHaveBeenCalledWith('/path/to/parent/subdir')
  })

  it('should filter out all items when none are directories', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.statSync
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // For directoryExists check
      .mockReturnValue({ isDirectory: () => false } as fs.Stats) // All items are files
    ;(mockedFs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
      'file1.txt',
      'file2.json',
      'file3.md',
    ])

    const result = listDirectories('/path/to/files-only')

    expect(result).toEqual([])
  })
})
