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
    npm: { install: ['install', '-g'], update: ['update', '-g'], remove: ['uninstall', '-g'] },
    yarn: { install: ['global', 'add'], update: ['global', 'upgrade'], remove: ['global', 'remove'] },
    pnpm: { install: ['add', '-g'], update: ['update', '-g'], remove: ['remove', '-g'] },
    bun: { install: ['add', '-g'], update: ['update', '-g'], remove: ['remove', '-g'] },
};

function getAvailablePms() {
    const allPms = ['npm', 'yarn', 'pnpm', 'bun'];
    const executablesToFind = [...allPms, 'node', 'http-server']; // Add node and http-server
    const availablePms = [];
    for (const pm of executablesToFind) { // Iterate through all executables
        // Use 'where' on Windows or 'which' on Linux/macOS to find the executable path
        const findCmd = process.platform === 'win32' ? 'where' : 'which';
        const result = spawnSync(findCmd, [pm], { shell: true, encoding: 'utf8' });

        if (result.status === 0 && result.stdout) {
            const pmPath = result.stdout.trim().split('\n')[0]; // Get the first path if multiple
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

function executeCommand(command, args, options = {}) {
    if (!options.silent) {
        console.log(`Executing: ${command} ${args.join(' ')}`);
    }

    const spawnOptions = {
        stdio: 'inherit',
        shell: false, // Default to false, will be set to true if needed
        env: { ...process.env } // Start with a copy of the current process.env
    };

    // Ensure PATH is correctly set, including local node_modules/.bin
    let currentPath = spawnOptions.env.PATH || '';
    if (process.platform === 'win32') {
        const localBinPath = path.join(__dirname, '..', 'node_modules', '.bin');
        spawnOptions.env.PATH = localBinPath + path.delimiter + currentPath;
    } else {
        spawnOptions.env.PATH = currentPath;
    }

    let actualCommand = command;
    let actualArgs = args;

    // Use absolute path if available for any command
    if (availablePmPaths[command]) {
        actualCommand = availablePmPaths[command];
    } else if (command === 'node' && availablePmPaths['node']) { // Explicitly handle 'node'
        actualCommand = availablePmPaths['node'];
    } else if (command === 'http-server' && availablePmPaths['http-server']) { // Explicitly handle 'http-server'
        actualCommand = availablePmPaths['http-server'];
    }

    const child = spawn(actualCommand, actualArgs, spawnOptions);

    console.log('PATH in executeCommand:', spawnOptions.env.PATH); // Keep for debugging
    console.log('Actual command to execute:', actualCommand); // Add for debugging

    child.on('error', (err) => {
        console.error(`Failed to start subprocess: ${err.message}`);
    });

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
    const [pkgMgr, action, ...rest] = args;
    const availablePms = getAvailablePms();

    if (!pkgMgr || !action) {
        console.log("Usage: bpack manage <package-manager> <action> [args]");
        console.log(`  Package Managers: ${availablePms.join(', ')}`);
        console.log("  Actions: install, update, remove, version");
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
        console.error(`Error: Unknown action '${action}'. Supported: install, update, remove, version`);
        process.exit(1);
    }

    const cmdArgs = [...baseArgs, ...rest];
    executeCommand(pkgMgr, cmdArgs);
}

function displayHelp(command) {
    switch (command) {
        case 'listversions':
            console.log("Usage: bpack listversions");
            console.log("  Lists installed versions of all supported package managers (npm, yarn, pnpm, bun).");
            console.log("  Only supported on Windows due to reliance on PowerShell.");
            break;
        case 'manage':
            console.log("Usage: bpack manage <package-manager> <action> [args]");
            console.log("  Manages global packages or the package managers themselves.");
            console.log("  <package-manager>: npm, yarn, pnpm, bun");
            console.log("  <action>: install, update, remove, version");
            console.log("  'update' with no package name will attempt to update the manager itself.");
            break;
        case 'buildexe':
            console.log("Usage: bpack buildexe");
            console.log("  Packages the project into an executable using 'astra'.");
            console.log("  WARNING: This is a very slow process and requires a C++ compiler toolchain.");
            console.log("  Automatically detects your Node.js version, platform, and architecture.");
            break;
        case 'node':
            console.log("Usage: bpack node <file.js> [args]");
            console.log("  Executes a JavaScript file using Node.js.");
            console.log("  Example: bpack node my-script.js --some-arg value");
            break;
        case 'watch':
            console.log("Usage: bpack watch <script.js or command> [args]");
            console.log("  Watches for file changes and automatically restarts a process.");
            console.log("  Requires 'nodemon' to be installed (bpack will prompt to install if missing).");
            console.log("  Tip: For debugging, use 'bpack watch --inspect <script.js>'");
            break;
        case 'host':
            console.log("Usage: bpack host [path] [--port <port>] [--host <host>]");
            console.log("  Starts a web server from the given folder (defaults to current directory).");
            console.log("  Default port: 4020, Default host: 0.0.0.0");
            console.log("  Requires 'http-server' to be installed (bpack will prompt to install if missing).");
            break;
        default:
            // General help message (existing one)
            console.log("Usage: bpack <command> [args]");
            console.log("\nUniversal Package Manager Commands:");
            console.log("  install        Install project dependencies.");
            console.log("  add            Add a new dependency to the project.");
            console.log("  remove         Remove a dependency from the project.");
            console.log("  update         Update project dependencies.");
            console.log("  outdated       Check for outdated dependencies.");
            console.log("  ci             Install dependencies from a lockfile.");
            console.log("  run            Run a script defined in package.json.");
            console.log("  test           Run project tests.");
            console.log("  build          Build the project.");
            console.log("  start          Start the project.");
            console.log("  pack           Create a package tarball.");
            console.log("  list           List installed packages.");
            console.log("  global         List global packages.");
            console.log("  cache clean    Clear the package manager cache.");
            console.log("  doctor         Run a health check.");
            console.log("  link           Link a local package.");
            console.log("  search         Search for packages (uses npm).");
            console.log("  lint, lint --fix   Run linter.");
            console.log("  audit, audit --fix Run security audit.");
            console.log("\nBetterpack Commands:");
            console.log("  listversions   List installed versions of all supported package managers.");
            console.log("  manage         Manage global packages or the package managers themselves.");
            console.log("  buildexe       Package project into an executable using nexe.");
            console.log("  node           Execute a JavaScript file using Node.js.");
            console.log("  watch          Watch for file changes and auto-restart a process.");
            console.log("  host           Start a web server from the current folder (default port 4020).");
            break;
    }
    process.exit(0);
}

function runCli() {
    const args = process.argv.slice(2);
    getAvailablePms(); // Populate availablePmPaths at the start

    if (args[0] === '--help' || args[0] === '-h') {
        displayHelp();
        return;
    }

    let universalCommand = args[0];
    const commandArgs = args.slice(1);

    // Define internal commands that have specific help messages
    const internalCommands = ['listversions', 'manage', 'buildexe', 'node', 'watch', 'host'];

    // If a command is provided and it's an internal command, check for --help in its arguments
    if (universalCommand && internalCommands.includes(universalCommand) && (commandArgs.includes('--help') || commandArgs.includes('-h'))) {
        displayHelp(universalCommand);
        return;
    }

    // If no command is provided, display general help
    if (!universalCommand) {
        displayHelp();
        return; // Added return here to prevent further execution
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
        executeCommand('http-server', hostArgs);
        return;
    }

    const pmName = detectPackageManager();

    console.log(`Detected package manager: ${pmName}`);

    const translatedCommand = translateCommand(pmName, universalCommand, commandArgs);

    if (translatedCommand) {
        const [cmd, ...cmdArgs] = translatedCommand;
        executeCommand(cmd, cmdArgs);
    } else {
        process.exit(1);
    }
}

module.exports = { runCli, detectPackageManager, translateCommand, executeCommand, listversions, manageCommand };