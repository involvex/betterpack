#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const availablePmPaths = {}; // New global variable

const PACKAGE_MANAGERS = {
    "npm": {
        "commands": {
            "install": "install",
            "add": "install",
            "remove": "uninstall",
            "update": "update",
            "run": "run",
            "test": "test",
            "build": "build",
            "list": "list",
            "pack": "pack",
            "cache": { "cmd": "cache", "args": ["clean", "--force"] },
            "ci": "ci",
            "doctor": "doctor",
            "link": "link",
            "global": { "cmd": "list", "args": ["-g"] },
            "outdated": "outdated",
            "search": "search",
            "start": "start",
            "audit": "audit",
            "audit:fix": { "cmd": "audit", "args": ["fix"] },
            "lint": { "cmd": "run", "args": ["lint"] },
            "lint:fix": { "cmd": "run", "args": ["lint", "--", "--fix"] }
        }
    },
    "yarn": {
        "commands": {
            "install": "install",
            "add": "add",
            "remove": "remove",
            "update": "upgrade",
            "run": "run",
            "test": "test",
            "build": "build",
            "list": "list",
            "pack": "pack",
            "cache": { "cmd": "cache", "args": ["clean"] },
            "ci": { "cmd": "install", "args": ["--immutable"] },
            "doctor": "doctor",
            "link": "link",
            "global": { "cmd": "global", "args": ["list"] },
            "outdated": "outdated",
            "search": null,
            "start": "start",
            "audit": { "cmd": "npm", "args": ["audit"] },
            "audit:fix": { "cmd": "npm", "args": ["audit", "fix"] },
            "lint": "lint",
            "lint:fix": { "cmd": "lint", "args": ["--fix"] }
        }
    },
    "pnpm": {
        "commands": {
            "install": "install",
            "add": "add",
            "remove": "remove",
            "update": "update",
            "run": "run",
            "test": "test",
            "build": "build",
            "list": "list",
            "pack": "pack",
            "cache": { "cmd": "store", "args": ["prune"] },
            "ci": { "cmd": "install", "args": ["--frozen-lockfile"] },
            "doctor": "doctor",
            "link": "link",
            "global": { "cmd": "list", "args": ["-g"] },
            "outdated": "outdated",
            "search": null,
            "start": "start",
            "audit": "audit",
            "audit:fix": { "cmd": "audit", "args": ["--fix"] },
            "lint": "lint",
            "lint:fix": { "cmd": "lint", "args": ["--fix"] }
        }
    },
};

const GLOBAL_COMMANDS = {
    npm: { install: ['install', '-g'], update: ['update', '-g'], remove: ['uninstall', '-g'], list: ['list', '-g'] },
    yarn: { install: ['global', 'add'], update: ['global', 'upgrade'], remove: ['global', 'remove'], list: ['global', 'list'] },
    pnpm: { install: ['add', '-g'], update: ['update', '-g'], remove: ['remove', '-g'], list: ['list', '-g'] },
    bun: { install: ['add', '-g'], update: ['update', '-g'], remove: ['remove', '-g'], list: ['ls', '-g'] },
};

function getAvailablePms() {
    const allPms = ['npm', 'yarn', 'pnpm', 'bun'];
    const executablesToFind = [...allPms, 'node', 'http-server', 'npx']; // Add node, http-server, and npx
    const availablePms = [];
    for (const pm of executablesToFind) { // Iterate through all executables
        // Use 'where' on Windows or 'which' on Linux/macOS to find the executable path
        const findCmd = process.platform === 'win32' ? 'where' : 'which';
        const result = spawnSync(findCmd, [pm], { shell: true, encoding: 'utf8' });

        if (result.status === 0 && result.stdout) {
            let pmPath = result.stdout.trim().replace(/\r/g, '').split('\n')[0]; // Get the first path if multiple and remove carriage returns
            // On Windows, if the path doesn't have an extension, check for .cmd
            if (allPms.includes(pm)) { // Only add package managers to availablePms list
                availablePms.push(pm);
            }
            availablePmPaths[pm] = pmPath; // Store the absolute path for all found executables
        } else {
            // Fallback to just checking --version if path not found (e.g., for built-in npm)
            // This part might need refinement for non-PM executables
            const versionResult = spawnSync(pm, ['--version'], { shell: true, encoding: 'utf8' });
            if (versionResult.status === 0) {
                if (allPms.includes(pm)) {
                    availablePms.push(pm);
                }
                availablePmPaths[pm] = pm; // Store just the name, rely on shell for execution
            }
        }
    }
    return availablePms;
}

function detectPackageManager() {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");

    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.packageManager) {
                const pm = packageJson.packageManager.split('@')[0];
                if (PACKAGE_MANAGERS[pm]) {
                    return pm;
                }
            }
        } catch (e) {
            // Ignore error
        }
    }

    if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
    if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";

    // Default to pnpm if no lockfile or packageManager field is found
    return "pnpm";
}

function translateCommand(pmName, universalCommand, args) {
    if (!PACKAGE_MANAGERS[pmName]) {
        return null;
    }

    const pmConfig = PACKAGE_MANAGERS[pmName];
    const translated = pmConfig.commands[universalCommand];

    if (translated === undefined) {
        console.warn(`Warning: Universal command '${universalCommand}' is not explicitly defined for ${pmName}. Attempting to pass through.`);
        return [pmName, universalCommand, ...args];
    }

    if (translated === null) {
        console.error(`Error: Command '${universalCommand}' is not supported by ${pmName}.`);
        if (universalCommand === 'search') {
            console.error("Suggestion: Try 'bpack manage npm search <query>' to use npm's search feature.");
        }
        return null;
    }

    if (typeof translated === 'string') {
        return [pmName, translated, ...args];
    }

    if (typeof translated === 'object') {
        const finalArgs = [...translated.args, ...args];
        return [pmName, translated.cmd, ...finalArgs];
    }

    return [pmName, universalCommand, ...args];
}

function findPathKey(env = process.env) {
    if (process.platform !== 'win32') {
        return 'PATH';
    }
    const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path');
    return pathKey || 'PATH';
}

function executeCommand(command, args, options = {}) {
    if (!options.silent) {
        console.log(`Executing: ${command} ${args.join(' ')}`);
    }

    const env = { ...process.env };
    const pathKey = findPathKey(env);
    const localBinPath = path.join(__dirname, '..', 'node_modules', '.bin');

    // Prepend local bin path
    env[pathKey] = [localBinPath, env[pathKey]].filter(Boolean).join(path.delimiter);

    const spawnOptions = {
        stdio: 'inherit',
        shell: true,
        env: env
    };

    console.log(`executeCommand: Spawning command: ${command} with args: ${args.join(' ')}`);
    const child = spawn(command, args, spawnOptions);

    child.on('error', (err) => {
        console.error(`Failed to start subprocess: ${err.message}`);
    });
}

function executeOutdatedCommand(command, args) {
    console.log(`Executing: ${command} ${args.join(' ')}`);

    const env = { ...process.env };
    const pathKey = findPathKey(env);
    const localBinPath = path.join(__dirname, '..', 'node_modules', '.bin');

    // Prepend local bin path
    env[pathKey] = [localBinPath, env[pathKey]].filter(Boolean).join(path.delimiter);

    const spawnOptions = {
        stdio: 'pipe',
        shell: true,
        env: env
    };

    const child = spawn(command, args, spawnOptions);

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
    }
    if (child.stderr) {
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
    }

    child.on('close', (code) => {
        if (code === 0 && stdout.trim() === '' && stderr.trim() === '') {
            console.log('All dependencies are up to date.');
        } else {
            if (stdout.trim()) {
                console.log(stdout.trim());
            }
            if (stderr.trim()) {
                console.error(stderr.trim());
            }
        }
    });

    child.on('error', (err) => {
        console.error(`Failed to start subprocess: ${err.message}`);
    });
}

function listversions() {
    const scriptPath = path.join(__dirname, '..', 'detectpkgmgr.ps1');
    if (process.platform === 'win32') {
        executeCommand('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], { silent: true });
    } else {
        console.log("'listversions' is only supported on Windows.");
        process.exit(1);
    }
}

function manageCommand(args) {
    if (args[0] === 'selfupdate') {
        console.log("Attempting to self-update betterpack...");
        const pmsToCheck = {
            npm: ['list', '-g', '--depth=0'],
            pnpm: ['list', '-g', '--depth=0'],
            yarn: ['global', 'list']
        };
        let installedWith = null;

        for (const pm in pmsToCheck) {
            const result = spawnSync(pm, pmsToCheck[pm], { shell: true, encoding: 'utf8' });
            if (result.status === 0 && result.stdout && result.stdout.includes('betterpack')) {
                installedWith = pm;
                break;
            }
        }

        if (installedWith) {
            console.log(`betterpack was installed with ${installedWith}. Attempting update...`);
            let updateArgs;
            switch (installedWith) {
                case 'npm':
                    updateArgs = ['install', '-g', 'betterpack@latest'];
                    break;
                case 'pnpm':
                    updateArgs = ['update', '-g', 'betterpack'];
                    break;
                case 'yarn':
                    updateArgs = ['global', 'upgrade', 'betterpack'];
                    break;
            }
            executeCommand(installedWith, updateArgs);
        } else {
            console.error("Could not determine how betterpack was installed globally. Please update manually.");
            process.exit(1);
        }
        return;
    }

    if (args[0] === 'about') {
        const topic = args[1];
        let url;
        switch (topic) {
            case 'github':
                url = 'https://github.com/involvex/betterpack';
                break;
            case 'npmjs':
                url = 'https://www.npmjs.com/package/betterpack';
                break;
            default:
                console.error("Usage: bpack manage about <github|npmjs>");
                process.exit(1);
        }
        console.log(`Opening ${url}...`);
        const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        executeCommand(openCmd, [url], { silent: true });
        return;
    }

    const [pkgMgr, action, ...rest] = args;
    const availablePms = getAvailablePms();

    if (!pkgMgr || !action) {
        console.log("Usage: bpack manage <package-manager> <action> [args]");
        console.log("       bpack manage selfupdate");
        console.log("       bpack manage about <github|npmjs>");
        console.log(`  Package Managers: ${availablePms.join(', ')}`);
        console.log("  Actions: install, update, remove, version, list");
        console.log("  Note: 'update' with no package name will attempt to update the manager itself.");
        process.exit(1);
    }

    if (!availablePms.includes(pkgMgr)) {
        console.error(`Error: Package manager '${pkgMgr}' not found. Available: ${availablePms.join(', ')}`);
        process.exit(1);
    }

    // Special handling for updating the package manager itself
    if (action === 'update' && rest.length === 0) {
        let updateCmd = pkgMgr;
        let updateArgs = [];
        switch (pkgMgr) {
            case 'npm':
                updateArgs = ['install', '-g', 'npm@latest'];
                break;
            case 'pnpm':
                updateArgs = ['self-update'];
                break;
            case 'bun':
                updateArgs = ['upgrade'];
                break;
            case 'yarn':
                console.log("Attempting to set Yarn version for current project...");
                updateArgs = ['set', 'version', 'stable'];
                break;
        }
        executeCommand(updateCmd, updateArgs);
        return;
    }

    if (action === 'version') {
        executeCommand(pkgMgr, ['--version']);
        return;
    }

    const baseArgs = GLOBAL_COMMANDS[pkgMgr][action];
    if (!baseArgs) {
        console.error(`Error: Unknown action '${action}'. Supported: install, update, remove, version, list`);
        process.exit(1);
    }

    const cmdArgs = [...baseArgs, ...rest];
    executeCommand(pkgMgr, cmdArgs);
}

function displayHelp() {
    console.log("\nUsage: bpack <command> [args]");
    console.log("\n\x1b[1mUniversal Package Manager Commands:\x1b[0m");
    const universalCommands = {
        "install": "Install project dependencies.",
        "add": "Add a new dependency to the project.",
        "remove": "Remove a dependency from the project.",
        "update": "Update project dependencies.",
        "outdated": "Check for outdated dependencies.",
        "ci": "Install dependencies from a lockfile.",
        "run": "Run a script defined in package.json.",
        "test": "Run project tests.",
        "build": "Build the project.",
        "start": "Start the project.",
        "pack": "Create a package tarball.",
        "list": "List installed packages.",
        "global": "List global packages.",
        "cache clean": "Clear the package manager cache.",
        "doctor": "Run a health check.",
        "link": "Link a local package.",
        "search": "Search for packages (uses npm).",
        "lint, lint --fix": "Run linter.",
        "audit, audit --fix": "Run security audit."
    };
    for (const [cmd, desc] of Object.entries(universalCommands)) {
        console.log(`  \x1b[36m${cmd.padEnd(20)}\x1b[0m ${desc}`);
    }

    console.log("\n\x1b[1mBetterpack Commands:\x1b[0m");
    const betterpackCommands = {
        "listversions": "List installed versions of all supported package managers.",
        "manage": "Manage global packages or the package managers themselves.",
        "buildexe": "Package project into an executable using nexe.",
        "node": "Execute a JavaScript file using Node.js.",
        "watch": "Watch for file changes and auto-restart a process.",
        "host": "Start a web server from the current folder (default port 4020).",
        "gemini": "Start a chat with Gemini."
    };
    for (const [cmd, desc] of Object.entries(betterpackCommands)) {
        console.log(`  \x1b[36m${cmd.padEnd(20)}\x1b[0m ${desc}`);
    }
    console.log("");
    process.exit(0);
}

function runCli() {
    const args = process.argv.slice(2);
    getAvailablePms(); // Populate availablePmPaths at the start

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        displayHelp();
        return;
    }

    let universalCommand = args[0];
    const commandArgs = args.slice(1);

    // Define internal commands that have specific help messages
    const internalCommands = ['listversions', 'manage', 'buildexe', 'node', 'watch', 'host', 'gemini'];

    // If a command is provided and it's an internal command, check for --help in its arguments
    if (universalCommand && internalCommands.includes(universalCommand) && (commandArgs.includes('--help') || commandArgs.includes('-h'))) {
        displayHelp();
        return;
    }

    // If no command is provided, display general help
    if (!universalCommand) {
        displayHelp();
        return;
    }

    const fixIndex = commandArgs.indexOf('--fix');
    if (fixIndex !== -1) {
        if (universalCommand === 'audit' || universalCommand === 'lint') {
            universalCommand += ':fix';
            commandArgs.splice(fixIndex, 1);
        }
    }

    if (universalCommand === 'listversions') {
        listversions();
        return;
    }

    if (universalCommand === 'manage') {
        manageCommand(commandArgs);
        return;
    }

    if (universalCommand === 'buildexe') {
        console.log("Attempting to build executable from source using 'astra'...");
        console.log("WARNING: This will be VERY SLOW and requires a C++ compiler toolchain.");

        const nodeVersion = process.version; // e.g., 'v18.12.1'
        const platform = process.platform; // e.g., 'win32', 'linux', 'darwin'
        const arch = process.arch; // e.g., 'x64', 'arm64'

        // Format for astra: node_vXX.YY.Z-platform-arch
        // Example: node_v18.12.1-win-x64
        const astraNodeTarget = `node_${nodeVersion}-${platform}-${arch}`;

        // Path to the local astra-cli executable
        const astraCliPath = path.join(__dirname, 'node_modules', 'astra-cli', 'dist', 'astra.js');

        // Execute the command using 'node' to run the astra-cli script
        executeCommand('node', [astraCliPath, 'build', '-n', astraNodeTarget]);
        return;
    }

    if (universalCommand === 'node') {
        if (commandArgs.length === 0) {
            console.error("Error: Missing JavaScript file to execute. Usage: bpack node <file.js> [args]");
            process.exit(1);
        }
        executeCommand('node', commandArgs);
        return;
    }

    if (universalCommand === 'watch') {
        if (commandArgs.length === 0) {
            console.error("Error: Missing script or file to watch. Usage: bpack watch <script.js or command> [args]");
            console.error("Tip: For debugging, use 'bpack watch --inspect <script.js>'");
            process.exit(1);
        }
        executeCommand('nodemon', commandArgs);
        return;
    }

    if (universalCommand === 'host') {
        const defaultPort = '4020';
        const defaultHost = '0.0.0.0';
        let hostArgs = [...commandArgs];

        // Check if port is provided, if not, add default
        if (!hostArgs.some(arg => arg.startsWith('-p') || arg.startsWith('--port'))) {
            hostArgs.push('-p', defaultPort);
        }
        // Check if host is provided, if not, add default
        if (!hostArgs.some(arg => arg.startsWith('-a') || arg.startsWith('--host'))) {
            hostArgs.push('-a', defaultHost);
        }

        console.log(`Starting web server on http://${defaultHost}:${defaultPort}`);
        executeCommand('npx', ['http-server', ...hostArgs]);
        return;
    }

    if (universalCommand === 'gemini') {
        console.log("Starting a chat with Gemini...");
        executeCommand('npx', ['@google/gemini-cli', ...commandArgs]);
        return;
    }

    const pmName = detectPackageManager();

    console.log(`Detected package manager: ${pmName}`);

    const translatedCommand = translateCommand(pmName, universalCommand, commandArgs);

    if (translatedCommand) {
        const [cmd, ...cmdArgs] = translatedCommand;
        if (universalCommand === 'outdated') {
            executeOutdatedCommand(cmd, cmdArgs);
        } else {
            executeCommand(cmd, cmdArgs);
        }
    } else {
        process.exit(1);
    }
}

module.exports = { runCli, detectPackageManager, translateCommand, executeCommand, listversions, manageCommand };
