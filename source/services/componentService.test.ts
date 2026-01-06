/**
 * Unit tests for componentService functions
 * Tests component detection for plugins via filesystem mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PluginComponents } from '../types/index.js'

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}))

// Mock fileService
vi.mock('./fileService.js', () => ({
  readJsonFile: vi.fn(),
  directoryExists: vi.fn(),
  fileExists: vi.fn(),
}))

// Import after mocks
import {
  detectPluginComponents,
  hasAnyComponents,
  getTotalComponentCount,
} from './componentService.js'
import * as fs from 'node:fs'
import * as fileService from './fileService.js'

const mockExistsSync = vi.mocked(fs.existsSync)
const mockStatSync = vi.mocked(fs.statSync)
const mockReaddirSync = vi.mocked(fs.readdirSync)
const mockDirectoryExists = vi.mocked(fileService.directoryExists)
const mockFileExists = vi.mocked(fileService.fileExists)
const mockReadJsonFile = vi.mocked(fileService.readJsonFile)

describe('detectPluginComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when install path does not exist', () => {
    mockDirectoryExists.mockReturnValue(false)

    const result = detectPluginComponents('/nonexistent/path')

    expect(result).toBeUndefined()
  })

  it('should return undefined when no components are detected', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path'
    })
    mockFileExists.mockReturnValue(false)
    mockReadJsonFile.mockReturnValue(null)

    const result = detectPluginComponents('/plugin/path')

    expect(result).toBeUndefined()
  })

  describe('skills detection', () => {
    it('should count skill directories', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return (
          path === '/plugin/path' ||
          path === '/plugin/path/skills' ||
          path.includes('/plugin/path/skills/')
        )
      })
      mockFileExists.mockReturnValue(false)
      mockReadJsonFile.mockReturnValue(null)
      mockReaddirSync.mockImplementation((path: string) => {
        if (path === '/plugin/path/skills') {
          return [
            { name: 'skill-a', isDirectory: () => true },
            { name: 'skill-b', isDirectory: () => true },
            { name: 'README.md', isDirectory: () => false },
          ] as unknown as ReturnType<typeof fs.readdirSync>
        }
        return []
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.skills).toBe(2)
    })

    it('should return 0 skills when skills directory is empty', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path' || path === '/plugin/path/skills'
      })
      mockFileExists.mockReturnValue(false)
      mockReadJsonFile.mockReturnValue(null)
      mockReaddirSync.mockImplementation((path: string) => {
        if (path === '/plugin/path/skills') {
          return [] as unknown as ReturnType<typeof fs.readdirSync>
        }
        return []
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result).toBeUndefined()
    })
  })

  describe('commands detection', () => {
    it('should count markdown files in commands directory', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path' || path === '/plugin/path/commands'
      })
      mockFileExists.mockReturnValue(false)
      mockReadJsonFile.mockReturnValue(null)
      mockReaddirSync.mockImplementation((path: string) => {
        if (path === '/plugin/path/commands') {
          return [
            'commit.md',
            'review.md',
            'deploy.md',
            'README.txt',
          ] as unknown as ReturnType<typeof fs.readdirSync>
        }
        return []
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.commands).toBe(3)
    })
  })

  describe('agents detection', () => {
    it('should count markdown files in agents directory', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path' || path === '/plugin/path/agents'
      })
      mockFileExists.mockReturnValue(false)
      mockReadJsonFile.mockReturnValue(null)
      mockReaddirSync.mockImplementation((path: string) => {
        if (path === '/plugin/path/agents') {
          return ['code-reviewer.md', 'architect.md'] as unknown as ReturnType<
            typeof fs.readdirSync
          >
        }
        return []
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.agents).toBe(2)
    })
  })

  describe('hooks detection', () => {
    it('should detect hooks from hooks directory', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path' || path === '/plugin/path/hooks'
      })
      mockFileExists.mockReturnValue(false)
      mockReadJsonFile.mockReturnValue(null)
      mockReaddirSync.mockReturnValue([])

      const result = detectPluginComponents('/plugin/path')

      expect(result?.hooks).toBe(true)
    })

    it('should detect hooks from hooks.json file', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path'
      })
      mockFileExists.mockImplementation((path: string) => {
        return path === '/plugin/path/hooks.json'
      })
      mockReadJsonFile.mockReturnValue(null)

      const result = detectPluginComponents('/plugin/path')

      expect(result?.hooks).toBe(true)
    })
  })

  describe('MCP servers detection', () => {
    it('should count MCP servers from .claude-plugin/plugin.json', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path'
      })
      mockFileExists.mockReturnValue(false)
      mockReaddirSync.mockReturnValue([])
      mockReadJsonFile.mockImplementation((path: string) => {
        if (path === '/plugin/path/.claude-plugin/plugin.json') {
          return {
            name: 'test-plugin',
            mcpServers: {
              context7: { type: 'http', url: 'https://example.com' },
              playwright: { type: 'stdio', command: 'npx' },
            },
          }
        }
        return null
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.mcpServers).toBe(2)
    })

    it('should count MCP servers from root plugin.json', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path'
      })
      mockFileExists.mockReturnValue(false)
      mockReaddirSync.mockReturnValue([])
      mockReadJsonFile.mockImplementation((path: string) => {
        if (path === '/plugin/path/plugin.json') {
          return {
            name: 'test-plugin',
            mcpServers: {
              server1: { type: 'http' },
            },
          }
        }
        return null
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.mcpServers).toBe(1)
    })
  })

  describe('LSP servers detection', () => {
    it('should count LSP servers from .lsp.json', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return path === '/plugin/path'
      })
      mockFileExists.mockReturnValue(false)
      mockReaddirSync.mockReturnValue([])
      mockReadJsonFile.mockImplementation((path: string) => {
        if (path === '/plugin/path/.lsp.json') {
          return {
            typescript: {
              command: 'typescript-language-server',
              args: ['--stdio'],
            },
            python: { command: 'pyright', args: ['--stdio'] },
          }
        }
        return null
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result?.lspServers).toBe(2)
    })
  })

  describe('combined detection', () => {
    it('should detect all component types', () => {
      mockDirectoryExists.mockImplementation((path: string) => {
        return (
          path === '/plugin/path' ||
          path === '/plugin/path/skills' ||
          path === '/plugin/path/commands' ||
          path === '/plugin/path/agents' ||
          path === '/plugin/path/hooks'
        )
      })
      mockFileExists.mockReturnValue(false)
      mockReaddirSync.mockImplementation((path: string) => {
        if (path === '/plugin/path/skills') {
          return [
            { name: 'skill1', isDirectory: () => true },
            { name: 'skill2', isDirectory: () => true },
          ] as unknown as ReturnType<typeof fs.readdirSync>
        }
        if (path === '/plugin/path/commands') {
          return ['cmd.md'] as unknown as ReturnType<typeof fs.readdirSync>
        }
        if (path === '/plugin/path/agents') {
          return ['agent.md'] as unknown as ReturnType<typeof fs.readdirSync>
        }
        return []
      })
      mockReadJsonFile.mockImplementation((path: string) => {
        if (path === '/plugin/path/.claude-plugin/plugin.json') {
          return { mcpServers: { mcp1: {} } }
        }
        if (path === '/plugin/path/.lsp.json') {
          return { ts: {}, python: {} }
        }
        return null
      })

      const result = detectPluginComponents('/plugin/path')

      expect(result).toEqual({
        skills: 2,
        commands: 1,
        agents: 1,
        hooks: true,
        mcpServers: 1,
        lspServers: 2,
      })
    })
  })
})

describe('hasAnyComponents', () => {
  it('should return false for undefined', () => {
    expect(hasAnyComponents(undefined)).toBe(false)
  })

  it('should return false for empty object', () => {
    expect(hasAnyComponents({})).toBe(false)
  })

  it('should return true when skills > 0', () => {
    expect(hasAnyComponents({ skills: 1 })).toBe(true)
  })

  it('should return true when commands > 0', () => {
    expect(hasAnyComponents({ commands: 2 })).toBe(true)
  })

  it('should return true when agents > 0', () => {
    expect(hasAnyComponents({ agents: 1 })).toBe(true)
  })

  it('should return true when hooks is true', () => {
    expect(hasAnyComponents({ hooks: true })).toBe(true)
  })

  it('should return false when hooks is false', () => {
    expect(hasAnyComponents({ hooks: false })).toBe(false)
  })

  it('should return true when mcpServers > 0', () => {
    expect(hasAnyComponents({ mcpServers: 1 })).toBe(true)
  })

  it('should return true when lspServers > 0', () => {
    expect(hasAnyComponents({ lspServers: 1 })).toBe(true)
  })

  it('should return false when all counts are 0', () => {
    expect(
      hasAnyComponents({
        skills: 0,
        commands: 0,
        agents: 0,
        hooks: false,
        mcpServers: 0,
        lspServers: 0,
      }),
    ).toBe(false)
  })
})

describe('getTotalComponentCount', () => {
  it('should return 0 for undefined', () => {
    expect(getTotalComponentCount(undefined)).toBe(0)
  })

  it('should return 0 for empty object', () => {
    expect(getTotalComponentCount({})).toBe(0)
  })

  it('should sum all component counts', () => {
    const components: PluginComponents = {
      skills: 5,
      commands: 3,
      agents: 2,
      hooks: true,
      mcpServers: 2,
      lspServers: 1,
    }

    expect(getTotalComponentCount(components)).toBe(14) // 5+3+2+1+2+1
  })

  it('should count hooks as 1', () => {
    expect(getTotalComponentCount({ hooks: true })).toBe(1)
  })

  it('should count hooks as 0 when false', () => {
    expect(getTotalComponentCount({ hooks: false })).toBe(0)
  })

  it('should handle partial components', () => {
    expect(getTotalComponentCount({ skills: 3, mcpServers: 1 })).toBe(4)
  })
})
