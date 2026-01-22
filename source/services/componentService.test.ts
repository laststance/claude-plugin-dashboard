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
  detectComponentsDetailed,
  parseSkillMdFull,
  getSkillDetailedInfo,
  getMarkdownComponentDetailedInfo,
  hasAnyComponents,
  getTotalComponentCount,
} from './componentService.js'
import * as fs from 'node:fs'
import * as fileService from './fileService.js'

const mockReadFileSync = vi.mocked(fs.readFileSync)

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

describe('parseSkillMdFull', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when file does not exist', () => {
    mockFileExists.mockReturnValue(false)

    const result = parseSkillMdFull('/nonexistent/SKILL.md')

    expect(result).toBeUndefined()
  })

  it('should parse content without frontmatter', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('This is plain markdown content')

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result).toEqual({
      fullDescription: 'This is plain markdown content',
    })
  })

  it('should parse frontmatter with description', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
name: test-skill
description: A test skill description
---
Body content here`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.description).toBe('A test skill description')
    expect(result?.fullDescription).toBe('Body content here')
  })

  it('should parse frontmatter with quoted description', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: "Quoted description"
---
Content`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.description).toBe('Quoted description')
  })

  it('should parse allowed-tools array format', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Test
allowed-tools: [Read, Edit, Write]
---
Content`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.allowedTools).toEqual(['Read', 'Edit', 'Write'])
  })

  it('should parse allowed-tools single line format', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Test
allowed-tools: Read, Edit
---
Content`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.allowedTools).toEqual(['Read', 'Edit'])
  })

  it('should handle malformed frontmatter (no closing ---)', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Test
No closing delimiter`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.fullDescription).toContain('---')
  })

  it('should handle empty body after frontmatter', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Test skill
---`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.description).toBe('Test skill')
    expect(result?.fullDescription).toBeUndefined()
  })

  it('should handle file read errors gracefully', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockImplementation(() => {
      throw new Error('Read error')
    })

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result).toBeUndefined()
  })

  it('should strip quotes from allowed-tools values', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
allowed-tools: ["Read", 'Edit', Write]
---
Content`)

    const result = parseSkillMdFull('/path/SKILL.md')

    expect(result?.allowedTools).toEqual(['Read', 'Edit', 'Write'])
  })
})

describe('detectComponentsDetailed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when install path does not exist', () => {
    mockDirectoryExists.mockReturnValue(false)

    const result = detectComponentsDetailed('/nonexistent/path')

    expect(result).toBeUndefined()
  })

  it('should return undefined when no components are detected', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path'
    })
    mockFileExists.mockReturnValue(false)
    mockReadJsonFile.mockReturnValue(null)

    const result = detectComponentsDetailed('/plugin/path')

    expect(result).toBeUndefined()
  })

  it('should detect skills with names and descriptions', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path' || path === '/plugin/path/skills'
    })
    mockFileExists.mockImplementation((path: string) => {
      return path.endsWith('SKILL.md')
    })
    mockReadJsonFile.mockReturnValue(null)
    mockReaddirSync.mockImplementation((path: string) => {
      if (path === '/plugin/path/skills') {
        return [
          { name: 'my-skill', isDirectory: () => true },
        ] as unknown as ReturnType<typeof fs.readdirSync>
      }
      return []
    })
    mockReadFileSync.mockReturnValue(`---
description: My skill description
---
Full content`)

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.skills).toEqual([
      { name: 'my-skill', description: 'My skill description', type: 'skill' },
    ])
  })

  it('should detect commands with names', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path' || path === '/plugin/path/commands'
    })
    mockFileExists.mockReturnValue(false)
    mockReadJsonFile.mockReturnValue(null)
    mockReaddirSync.mockImplementation((path: string) => {
      if (path === '/plugin/path/commands') {
        return ['commit.md', 'review.md'] as unknown as ReturnType<
          typeof fs.readdirSync
        >
      }
      return []
    })
    mockReadFileSync.mockReturnValue('# Command Title\nDescription here')

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.commands?.length).toBe(2)
    expect(result?.commands?.[0].name).toBe('commit')
    expect(result?.commands?.[0].type).toBe('command')
  })

  it('should detect agents with names', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path' || path === '/plugin/path/agents'
    })
    mockFileExists.mockReturnValue(false)
    mockReadJsonFile.mockReturnValue(null)
    mockReaddirSync.mockImplementation((path: string) => {
      if (path === '/plugin/path/agents') {
        return ['reviewer.md'] as unknown as ReturnType<typeof fs.readdirSync>
      }
      return []
    })
    mockReadFileSync.mockReturnValue('Agent content')

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.agents?.[0].name).toBe('reviewer')
    expect(result?.agents?.[0].type).toBe('agent')
  })

  it('should detect hooks from hooks.json', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path'
    })
    mockFileExists.mockReturnValue(false)
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path === '/plugin/path/hooks.json') {
        return { PreToolUse: {}, PostToolUse: {} }
      }
      return null
    })

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.hooks).toEqual(['PreToolUse', 'PostToolUse'])
  })

  it('should detect MCP servers from plugin.json', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path'
    })
    mockFileExists.mockReturnValue(false)
    mockReaddirSync.mockReturnValue([])
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path === '/plugin/path/.claude-plugin/plugin.json') {
        return { mcpServers: { context7: {}, playwright: {} } }
      }
      return null
    })

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.mcpServers).toEqual(['context7', 'playwright'])
  })

  it('should detect LSP servers from .lsp.json', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return path === '/plugin/path'
    })
    mockFileExists.mockReturnValue(false)
    mockReaddirSync.mockReturnValue([])
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path === '/plugin/path/.lsp.json') {
        return { typescript: {}, python: {} }
      }
      return null
    })

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.lspServers).toEqual(['typescript', 'python'])
  })

  it('should detect all component types together', () => {
    mockDirectoryExists.mockImplementation((path: string) => {
      return (
        path === '/plugin/path' ||
        path === '/plugin/path/skills' ||
        path === '/plugin/path/commands' ||
        path === '/plugin/path/hooks'
      )
    })
    mockFileExists.mockImplementation((path: string) => {
      return path.endsWith('SKILL.md')
    })
    mockReaddirSync.mockImplementation((path: string) => {
      if (path === '/plugin/path/skills') {
        return [
          { name: 'skill1', isDirectory: () => true },
        ] as unknown as ReturnType<typeof fs.readdirSync>
      }
      if (path === '/plugin/path/commands') {
        return ['cmd.md'] as unknown as ReturnType<typeof fs.readdirSync>
      }
      if (path === '/plugin/path/hooks') {
        return ['hook.json'] as unknown as ReturnType<typeof fs.readdirSync>
      }
      return []
    })
    mockReadFileSync.mockReturnValue('Content')
    mockReadJsonFile.mockImplementation((path: string) => {
      if (path === '/plugin/path/.claude-plugin/plugin.json') {
        return { mcpServers: { mcp1: {} } }
      }
      return null
    })

    const result = detectComponentsDetailed('/plugin/path')

    expect(result?.skills?.length).toBe(1)
    expect(result?.commands?.length).toBe(1)
    expect(result?.hooks?.length).toBe(1)
    expect(result?.mcpServers?.length).toBe(1)
  })
})

describe('getSkillDetailedInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when SKILL.md does not exist', () => {
    mockFileExists.mockReturnValue(false)

    const result = getSkillDetailedInfo('/plugin/path', 'nonexistent-skill')

    expect(result).toBeUndefined()
  })

  it('should return detailed skill info', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Analyze Sentry issues
allowed-tools: [Read, Grep]
---
Full skill documentation here`)

    const result = getSkillDetailedInfo('/plugin/path', 'sentry-code-review')

    expect(result).toEqual({
      name: 'sentry-code-review',
      type: 'skill',
      description: 'Analyze Sentry issues',
      allowedTools: ['Read', 'Grep'],
      fullDescription: 'Full skill documentation here',
      filePath: '/plugin/path/skills/sentry-code-review/SKILL.md',
    })
  })

  it('should handle skill without allowed-tools', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
description: Simple skill
---
Content`)

    const result = getSkillDetailedInfo('/plugin/path', 'simple-skill')

    expect(result?.name).toBe('simple-skill')
    expect(result?.description).toBe('Simple skill')
    expect(result?.allowedTools).toBeUndefined()
  })

  it('should handle skill without frontmatter', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('Plain markdown content')

    const result = getSkillDetailedInfo('/plugin/path', 'plain-skill')

    expect(result?.name).toBe('plain-skill')
    expect(result?.fullDescription).toBe('Plain markdown content')
    expect(result?.description).toBeUndefined()
  })
})

describe('getMarkdownComponentDetailedInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when file does not exist', () => {
    mockFileExists.mockReturnValue(false)

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'nonexistent',
      'command',
    )

    expect(result).toBeUndefined()
  })

  it('should return command detail info', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`# Commit Command
Create a git commit with AI-generated message`)

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'commit',
      'command',
    )

    expect(result).toEqual({
      name: 'commit',
      type: 'command',
      description: 'Commit Command',
      fullDescription: `# Commit Command
Create a git commit with AI-generated message`,
      filePath: '/plugin/path/commands/commit.md',
    })
  })

  it('should return agent detail info', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`Agent for code review`)

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'reviewer',
      'agent',
    )

    expect(result?.name).toBe('reviewer')
    expect(result?.type).toBe('agent')
    expect(result?.filePath).toBe('/plugin/path/agents/reviewer.md')
  })

  it('should parse description from first non-empty line', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`

# My Command Title

Rest of content`)

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'test',
      'command',
    )

    expect(result?.description).toBe('My Command Title')
  })

  it('should skip frontmatter when parsing description', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(`---
name: test
version: 1.0
---
# Actual Title

Content here`)

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'test',
      'command',
    )

    expect(result?.description).toBe('Actual Title')
  })

  it('should handle file read errors gracefully', () => {
    mockFileExists.mockReturnValue(true)
    mockReadFileSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const result = getMarkdownComponentDetailedInfo(
      '/plugin/path',
      'error-file',
      'command',
    )

    expect(result).toBeUndefined()
  })
})
