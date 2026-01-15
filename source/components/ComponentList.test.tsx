/**
 * Integration tests for ComponentList component
 * Uses ink-testing-library to verify component rendering
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import ComponentList from './ComponentList.js'
import type {
  PluginComponents,
  PluginComponentsDetailed,
} from '../types/index.js'

describe('ComponentList', () => {
  describe('with no data', () => {
    it('should return null when both components and componentsDetailed are undefined', () => {
      const { lastFrame } = render(
        <ComponentList components={undefined} componentsDetailed={undefined} />,
      )

      expect(lastFrame()).toBe('')
    })

    it('should return null when components is empty object', () => {
      const { lastFrame } = render(<ComponentList components={{}} />)

      expect(lastFrame()).toBe('')
    })
  })

  describe('with detailed component info', () => {
    it('should render skill names from componentsDetailed', () => {
      const detailed: PluginComponentsDetailed = {
        skills: [
          { name: 'xlsx', type: 'skill' },
          { name: 'docx', type: 'skill' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('Skills')
      expect(lastFrame()).toContain('xlsx')
      expect(lastFrame()).toContain('docx')
    })

    it('should render agent names from componentsDetailed', () => {
      const detailed: PluginComponentsDetailed = {
        agents: [
          { name: 'code-reviewer', type: 'agent' },
          { name: 'doc-writer', type: 'agent' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('Agents')
      expect(lastFrame()).toContain('code-reviewer')
      expect(lastFrame()).toContain('doc-writer')
    })

    it('should render MCP server names from componentsDetailed', () => {
      const detailed: PluginComponentsDetailed = {
        mcpServers: ['supabase', 'context7'],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('MCP')
      expect(lastFrame()).toContain('supabase')
      expect(lastFrame()).toContain('context7')
    })

    it('should show description when available', () => {
      const detailed: PluginComponentsDetailed = {
        skills: [
          { name: 'xlsx', description: 'Spreadsheet editing', type: 'skill' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('xlsx')
      expect(lastFrame()).toContain('Spreadsheet editing')
    })
  })

  describe('with maxItems limit', () => {
    it('should show "+N more..." when items exceed maxItems', () => {
      const detailed: PluginComponentsDetailed = {
        skills: [
          { name: 'skill-1', type: 'skill' },
          { name: 'skill-2', type: 'skill' },
          { name: 'skill-3', type: 'skill' },
          { name: 'skill-4', type: 'skill' },
          { name: 'skill-5', type: 'skill' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} maxItems={3} />,
      )

      expect(lastFrame()).toContain('skill-1')
      expect(lastFrame()).toContain('skill-2')
      expect(lastFrame()).toContain('skill-3')
      expect(lastFrame()).not.toContain('skill-4')
      expect(lastFrame()).not.toContain('skill-5')
      expect(lastFrame()).toContain('+2 more...')
    })

    it('should not show "+N more..." when items equal maxItems', () => {
      const detailed: PluginComponentsDetailed = {
        skills: [
          { name: 'skill-1', type: 'skill' },
          { name: 'skill-2', type: 'skill' },
          { name: 'skill-3', type: 'skill' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} maxItems={3} />,
      )

      expect(lastFrame()).not.toContain('more...')
    })
  })

  describe('with count-only fallback', () => {
    it('should show count when componentsDetailed is not available', () => {
      const components: PluginComponents = {
        skills: 5,
        commands: 2,
      }

      const { lastFrame } = render(<ComponentList components={components} />)

      expect(lastFrame()).toContain('Skills')
      expect(lastFrame()).toContain('5')
      expect(lastFrame()).toContain('Slash')
      expect(lastFrame()).toContain('2')
    })

    it('should prefer detailed info over counts', () => {
      const components: PluginComponents = {
        skills: 5,
      }
      const detailed: PluginComponentsDetailed = {
        skills: [
          { name: 'xlsx', type: 'skill' },
          { name: 'docx', type: 'skill' },
        ],
      }

      const { lastFrame } = render(
        <ComponentList components={components} componentsDetailed={detailed} />,
      )

      // Should show names, not count "5"
      expect(lastFrame()).toContain('xlsx')
      expect(lastFrame()).toContain('docx')
      expect(lastFrame()).toContain('(2)') // Count in header
    })
  })

  describe('rendering header', () => {
    it('should render "Components" header', () => {
      const detailed: PluginComponentsDetailed = {
        skills: [{ name: 'test', type: 'skill' }],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('Components')
    })
  })

  describe('hooks handling', () => {
    it('should render hooks when hooks is true in components', () => {
      const components: PluginComponents = {
        hooks: true,
      }

      const { lastFrame } = render(<ComponentList components={components} />)

      expect(lastFrame()).toContain('Hooks')
      expect(lastFrame()).toContain('configured')
    })

    it('should render hook names when available in detailed', () => {
      const detailed: PluginComponentsDetailed = {
        hooks: ['PreCommit', 'PostPush'],
      }

      const { lastFrame } = render(
        <ComponentList componentsDetailed={detailed} />,
      )

      expect(lastFrame()).toContain('Components')
      expect(lastFrame()).toContain('Hooks')
      expect(lastFrame()).toContain('PreCommit')
      expect(lastFrame()).toContain('PostPush')
      expect(lastFrame()).toContain('(2)')
    })
  })
})
