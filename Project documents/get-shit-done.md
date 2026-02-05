# Get Shit Done (GSD) System

This project uses the [Get Shit Done (GSD)](https://github.com/glittercowboy/get-shit-done) system for spec-driven development with Claude Code. It allows for a structured workflow from idea to verification.

## Installation

To install the GSD tools, run:

```bash
npx get-shit-done-cc
```

The installer will prompt you for the runtime (Claude Code, OpenCode, Gemini) and location (Global or Local).

## Core Workflow

The GSD system follows a 5-step detailed workflow:

### 1. Initialize Project
Start a new project or feature set. The system will interview you to understand requirements and create a roadmap.

```bash
/gsd:new-project
```

### 2. Discuss Phase
Before planning, discuss the specific phase to shape the implementation details (visuals, APIs, etc.).

```bash
/gsd:discuss-phase [N]
```
*Replace `[N]` with the phase number from your roadmap.*

### 3. Plan Phase
The system researches and creates atomic task plans for the phase.

```bash
/gsd:plan-phase [N]
```

### 4. Execute Phase
Claude Code executes the plans in waves, creating atomic commits for each task.

```bash
/gsd:execute-phase [N]
```

### 5. Verify Work
An interactive verification process to ensure the work meets your expectations, not just that tests pass.

```bash
/gsd:verify-work [N]
```

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `/gsd:progress` | Check the current progress of the project. |
| `/gsd:help` | Show all available GSD commands. |
| `/gsd:update` | Update the GSD system tools. |
| `/gsd:map-codebase` | For brownfield projects, map the existing codebase. |
| `/gsd:pause-work` | Pause the current session. |
| `/gsd:resume-work` | Resume a paused session. |

## Configuration

### Recommended: Skip Permissions
For a frictionless experience, it is recommended to run Claude Code with the skip permissions flag, as GSD automates many git and file operations.

```bash
claude --dangerously-skip-permissions
```

Alternatively, you can configure your `.claude/settings.json` to allow specific bash commands as detailed in the [official documentation](https://github.com/glittercowboy/get-shit-done#recommended-skip-permissions-mode).

## Updates

To keep the tool updated:

```bash
npx get-shit-done-cc@latest
```
