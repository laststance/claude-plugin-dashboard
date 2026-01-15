# Component Data Source Architecture

> Design document for Issue #17: Plugin Component List Display
> Date: 2026-01-15
> Status: Design Phase

## Executive Summary

コンポーネント名を取得するために、**2つのデータソース戦略**を組み合わせる：

1. **インストール済みプラグイン**: ファイルシステムからリアルタイムで取得
2. **未インストールプラグイン**: Marketplace JSONから静的データを解析

---

## Current State Analysis

### 既存のデータフロー

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Flow (Current)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ~/.claude/plugins/marketplaces/{marketplace}/                      │
│       │                                                             │
│       ├─ .claude-plugin/marketplace.json  ──────────────────┐       │
│       │    └─ plugins: [{ name, description, ... }]        │       │
│       │                                                     │       │
│       └─ plugins/{plugin-name}/                             │       │
│            ├─ .claude-plugin/plugin.json  ─────────────────┐│       │
│            ├─ skills/{skill-name}/SKILL.md                 ││       │
│            ├─ commands/{command}.md                        ││       │
│            ├─ agents/{agent}.md                            ││       │
│            └─ hooks/hooks.json                             ││       │
│                                                            ││       │
│                         ┌──────────────────────────────────┘│       │
│                         │                                   │       │
│                         ▼                                   ▼       │
│  ┌─────────────────────────────────┐  ┌─────────────────────────┐   │
│  │     pluginService.ts            │  │  componentService.ts    │   │
│  │  ─────────────────────────────  │  │  ─────────────────────  │   │
│  │  loadAllPlugins()               │  │  detectPluginComponents │   │
│  │    → MarketplaceFile            │  │    → PluginComponents   │   │
│  │    → Plugin[]                   │  │       (counts only)     │   │
│  └─────────────────────────────────┘  └─────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 現在の問題点

| 問題                | 説明                                                      |
| ------------------- | --------------------------------------------------------- |
| **Counts only**     | `PluginComponents` は数値のみ（`skills: 7`）              |
| **No names**        | コンポーネント名（`xlsx`, `code-review`等）が取得できない |
| **No descriptions** | SKILL.md の description が活用されていない                |
| **Marketplace gap** | 未インストールプラグインのコンポーネント情報が欠落        |

---

## Data Source Analysis

### Source 1: Installed Plugin (File System)

```
~/.claude/plugins/marketplaces/{marketplace}/plugins/{plugin}/
├── skills/
│   ├── xlsx/
│   │   └── SKILL.md          ← name, description in frontmatter
│   ├── docx/
│   └── pdf/
├── commands/
│   └── code-review.md        ← filename = command name
├── agents/
│   └── reviewer.md           ← filename = agent name
├── hooks/
│   └── hooks.json            ← JSON structure
├── .claude-plugin/
│   └── plugin.json           ← mcpServers: { "server-name": {...} }
└── .lsp.json                 ← { "typescript": {...}, "python": {...} }
```

**取得可能なデータ**:

| Component Type | Name Source                       | Description Source                   |
| -------------- | --------------------------------- | ------------------------------------ |
| Skills         | Directory name                    | `SKILL.md` frontmatter `description` |
| Commands       | `.md` filename (minus ext)        | First line of file                   |
| Agents         | `.md` filename (minus ext)        | First line of file                   |
| Hooks          | `hooks.json` keys                 | N/A                                  |
| MCP Servers    | `plugin.json` → `mcpServers` keys | N/A                                  |
| LSP Servers    | `.lsp.json` keys                  | N/A                                  |

### Source 2: Marketplace JSON

```json
// ~/.claude/plugins/marketplaces/anthropic-agent-skills/.claude-plugin/marketplace.json
{
  "plugins": [
    {
      "name": "example-skills",
      "description": "Collection of example skills...",
      "skills": ["./skills/xlsx", "./skills/docx", "./skills/pdf"]
    }
  ]
}
```

**取得可能なデータ**:

| Field        | Availability            | Extract Method                           |
| ------------ | ----------------------- | ---------------------------------------- |
| `skills`     | Some marketplaces       | Path basename (`./skills/xlsx` → `xlsx`) |
| `agents`     | Not commonly used       | -                                        |
| `mcpServers` | Not in marketplace JSON | -                                        |

---

## Proposed Data Model

### New Types

```typescript
// source/types/index.ts

/**
 * Individual component information
 */
export interface ComponentInfo {
  /** Component name (e.g., "xlsx", "code-review") */
  name: string
  /** Optional description from SKILL.md or first line */
  description?: string
  /** Component type for display purposes */
  type: ComponentType
}

export type ComponentType =
  | 'skill'
  | 'command'
  | 'agent'
  | 'hook'
  | 'mcp'
  | 'lsp'

/**
 * Detailed component information for a plugin
 * Extends PluginComponents with name arrays
 */
export interface PluginComponentsDetailed {
  /** Skill details (name + optional description) */
  skills?: ComponentInfo[]
  /** Command details */
  commands?: ComponentInfo[]
  /** Agent details */
  agents?: ComponentInfo[]
  /** Hook event names */
  hooks?: string[]
  /** MCP server names */
  mcpServers?: string[]
  /** LSP server language IDs */
  lspServers?: string[]
}

/**
 * Extended Plugin interface
 */
export interface Plugin {
  // ... existing fields ...

  /** Component counts (backward compatible) */
  components?: PluginComponents

  /** Detailed component info (new) */
  componentsDetailed?: PluginComponentsDetailed
}
```

### Extended MarketplacePluginEntry

```typescript
// source/types/index.ts

export interface MarketplacePluginEntry {
  name: string
  description: string
  version?: string
  author?: { name: string; email?: string }
  category?: string
  homepage?: string
  tags?: string[]
  keywords?: string[]

  // NEW: Component paths from marketplace.json
  skills?: string[] // ["./skills/xlsx", "./skills/docx"]
  agents?: string[] // ["./agents/reviewer"]
  commands?: string[] // ["./commands/commit"]
}
```

---

## Implementation Architecture

### Data Loading Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Loading Strategy                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Is Plugin Installed?                                              │
│         │                                                           │
│         ├─── YES ──────────────────────────────────────────────┐    │
│         │                                                      │    │
│         │    ┌────────────────────────────────────────────┐    │    │
│         │    │  componentService.detectComponentsDetailed │    │    │
│         │    │  ───────────────────────────────────────── │    │    │
│         │    │  • Read skills/ directories                │    │    │
│         │    │  • Parse SKILL.md frontmatter              │    │    │
│         │    │  • Read commands/*.md filenames            │    │    │
│         │    │  • Read agents/*.md filenames              │    │    │
│         │    │  • Parse plugin.json mcpServers keys       │    │    │
│         │    │  • Parse .lsp.json keys                    │    │    │
│         │    └────────────────────────────────────────────┘    │    │
│         │                          │                           │    │
│         │                          ▼                           │    │
│         │              PluginComponentsDetailed                │    │
│         │              (full details with descriptions)        │    │
│         │                                                      │    │
│         └──────────────────────────────────────────────────────┘    │
│                                                                     │
│         ├─── NO ───────────────────────────────────────────────┐    │
│         │                                                      │    │
│         │    ┌────────────────────────────────────────────┐    │    │
│         │    │  marketplaceService.parseComponentPaths    │    │    │
│         │    │  ───────────────────────────────────────── │    │    │
│         │    │  • Parse skills[] paths from marketplace   │    │    │
│         │    │  • Extract basename as component name      │    │    │
│         │    │  • No description available                │    │    │
│         │    └────────────────────────────────────────────┘    │    │
│         │                          │                           │    │
│         │                          ▼                           │    │
│         │              PluginComponentsDetailed                │    │
│         │              (names only, no descriptions)           │    │
│         │                                                      │    │
│         └──────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Layer Changes

#### componentService.ts (Modified)

```typescript
/**
 * Detect detailed components for an installed plugin
 * @param installPath - Absolute path to installed plugin
 * @returns Detailed component info with names and descriptions
 */
export function detectComponentsDetailed(
  installPath: string,
): PluginComponentsDetailed | undefined {
  if (!directoryExists(installPath)) {
    return undefined
  }

  const detailed: PluginComponentsDetailed = {}

  // Skills: Read directory names + SKILL.md frontmatter
  const skills = getSkillDetails(installPath)
  if (skills.length > 0) {
    detailed.skills = skills
  }

  // Commands: Read .md filenames
  const commands = getMarkdownFileNames(installPath, 'commands', 'command')
  if (commands.length > 0) {
    detailed.commands = commands
  }

  // Agents: Read .md filenames
  const agents = getMarkdownFileNames(installPath, 'agents', 'agent')
  if (agents.length > 0) {
    detailed.agents = agents
  }

  // MCP Servers: Read plugin.json mcpServers keys
  const mcpServers = getMcpServerNames(installPath)
  if (mcpServers.length > 0) {
    detailed.mcpServers = mcpServers
  }

  // LSP Servers: Read .lsp.json keys
  const lspServers = getLspServerNames(installPath)
  if (lspServers.length > 0) {
    detailed.lspServers = lspServers
  }

  return Object.keys(detailed).length > 0 ? detailed : undefined
}

/**
 * Read skill details from skills/ directory
 */
function getSkillDetails(installPath: string): ComponentInfo[] {
  const skillsPath = path.join(installPath, 'skills')
  if (!directoryExists(skillsPath)) return []

  const entries = fs.readdirSync(skillsPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillMdPath = path.join(skillsPath, entry.name, 'SKILL.md')
      const description = parseSkillMdDescription(skillMdPath)
      return {
        name: entry.name,
        description,
        type: 'skill' as ComponentType,
      }
    })
}

/**
 * Parse SKILL.md frontmatter for description
 */
function parseSkillMdDescription(skillMdPath: string): string | undefined {
  if (!fileExists(skillMdPath)) return undefined

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8')
    const match = content.match(
      /^---\n[\s\S]*?description:\s*["']?(.+?)["']?\n[\s\S]*?---/m,
    )
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}
```

#### pluginService.ts (Modified)

```typescript
export function loadAllPlugins(): Plugin[] {
  // ... existing code ...

  for (const plugin of manifest.plugins) {
    const pluginId = `${plugin.name}@${marketplace}`
    const installedEntry = installedMap.get(pluginId)

    // Existing: Component counts
    const components = installedEntry
      ? detectPluginComponents(installedEntry.installPath)
      : undefined

    // NEW: Detailed component info
    let componentsDetailed: PluginComponentsDetailed | undefined

    if (installedEntry) {
      // Installed: Full details from file system
      componentsDetailed = detectComponentsDetailed(installedEntry.installPath)
    } else if (plugin.skills || plugin.agents) {
      // Not installed: Parse from marketplace JSON
      componentsDetailed = parseMarketplaceComponents(plugin)
    }

    plugins.push({
      // ... existing fields ...
      components,
      componentsDetailed, // NEW
    })
  }
}

/**
 * Parse component names from marketplace plugin entry
 */
function parseMarketplaceComponents(
  plugin: MarketplacePluginEntry,
): PluginComponentsDetailed | undefined {
  const detailed: PluginComponentsDetailed = {}

  if (plugin.skills?.length) {
    detailed.skills = plugin.skills.map((skillPath) => ({
      name: path.basename(skillPath),
      type: 'skill' as ComponentType,
    }))
  }

  if (plugin.agents?.length) {
    detailed.agents = plugin.agents.map((agentPath) => ({
      name: path.basename(agentPath),
      type: 'agent' as ComponentType,
    }))
  }

  return Object.keys(detailed).length > 0 ? detailed : undefined
}
```

---

## Data Availability Matrix

| Scenario                         | Skills Names  | Skills Desc | Commands     | Agents       | MCP            | LSP          |
| -------------------------------- | ------------- | ----------- | ------------ | ------------ | -------------- | ------------ |
| **Installed**                    | ✅ Dir names  | ✅ SKILL.md | ✅ .md files | ✅ .md files | ✅ plugin.json | ✅ .lsp.json |
| **Not installed (has skills[])** | ✅ From path  | ❌          | ❌           | ❌           | ❌             | ❌           |
| **Not installed (no skills[])**  | ❌ Count only | ❌          | ❌           | ❌           | ❌             | ❌           |

---

## UI Display Logic

```typescript
// ComponentList.tsx

function ComponentList({ plugin }: Props) {
  const { components, componentsDetailed } = plugin

  // Priority: detailed > counts
  if (componentsDetailed?.skills?.length) {
    // Show skill names
    return <SkillList items={componentsDetailed.skills} />
  } else if (components?.skills) {
    // Fallback: show count only
    return <Text>Skills: {components.skills}</Text>
  }
}
```

---

## Performance Considerations

| Operation           | Cost        | Mitigation                   |
| ------------------- | ----------- | ---------------------------- |
| Reading SKILL.md    | IO bound    | Lazy load on detail view     |
| Parsing frontmatter | CPU (regex) | Cache parsed results         |
| Directory listing   | IO bound    | Already done in current impl |

### Recommended Strategy

1. **Initial load**: Only load component **names** (fast)
2. **On detail view**: Load **descriptions** lazily
3. **Cache**: Store parsed data in memory during session

---

## Migration Path

### Phase 1: Types & Basic Implementation (This PR)

1. Add `ComponentInfo` and `PluginComponentsDetailed` types
2. Implement `detectComponentsDetailed()` for installed plugins
3. Update UI to display names (fallback to counts)

### Phase 2: Marketplace Integration (Future)

1. Update marketplace JSON schema to include `skills[]`
2. Implement `parseMarketplaceComponents()`
3. Display names for non-installed plugins

### Phase 3: Descriptions (Future Enhancement)

1. Parse SKILL.md frontmatter
2. Add tooltip/hover for descriptions
3. Consider async loading for performance

---

## Testing Strategy

### Unit Tests

```typescript
describe('componentService', () => {
  describe('detectComponentsDetailed', () => {
    it('returns skill names from directory', () => {
      const result = detectComponentsDetailed('/path/to/plugin')
      expect(result?.skills).toContainEqual({
        name: 'xlsx',
        type: 'skill',
      })
    })

    it('parses SKILL.md description', () => {
      const result = detectComponentsDetailed('/path/to/plugin')
      expect(result?.skills?.[0].description).toContain('spreadsheet')
    })

    it('returns undefined for non-existent path', () => {
      const result = detectComponentsDetailed('/non/existent')
      expect(result).toBeUndefined()
    })
  })
})
```

### Integration Tests

- Verify data flows correctly to UI
- Test fallback behavior (detailed → counts)
- Test with real marketplace data

---

## Decision Log

| Decision                      | Choice                                       | Rationale                |
| ----------------------------- | -------------------------------------------- | ------------------------ |
| Data source for installed     | File system                                  | Most accurate, real-time |
| Data source for non-installed | Marketplace JSON                             | Only available source    |
| Description loading           | Lazy                                         | Performance optimization |
| Type structure                | Separate `ComponentInfo`                     | Reusable, clear contract |
| Backward compatibility        | Keep `components` + add `componentsDetailed` | Non-breaking change      |

---

## References

- [Issue #17](https://github.com/laststance/claude-plugin-dashboard/issues/17)
- [plan.md](../../plan.md)
- Serena Memory: `ui_patterns_component_list_wireframes`
- Serena Memory: `decision_2026-01-15_component_list_pattern4`
