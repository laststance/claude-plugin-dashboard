# Claude Code Plugin Dashboard - AI Coding Guidelines

## Project Overview

This is an interactive CLI dashboard for managing Claude Code plugins, built with Ink (React for CLI). It provides both an interactive TUI and command-line interface for browsing, installing, and managing plugins from multiple marketplaces.

## Architecture

- **Framework**: Ink + React for terminal UI
- **Language**: TypeScript with ES modules
- **State Management**: useReducer pattern with actions
- **Data Sources**: Aggregates plugin data from multiple JSON files in `~/.claude/` directory
- **Plugin ID Format**: `"name@marketplace"` (e.g., `"context7@claude-plugins-official"`)

## Key Directories & Files

- `source/app.tsx` - Main app component with reducer and state management
- `source/cli.tsx` - CLI entry point supporting both interactive and command modes
- `source/services/` - Data services (pluginService, settingsService, pluginActionsService, fileService)
- `source/components/` - Reusable UI components (PluginList, SearchInput, TabBar, etc.)
- `source/tabs/` - Tab components (DiscoverTab, EnabledTab, InstalledTab, etc.)
- `source/types/index.ts` - TypeScript interfaces for all data structures
- `source/utils/paths.ts` - Cross-platform file path constants for `~/.claude/` directory

## Development Workflows

### Build & Run

```bash
pnpm install          # Install dependencies
pnpm build            # Compile TypeScript to dist/
pnpm dev              # Watch mode compilation
pnpm start            # Run CLI (node dist/cli.js)
pnpm link             # Build and link globally for testing
```

### Testing

```bash
pnpm test             # Vitest in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Run with coverage report
```

### E2E Testing

```bash
# From e2e/ directory using pytest + pexpect
~/.local/pipx/venvs/pytest/bin/pytest e2e/ -v
```

### Code Quality

```bash
pnpm prettier         # Format all code
```

## Data Flow & State Management

- **Reducer Actions**: Use `appReducer` in `app.tsx` for all state changes
- **Focus Zones**: Navigation uses `tabbar`, `search`, `list` zones (errors tab lacks search)
- **Data Loading**: Services aggregate data from:
  - `~/.claude/marketplaces/{marketplace}/marketplace.json`
  - `~/.claude/plugins/installed_plugins.json`
  - `~/.claude/settings.json`
  - `~/.claude/plugins/install-counts-cache.json`

## Component Patterns

- **Props Interface**: Define interfaces for all component props
- **JSDoc Examples**: Include `@example` usage in JSDoc comments
- **File Extensions**: Use `.tsx` for React components, `.ts` for utilities
- **Import Style**: Use `.js` extensions in imports (ES modules convention)

## Testing Patterns

- **Mock Services**: Mock all service functions in unit tests
- **Test Reducer Logic**: Focus on testing state transitions, not service calls
- **Component Tests**: Use ink-testing-library for CLI component testing
- **E2E Tests**: Use pytest + pexpect for terminal interaction testing

## Plugin Management

- **Installation**: Modifies `installed_plugins.json` and symlinks in `~/.claude/plugins/`
- **Enabling**: Updates `settings.json` enabledPlugins object
- **Marketplaces**: Each marketplace has its own directory with `marketplace.json`
- **Local Plugins**: Support development plugins with `isLocal` flag

## Cross-Platform Compatibility

- **Paths**: Use `os.homedir()` and `path.join()` for all file operations
- **Claude Directory**: All data stored under `~/.claude/` (cross-platform)
- **Package Manager**: pnpm with lockfile for reproducible builds

## Keyboard Navigation

- **Emacs-style**: `^P`/`^N` for up/down, `Tab` for next tab
- **Arrow Keys**: `←`/`→` for tabs, `↑`/`↓` for lists
- **Actions**: `i` install, `u` uninstall, `Space` toggle, `Enter` details, `/` search, `q` quit

## Common Patterns

- **Error Handling**: Check `fileExists()` before reading JSON files
- **Async Operations**: Use promises for plugin install/uninstall operations
- **Filtering**: Combine search, sort, and tab filtering in `getFilteredPlugins()`
- **Statistics**: Aggregate counts from multiple data sources for status displays</content>
  <parameter name="filePath">.github/copilot-instructions.md
