# AGENTS.md

## Project Overview

This project adds a userscript feature to Bruno (API client), providing a one-click copy button for network logs and responses.

## Repository Structure

| File | Description |
|------|-------------|
| `src.js` | The userscript itself. Runs as an IIFE in Bruno's renderer process |
| `build-bruno-with-userscripts.sh` | Automates Bruno clone → patch apply → build |
| `bruno-userscript-feature.patch` | Patch that adds userscript loading to Bruno (target version is defined by `BRUNO_TAG` in the build script) |
| `.agents/skills/updating-bruno-userscript-patch/` | Skill for regenerating the patch |

## Important Notes

### Patch File Management

- `bruno-userscript-feature.patch` depends on the Bruno version specified by `BRUNO_TAG` in `build-bruno-with-userscripts.sh`
- When upgrading Bruno's version, patch context lines may no longer match, causing `git apply` to fail
- When updating the patch, **always clone and read the target version's source first**. Never reuse line numbers or indentation from a previous version
- Never hand-write patch files. **Apply changes via `edit_file`, then generate the patch with `git diff`** — this is the only reliable method

### Patch Update Procedure

The `updating-bruno-userscript-patch` Skill contains detailed steps. Summary:

1. Clone the target Bruno version
2. Read each file to understand the current code structure
3. Apply changes with `edit_file`
4. Generate the patch with `git diff HEAD` (run `git add` for new files first)
5. Verify with `git apply --check`

### Updating build-bruno-with-userscripts.sh

When changing the target version, update the `BRUNO_TAG` variable.

## Coding Conventions

### src.js

- Wrap in an IIFE `(() => { ... })()` and `return` a cleanup function at the end
- Consolidate settings in the `Config` object
- Separate concerns: `DomOperations` for DOM manipulation, `DataProcessor` for data handling, `Utils` for utilities
- Always mask sensitive information (Cookie, Bearer tokens, etc.)

### Files Modified by the Patch (Bruno side)

The patch modifies the following under `packages/bruno-electron/`:

- `.gitignore` — adds `userscripts/`
- `src/app/apiSpecsWatcher.js` — adds `closeAll()` method
- `src/app/collection-watcher.js` — adds `closeAll()` method
- `src/app/workspace-watcher.js` — adds `closeAll()` method
- `src/index.js` — adds userscript loading, cleanup, and watcher shutdown logic
- `src/utils/userscripts.js` — new file (userscript utilities)
