# BetterPack - A Universal Node.js Package Manager CLI

BetterPack (`bpack`) is a command-line interface (CLI) tool designed to simplify package management across different Node.js ecosystems. It automatically detects the package manager used in your project (`npm`, `yarn`, or `pnpm`) and translates universal commands into the appropriate commands for that manager.

[View on npm](https://www.npmjs.com/package/betterpack)

## Support the Project

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/involvex)

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

*   `gemini`: Start a chat with Gemini.
*   `host`: Start a web server from the current folder (default port 4020).
*   `listversions`: List installed versions of all supported package managers.
*   `manage`: Manage global packages or the package managers themselves.
    *   `bpack manage <pm> <action> [args]`: Manage global packages.
    *   `bpack manage selfupdate`: Update betterpack.
    *   `bpack manage about <github|npmjs>`: Open the project's GitHub repository or npm page.
    *   `bpack manage support`: Open the "Buy Me a Coffee" page.
*   `node`: Execute a JavaScript file using Node.js.
*   `watch`: Watch for file changes and auto-restart a process.
*   `repair`: Attempt to repair a broken installation.
*   `noinstall <command>`: Run a command without installing the package globally.
*   `create-shortcut <shortcut> <command>`: Create a shortcut for a bpack command.

## Installation (for development/testing)

To make `bpack` available as a global command for testing, navigate to the `betterpack` directory and run:

```bash
npm link
```

This will symlink the `bpack` command to your global Node.js executables.

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
