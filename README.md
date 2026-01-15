# Claude Code Plugin Dashboard

[![npm version](https://img.shields.io/npm/v/@laststance/claude-plugin-dashboard)](https://www.npmjs.com/package/@laststance/claude-plugin-dashboard)
[![CI](https://github.com/laststance/claude-plugin-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/laststance/claude-plugin-dashboard/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/laststance/claude-plugin-dashboard/graph/badge.svg?token=LO8NM55XCF)](https://codecov.io/gh/laststance/claude-plugin-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An interactive CLI dashboard to browse, install, and manage [Claude Code](https://claude.ai/code) plugins.
Built with [Ink](https://github.com/vadimdemedes/ink) (React for CLI).

<p align="center">
  <img src="./assets/image.png" alt="Dashboard Screenshot" width="800">
</p>

## Features

- ✅ **Enabled** - Default view showing active plugins (installed AND enabled)
- 📦 **Install/Uninstall** - Install and uninstall plugins directly from the dashboard
- 🔄 **Enable/Disable** - Toggle plugins on/off with a single key
- 🔍 **Discover** - Browse 100+ plugins from multiple marketplaces
- 🏪 **Marketplaces** - Add, remove, and update plugin sources
- ⚠️ **Errors** - Debug plugin issues
- ⌨️ **Focus Zone Navigation** - 3-zone keyboard model (TabBar → Search → List)
- 🆘 **Help Overlay** - Press `h` for full keyboard shortcuts
- 🎨 **Beautiful TUI** - Terminal UI that matches Claude Code's design

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [Claude Code](https://claude.ai/code) installed (`~/.claude` directory must exist)

## Installation

```bash
npx @laststance/claude-plugin-dashboard@latest

```

```bash
npm install -g @laststance/claude-plugin-dashboard@latest
```

## Usage

### Interactive Mode

```bash
claude-plugin-dashboard
```

This opens the interactive TUI dashboard.

**Keyboard Shortcuts:**

| Key       | Action                                        |
| --------- | --------------------------------------------- |
| `↑` `↓`   | Navigate within zone / Move between zones     |
| `←` `→`   | Switch tabs (when TabBar focused)             |
| `^P` `^N` | Navigate list (Emacs-style vertical)          |
| `^B` `^F` | Switch tabs (Emacs-style horizontal)          |
| `Tab`     | Next tab                                      |
| `i`       | Install selected plugin                       |
| `u`       | Uninstall selected plugin (with confirm)      |
| `Space`   | Toggle plugin enable/disable                  |
| `Enter`   | Install (Discover) / Toggle (Installed)       |
| `/`       | Search (works on all plugin/marketplace tabs) |
| `s`       | Cycle sort options (Installs → Name → Date)   |
| `S`       | Toggle sort order (Asc/Desc)                  |
| `a`       | Add marketplace (Marketplaces tab)            |
| `d`       | Remove marketplace (Marketplaces tab)         |
| `r`       | Update marketplace (Marketplaces tab)         |
| `h`       | Show help overlay                             |
| `Esc`     | Clear search / Close dialog / Cancel          |
| `q`/`^C`  | Quit                                          |

### Command Line Mode

```bash
# Show summary statistics
claude-plugin-dashboard status

# List all plugins
claude-plugin-dashboard list

# List installed plugins only
claude-plugin-dashboard list --installed

# List plugins from specific marketplace
claude-plugin-dashboard list --marketplace claude-plugins-official

# Show plugin details
claude-plugin-dashboard info context7@claude-plugins-official

# Enable a plugin
claude-plugin-dashboard enable context7@claude-plugins-official

# Disable a plugin
claude-plugin-dashboard disable context7@claude-plugins-official

# Toggle plugin state
claude-plugin-dashboard toggle context7@claude-plugins-official

# Show help
claude-plugin-dashboard help
```

## Dashboard Tabs

### Enabled (Default)

View your currently active plugins (installed AND enabled):

- Shows only plugins that are ready to use
- Quick status overview of your Claude Code setup
- Toggle plugins on/off with `Space`
- Search with `/` to filter enabled plugins

### Installed

Manage your installed plugins:

- See enabled (●) and disabled (◐) status at a glance
- Toggle plugins on/off with `Space`
- Uninstall plugins with `u` (with Y/N confirmation)
- Search installed plugins with `/`

### Discover

Browse all available plugins from all configured marketplaces:

- Search by name, description, or tags
- Sort by install count, name, or date
- Install plugins with `i` key or `Enter`
- View plugin details including install count and description

### Marketplaces

Manage plugin sources:

- **Add** marketplace with `a` key (supports GitHub shorthand, Git URLs, local paths)
- **Remove** marketplace with `d` key (with confirmation)
- **Update** marketplace catalog with `r` key
- Search marketplaces with `/`
- View plugin counts and last update times

### Errors

Debug plugin issues:

- View plugin-related errors
- Check error details and timestamps

## How It Works

This tool reads and modifies Claude Code's configuration files:

| File                                          | Purpose                     |
| --------------------------------------------- | --------------------------- |
| `~/.claude/settings.json`                     | Plugin enable/disable state |
| `~/.claude/plugins/installed_plugins.json`    | Installation metadata       |
| `~/.claude/plugins/known_marketplaces.json`   | Marketplace sources         |
| `~/.claude/plugins/install-counts-cache.json` | Global install statistics   |
| `~/.claude/plugins/marketplaces/`             | Plugin catalogs             |

**Note:** The dashboard executes `claude plugin install/uninstall` commands internally via subprocess.

## Status Icons

| Icon       | Meaning              |
| ---------- | -------------------- |
| ● (green)  | Installed & Enabled  |
| ◐ (yellow) | Installed & Disabled |
| ○ (gray)   | Not Installed        |

## Troubleshooting

### "Claude Code not found"

Make sure Claude Code is installed and `~/.claude` directory exists.

```bash
ls -la ~/.claude/settings.json
```

### "Permission denied"

Check that you have read/write access to `~/.claude/settings.json`.

```bash
chmod 644 ~/.claude/settings.json
```

### Plugins not showing up

Run the status command to check data:

```bash
claude-plugin-dashboard status
```

If counts are zero, ensure Claude Code has been used at least once to initialize the plugin directory.

## Cross-Platform Support

This tool works on:

- ✅ macOS
- ✅ Linux
- ✅ Windows (with Node.js 20+)

The tool uses `os.homedir()` and `path.join()` for cross-platform path handling.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Local Development

```bash
git clone https://github.com/laststance/claude-plugin-dashboard.git
cd claude-plugin-dashboard
pnpm install
pnpm build
pnpm start
```

## Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) v5 - React for CLI
- [React](https://react.dev/) 18 - UI components
- [TypeScript](https://www.typescriptlang.org/) 5 - Type safety
- ESM modules

## License

MIT © [Laststance.io](https://github.com/laststance)

## Related Projects

- [Claude Code](https://claude.ai/code) - AI-powered coding assistant by Anthropic
- [Ink](https://github.com/vadimdemedes/ink) - React for interactive command-line apps
- [SuperClaude](https://github.com/SuperClaude-Org/SuperClaude_Framework) - Claude Code enhancement framework

## Changelog

### v0.2.2

- Claude Code v2.1.3 compatibility (unified Skills/Commands model)

### v0.2.1

- **Marketplace Management**: Add/remove/refresh marketplaces directly from dashboard
- **Plugin Component Types**: Display skills, agents, hooks, MCP servers in detail view
- **Bug Fix**: Search filter now works correctly in Enabled and Installed tabs
- **CI/CD**: GitHub Actions workflow, CI and Codecov badges

### v0.2.0

- **Enabled tab**: New default view showing active plugins (installed AND enabled)
- **Focus zone navigation**: 3-zone keyboard model (TabBar → Search → List)
- **Emacs keybindings**: `Ctrl+B`/`Ctrl+F` for horizontal tab switching
- **Marketplace management**: Add (`a`), remove (`d`), update (`r`) plugin sources
- **Search on all tabs**: `/` now works on Enabled, Installed, and Marketplaces tabs
- **Help overlay**: Press `h` to show all keyboard shortcuts
- **Context-aware Enter**: Installs on Discover, toggles on Installed/Enabled
- **Plugin component types**: Show component types (skill, hook, agent) in detail view
- **CI/CD**: GitHub Actions workflow for lint, test, and build
- **96.67% test coverage**: Comprehensive Vitest and E2E test suites

### v0.1.1

- Fix: Clear terminal screen when exiting dashboard
- Fix: Repository URL in package.json

### v0.1.0

- Initial release
- Interactive dashboard with 4 tabs (Discover, Installed, Marketplaces, Errors)
- Plugin install/uninstall functionality (`i`/`u` keys)
- Plugin enable/disable functionality (`Space` key)
- Emacs-style navigation (`Ctrl+P`/`Ctrl+N`)
- CLI commands for non-interactive use
- Search, sort, and filter support
