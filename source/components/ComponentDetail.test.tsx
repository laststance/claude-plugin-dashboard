/**
 * Unit tests for ComponentDetail component
 * Tests display of component information with various configurations
 */

import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import ComponentDetail from './ComponentDetail.js'
import type { ComponentDetailedInfo } from '../types/index.js'

describe('ComponentDetail', () => {
  describe('null state', () => {
    it('should show placeholder when component is null', () => {
      const { lastFrame } = render(<ComponentDetail component={null} />)

      expect(lastFrame()).toContain('Select a component to view details')
    })
  })

  describe('basic display', () => {
    it('should display component name', () => {
      const component: ComponentDetailedInfo = {
        name: 'my-skill',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('my-skill')
    })

    it('should display component description', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        description: 'A test skill for unit testing',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('A test skill for unit testing')
    })

    it('should display allowed tools when present', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        allowedTools: ['Read', 'Edit', 'Write'],
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('Tools:')
      expect(lastFrame()).toContain('Read, Edit, Write')
    })

    it('should display file path when present', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        filePath: '/path/to/skills/test/SKILL.md',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('SKILL.md')
    })
  })

  describe('type badges', () => {
    it('should display skill badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[Skill]')
    })

    it('should display command badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'command',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[Slash Command]')
    })

    it('should display agent badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'agent',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[Agent]')
    })

    it('should display hook badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'hook',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[Hook]')
    })

    it('should display MCP server badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'mcp',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[MCP Server]')
    })

    it('should display LSP server badge', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'lsp',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('[LSP Server]')
    })
  })

  describe('optional fields', () => {
    it('should not show Tools section when allowedTools is empty', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        allowedTools: [],
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).not.toContain('Tools:')
    })

    it('should not show Tools section when allowedTools is undefined', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).not.toContain('Tools:')
    })

    it('should not show description when undefined', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        description: undefined,
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      // Should still render name and type
      expect(lastFrame()).toContain('test')
      expect(lastFrame()).toContain('[Skill]')
    })

    it('should not show file path section when filePath is undefined', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      // File path indicator should not appear
      expect(lastFrame()).not.toContain('📄')
    })

    it('should show Content section when fullDescription is present', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        fullDescription: 'Full documentation content here',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('── Content ──')
      expect(lastFrame()).toContain('Full documentation content here')
    })

    it('should not show Content section when fullDescription is undefined', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).not.toContain('── Content ──')
    })

    it('should handle component with all fields populated', () => {
      const component: ComponentDetailedInfo = {
        name: 'sentry-code-review',
        type: 'skill',
        description: 'Analyze Sentry comments on PRs',
        allowedTools: ['Read', 'Grep', 'WebFetch'],
        fullDescription: 'Full documentation for the skill',
        filePath:
          '/home/user/.claude/plugins/sentry/skills/sentry-code-review/SKILL.md',
      }
      // Use larger maxHeight to ensure Tools section fits
      const { lastFrame } = render(
        <ComponentDetail component={component} maxHeight={15} />,
      )

      expect(lastFrame()).toContain('sentry-code-review')
      expect(lastFrame()).toContain('[Skill]')
      expect(lastFrame()).toContain('Analyze Sentry comments on PRs')
      // Tools section should be present with adequate height
      expect(lastFrame()).toContain('Tools:')
      expect(lastFrame()).toContain('── Content ──')
      expect(lastFrame()).toContain('SKILL.md')
    })

    it('should handle component with minimal fields', () => {
      const component: ComponentDetailedInfo = {
        name: 'minimal',
        type: 'mcp',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      expect(lastFrame()).toContain('minimal')
      expect(lastFrame()).toContain('[MCP Server]')
    })
  })

  describe('maxHeight variations', () => {
    it('should render with default maxHeight', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      // Should render without error
      expect(lastFrame()).toContain('test')
    })

    it('should render with custom maxHeight', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        fullDescription: 'Content',
      }
      const { lastFrame } = render(
        <ComponentDetail component={component} maxHeight={15} />,
      )

      expect(lastFrame()).toContain('test')
    })

    it('should handle small maxHeight gracefully', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        fullDescription: 'Long content that might need truncation',
      }
      const { lastFrame } = render(
        <ComponentDetail component={component} maxHeight={5} />,
      )

      // Should still render without error
      expect(lastFrame()).toContain('test')
    })

    it('should handle long content that exceeds available space', () => {
      const longContent = Array(20).fill('Line of content').join('\n')
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        fullDescription: longContent,
      }
      const { lastFrame } = render(
        <ComponentDetail component={component} maxHeight={10} />,
      )

      // Should render content section
      expect(lastFrame()).toContain('── Content ──')
      expect(lastFrame()).toContain('Line of content')
    })
  })

  describe('path shortening', () => {
    it('should shorten long file paths', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        filePath:
          '/Users/developer/.claude/plugins/cache/marketplace/plugin-name/1.0.0/skills/my-skill/SKILL.md',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      // Should show shortened path with ...
      expect(lastFrame()).toContain('...')
      expect(lastFrame()).toContain('SKILL.md')
    })

    it('should display short paths without truncation', () => {
      const component: ComponentDetailedInfo = {
        name: 'test',
        type: 'skill',
        filePath: '/skills/test/SKILL.md',
      }
      const { lastFrame } = render(<ComponentDetail component={component} />)

      // Short paths should not have ...
      expect(lastFrame()).not.toContain('...')
      expect(lastFrame()).toContain('SKILL.md')
    })
  })
})
