# ProjCLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

CLI **`proj`** for organizing local project workspaces: a fixed folder layout per project, `.projrc` metadata, tags, git clone helpers, and shell-friendly paths.

This tool is built for **my own** local project workflow (naming rules, directory layout, metadata). You can use or fork it as you like; defaults are not meant to fit every team out of the box.

## Contents

- [ProjCLI](#projcli)
  - [Contents](#contents)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Quick start](#quick-start)
  - [Project layout](#project-layout)
  - [`.projrc`](#projrc)
  - [Setup](#setup)
  - [Shell `cd`](#shell-cd)
  - [Shell completion](#shell-completion)
  - [Machine-readable listing](#machine-readable-listing)
  - [Folder naming](#folder-naming)
  - [Tag registry: `{root}/.tags`](#tag-registry-roottags)
  - [Commands (summary)](#commands-summary)
  - [License](#license)

## Features

- Named **projects root** and optional **workspaces** (`proj dir`, `proj use`)
- **Scaffold** new projects or **import** existing folders (`proj new`)
- **Clone** into the standard layout (`proj clone`)
- **List / filter** projects, JSON output (`proj ls`)
- **Tags** with optional root registry (`.tags`)
- **Favorites**, **rename** (`proj mv`), **remove** (`proj rm`)
- **Status** and key/value **get/set** on `.projrc`
- **Named editor templates** (`proj editor`) for `proj open` (placeholders `$dir`, `$root`, `$rc_<key>`)
- **bash / zsh / fish / PowerShell** completion

## Requirements

- [Node.js](https://nodejs.org/) **18** or newer

## Installation

**From a Git clone** (recommended for contributors and local installs):

```bash
git clone https://github.com/SpireX64/ProjCLI.git ./projcli
cd projcli
npm install -g .
```

**From a checkout you already have:**

```bash
npm install -g .
```

On **Windows**, npm installs `proj.cmd` alongside the script; the shebang in `bin/proj.js` is for Unix-like systems.

For local development without a global install, you can use `npm link` from the repo root.

## Quick start

```bash
proj dir /path/to/your/projects
proj new /path/to/pa_MyApp    # or: proj clone https://github.com/you/repo.git
```

Then use `proj ls`, `proj pwd <name>`, and `proj --help` / `proj <command> --help`.

## Project layout

Each project is a single folder under your [projects root](#setup). Its name follows the [folder naming](#folder-naming) rules, for example `pa_MyApp` or `pa_MyApp_web-rn`. After `proj new`, that folder contains:

```
pa_MyApp_web/       # example basename (yours will differ)
├── .projrc         # metadata (name, owner, created, custom key = value)
├── worktrees/      # git worktrees: <ProjectName>-main (primary), <ProjectName>-<slug> (extras)
├── notes/          # project notes (e.g. *.md, *.drawio, *.txt)
├── tasks/          # active tasks as *.txt in this folder
│   ├── archive/    # finished tasks (*.txt)
│   └── backlog/    # future tasks (*.txt)
├── etc/            # configs, drafts, misc.
```

If you point `proj new` at an **existing directory**, its contents are moved into `worktrees/<ProjectName>-main/` (whether or not there is a `.git` folder), then the old directory is removed. With a TTY you confirm removal unless you pass `--force`; without a TTY, import requires `--force`. `--dry-run` skips import and removal.

## `.projrc`

Plain text: a trimmed line that is empty or starts with `#` is a comment. Lines are `key = value` (spaces around `=` allowed). After the value, whitespace plus `#…` is stripped so you can annotate; URLs like `https://host/path#fragment` stay intact (no space before `#`). Keys are case-insensitive; empty values are ignored.

- `name` — display title (default: folder `ProjectName`)
- `owner` — optional (also prompted on `proj new` / `proj clone`)
- `created` — ISO timestamp (set automatically; from first commit in `worktrees/<ProjectName>-main/` when available)
- `editor` — optional name of a template saved with `proj editor` (used by `proj open` when no editor is passed on the command line)
- Any other keys (e.g. `tracker`, `workspace`, `deploy`) are shown in `proj status <name>` and `proj get`.

`proj verify` creates a missing `.projrc` for each valid project folder (migration).

## Setup

Set your projects root (stored in `~/.config/proj/config.json`):

```bash
proj dir /path/to/your/projects
```

Saved **workspaces** (named roots):

```bash
proj dir /other/path -w work      # register + switch root to /other/path
proj dir -w home                  # save current root as "home"
proj use                          # list workspaces
proj use work                     # switch root
```

If the root is not set, commands that need it exit with an error and print a hint on **stdout**, e.g. `Run: proj dir /path/to/your/projects`.

## Shell `cd`

This program cannot change your current shell directory. Print a project path and change directory in the shell:

```bash
cd "$(proj pwd MyProjectName)"       # main worktree (same default as proj open)
cd "$(proj pwd MyProjectName -r)"    # pa_* project root (notes/, tasks/, worktrees/, …)
```

(`MyProjectName` is the PascalCase middle segment of the folder name, or the full project basename.)

Monorepo subfolders: in `.projrc` set paths relative to a worktree, e.g. `p_core = packages/core`.
Then `proj open MyProject -p core` or `proj pwd MyProject -p core` uses that folder under the
main worktree (or under `--wt <slug>`). Keys use the `p_` prefix and are lowercased like other `.projrc` keys.

## Shell completion

```bash
# bash
source <(proj completion bash)

# zsh — add to ~/.zshrc
source <(proj completion zsh)

# fish — save and source, or use `fish -c "source (proj completion fish | psub)"`
proj completion fish | source

# PowerShell — run once or add to profile
iex (proj completion powershell | Out-String)
```

After `npm install -g`, re-source if the `proj` path changes.

## Machine-readable listing

```bash
proj ls --json | jq .
```

Output is a single compact JSON array (no indentation). Each entry includes `basename`, `path`, `own`, `type`, `projectName`, `tags`, `displayName`, `favorite`.

In a color-capable TTY (unless `NO_COLOR` is set), human-readable `proj ls` / `proj status` output uses subtle coloring when `FORCE_COLOR` is set or stdout is a TTY.

## Folder naming

- `{own}{type}_{ProjectName}` or `{own}{type}_{ProjectName}_{tag-tag-...}`
- `own`: one of `p`, `g`, `s`, `w` (lowercase)
- `type`: one of `a`, `p`, `x` (lowercase)
- `ProjectName`: strict PascalCase, 1–42 characters
- Tags: 0–5 segments, hyphen-separated, each **camelCase** (e.g. `rn`, `web`, `iosApp`)

`ProjectName` must be **unique** among all valid project folders under the root.

## Tag registry: `{root}/.tags`

One line per tag: first token is the tag id (camelCase), rest of the line is an optional description (no newlines). Example:

```
web     Browser and web UI
rn      Uses React Native
```

If `.tags` is empty or missing, `proj new` / `proj mv` warn that tags are not checked against a registry. If ids are defined, every tag segment used in a project folder must exist in `.tags`.

Commands:

```bash
proj tag web "Browser work"
proj tag -d web    # fails if any project still uses tag web
```

## Commands (summary)

| Command | Purpose |
|--------|---------|
| `proj dir [path] [-w name]` | Show/set root; register named workspace (see Setup) |
| `proj use [name]` | List or switch workspaces |
| `proj pwd [name] [-r] [--wt [slug]] [-p id]` | Print root, main worktree, other worktree, or monorepo subpath |
| `proj ls [--json] [-f] [--grep re] [-o chars] [-t chars] [tags...]` | List projects |
| `proj tags` | Print all tag ids and descriptions from `.tags` |
| `proj new [path] [--dry-run] [--force]` | Create layout + `.projrc` (import: TTY confirm or `--force`) |
| `proj clone <url>` | New layout + `git clone` into `worktrees/<ProjectName>-main/` |
| `proj editor <name> <template>` | Save a shell command template for editors |
| `proj open <name> [-r] [--wt slug] [-p id] [editor]` | Open main worktree, root, extra worktree, or monorepo subfolder |
| `proj wt <name> <slug> [-b branch]` | Add linked git worktree under `worktrees/` |
| `proj status [name] [--json]` | Summary or one-project detail; `--json` for machine-readable output |
| `proj get <name> <key>` | One value from `.projrc` (for scripts) |
| `proj set <name> <key> <value...>` | Set one key in `.projrc` |
| `proj fav` / `proj fav -d` | Favorites under `.fav/` |
| `proj mv` | Rename under project root |
| `proj rm <name> [--force]` | Remove project directory (confirm; favorites need `--force` or unfav first) |
| `proj tag` / `proj tag -d` | Maintain `.tags` |
| `proj verify` | Validate tree + write missing `.projrc` |
| `proj completion bash\|zsh\|fish\|powershell` | Print completion script (`pwsh` alias) |

Use `proj <command> --help` for English help text.


## License

ProjCLI  is released under the [MIT License](LICENSE).
Copyright (c) [Artem Sobolenkov](https://github.com/SpireX64).
