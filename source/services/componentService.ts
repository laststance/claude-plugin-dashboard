/**
 * Component service for detecting plugin component types
 * Parses plugin.json and scans plugin directory structure to identify
 * skills, commands, agents, hooks, MCP servers, and LSP servers
 *
 * This is a facade module that re-exports from the components/ submodules.
 * For implementation details, see:
 * - components/skillService.ts - Skill detection and SKILL.md parsing
 * - components/markdownService.ts - Command/Agent markdown parsing
 * - components/hookService.ts - Hook detection
 * - components/serverService.ts - MCP/LSP server detection
 * - components/utils.ts - Utility functions
 */

// Re-export everything from the components module for backward compatibility
export {
  // Main detection functions
  detectPluginComponents,
  detectComponentsDetailed,
  // Skill functions
  parseSkillMdFull,
  getSkillDetailedInfo,
  // Markdown functions
  getMarkdownComponentDetailedInfo,
  // Utility functions
  hasAnyComponents,
  getTotalComponentCount,
  // Types
  type SkillMdFullResult,
} from './components/index.js'
