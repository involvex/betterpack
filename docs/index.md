---
title: BetterPack Documentation
layout: default
---

# BetterPack - A Universal Node.js Package Manager CLI

BetterPack (`bpack`) is a command-line interface (CLI) tool designed to simplify package management across different Node.js ecosystems. It automatically detects the package manager used in your project (`npm`, `yarn`, or `pnpm`) and translates universal commands into the appropriate commands for that manager.

[View on npm](https://www.npmjs.com/package/betterpack)

## Support the Project

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/involvex)

## Installation

```bash
npm i betterpack
```

## Supported Package Managers

*   **npm** (Node.js Package Manager)
*   **yarn**
*   **pnpm**
*   **bun**

## Universal Commands

BetterPack provides a consistent set of commands:

*   `install`: Install dependencies.
*   `add <package>`: Add a new package/dependency.
*   `remove <package>`: Remove an existing package/dependency.
*   `update`: Update dependencies.
*   `run <script>`: Run a script defined in the project's `package.json`.
*   `test`: Run tests.
*   `build`: Build the project.
*   `outdated`: Check for outdated dependencies.
*   `list`: List installed packages.
*   `doctor`: Run a health check on the project.

## Betterpack Commands

### `bpack gemini`
Starts an interactive chat session with Google's Gemini AI.

### `bpack host`
Starts a local web server in the current directory.
*   **Default Port**: `4020`
*   **Default Host**: `0.0.0.0`

### `bpack listversions`
Lists the installed versions of all supported package managers.

### `bpack manage`
A suite of commands for managing global packages and the tool itself.
*   `bpack manage <pm> <action> [args]`: Manage global packages for a specific package manager.
*   `bpack manage selfupdate`: Automatically updates `betterpack` to the latest version.
*   `bpack manage about <github|npmjs>`: Opens the project's GitHub repository or npm page in your browser.
*   `bpack manage support`: Opens the "Buy Me a Coffee" page to support the project.

### `bpack node <file>`
Executes a JavaScript file using Node.js.

### `bpack watch <file>`
Watches a file for changes and automatically restarts the process.

### `bpack repair`
Attempts to repair a broken `betterpack` installation by reinstalling it and clearing package manager caches.

### `bpack noinstall <command>`
Runs a command without installing the package globally, using `pnpm dlx` or `yarn dlx`.

### `bpack create-shortcut <shortcut> <command>`
Creates a shortcut for a `bpack` command. For example, `bpack create-shortcut bl bpack list` will allow you to run `bpack list` by simply typing `bl`.

## Usage

Navigate to your Node.js project directory (where you have a `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` file) and run `bpack` followed by the universal command and any arguments.

```bash
bpack install
bpack add express
bpack run dev
bpack test
```

BetterPack will detect the package manager based on the lock file present and execute the corresponding command.

## How it Works

1.  **Detection:** BetterPack checks for the presence of `package-lock.json` (for npm), `yarn.lock` (for yarn), or `pnpm-lock.yaml` (for pnpm) in the current directory to identify the active package manager.
2.  **Translation:** Based on the detected package manager, it translates the universal command (e.g., `install`) into the manager-specific command (e.g., `npm install`, `yarn install`, `pnpm install`).
3.  **Execution:** The translated command is then executed using Node.js's `child_process.spawn`.
