#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const availablePmPaths = {} // New global variable

const PACKAGE_MANAGERS = {
  npm: {
    commands: {
      install: "install",
      add: "install",
      remove: "uninstall",
      update: "update",
      run: "run",
      test: "test",
      build: "build",
      list: "list",
      pack: "pack",
      cache: { cmd: "cache", args: ["clean", "--force"] },
      ci: "ci",
      doctor: "doctor",
      link: "link",
      global: { cmd: "list", args: ["-g"] },
      outdated: "outdated",
      search: "search",
      start: "start",
      audit: "audit",
      "audit:fix": { cmd: "audit", args: ["fix"] },
      lint: { cmd: "run", args: ["lint"] },
      "lint:fix": { cmd: "run", args: ["lint", "--", "--fix"] },
    },
  },
  yarn: {
    commands: {
      install: "install",
      add: "add",
      remove: "remove",
      update: "upgrade",
      run: "run",
      test: "test",
      build: "build",
      list: "list",
      pack: "pack",
      cache: { cmd: "cache", args: ["clean"] },
      ci: { cmd: "install", args: ["--immutable"] },
      doctor: "doctor",
      link: "link",
      global: { cmd: "global", args: ["list"] },
      outdated: "outdated",
      search: null,
      start: "start",
      audit: { cmd: "npm", args: ["audit"] },
      "audit:fix": { cmd: "npm", args: ["audit", "fix"] },
      lint: "lint",
      "lint:fix": { cmd: "lint", args: ["--fix"] },
    },
  },
  pnpm: {
    commands: {
      install: "install",
      add: "add",
      remove: "remove",
      update: "update",
      run: "run",
      test: "test",
      build: "build",
      list: "list",
      pack: "pack",
      cache: { cmd: "store", args: ["prune"] },
      ci: { cmd: "install", args: ["--frozen-lockfile"] },
      doctor: "doctor",
      link: "link",
      global: { cmd: "list", args: ["-g"] },
      outdated: "outdated",
      search: null,
      start: "start",
      audit: "audit",
      "audit:fix": { cmd: "audit", args: ["--fix"] },
      lint: "lint",
      "lint:fix": { cmd: "lint", args: ["--fix"] },
    },
  },
  bun: {
    commands: {
      install: "install",
      add: "add",
      remove: "remove",
      update: "upgrade",
      run: "run",
      test: "test",
      build: "build",
      list: "list",
      pack: "pack",
      cache: { cmd: "cache", args: ["clean"] },
      ci: { cmd: "install", args: ["--frozen-lockfile"] },
      doctor: "doctor",
      link: "link",
      global: { cmd: "list", args: ["-g"] },
      outdated: "outdated",
      search: null,
      start: "start",
      audit: "audit",
      "audit:fix": { cmd: "audit", args: ["--fix"] },
      lint: "lint",
      "lint:fix": { cmd: "lint", args: ["--fix"] },
    },
  },
}

const GLOBAL_COMMANDS = {
  npm: { install: ["install", "-g"], update: ["update", "-g"], remove: ["uninstall", "-g"], list: ["list", "-g"] },
  yarn: {
    install: ["global", "add"],
    update: ["global", "upgrade"],
    remove: ["global", "remove"],
    list: ["global", "list"],
  },
  pnpm: { install: ["add", "-g"], update: ["update", "-g"], remove: ["remove", "-g"], list: ["list", "-g"] },
  bun: { install: ["add", "-g"], update: ["update", "-g"], remove: ["remove", "-g"], list: ["ls", "-g"] },
}

let cachedAvailablePms = null
function getAvailablePms() {
  if (cachedAvailablePms) {
    return cachedAvailablePms
  }

  const allPms = ["npm", "yarn", "pnpm", "bun"]
  const executablesToFind = [...allPms, "node", "http-server", "npx"]
  const availablePms = []

  for (const pm of executablesToFind) {
    if (availablePmPaths[pm]) {
      if (allPms.includes(pm)) {
        availablePms.push(pm)
      }
      continue
    }

    const findCmd = process.platform === "win32" ? "where" : "which"
    const result = spawnSync(findCmd, [pm], { shell: true, encoding: "utf8" })

    if (result.status === 0 && result.stdout) {
      const pmPath = result.stdout.trim().replace(/\r/g, "").split("\n")[0]
      if (allPms.includes(pm)) {
        availablePms.push(pm)
      }
      availablePmPaths[pm] = pmPath
    } else {
      const versionResult = spawnSync(pm, ["--version"], { shell: true, encoding: "utf8" })
      if (versionResult.status === 0) {
        if (allPms.includes(pm)) {
          availablePms.push(pm)
        }
        availablePmPaths[pm] = pm
      }
    }
  }
  cachedAvailablePms = [...new Set(availablePms)]
  return cachedAvailablePms
}

function detectPackageManager() {
  const cwd = process.cwd()
  const packageJsonPath = path.join(cwd, "package.json")

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
      if (packageJson.packageManager) {
        const pm = packageJson.packageManager.split("@")[0]
        if (PACKAGE_MANAGERS[pm]) {
          return pm
        }
      }
    } catch (e) {
      // Ignore error
    }
  }

  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm"

  // Default to pnpm if no lockfile or packageManager field is found
  return "pnpm"
}

function translateCommand(pmName, universalCommand, args) {
  if (!PACKAGE_MANAGERS[pmName]) {
    return null
  }

  const pmConfig = PACKAGE_MANAGERS[pmName]
  const translated = pmConfig.commands[universalCommand]

  if (translated === undefined) {
    console.warn(
      `Warning: Universal command '${universalCommand}' is not explicitly defined for ${pmName}. Attempting to pass through.`,
    )
    return [pmName, universalCommand, ...args]
  }

  if (translated === null) {
    console.error(`Error: Command '${universalCommand}' is not supported by ${pmName}.`)
    if (universalCommand === "search") {
      console.error("Suggestion: Try 'bpack manage npm search <query>' to use npm's search feature.")
    }
    return null
  }

  if (typeof translated === "string") {
    return [pmName, translated, ...args]
  }

  if (typeof translated === "object") {
    const finalArgs = [...translated.args, ...args]
    return [pmName, translated.cmd, ...finalArgs]
  }

  return [pmName, universalCommand, ...args]
}

function findPathKey(env = process.env) {
  if (process.platform !== "win32") {
    return "PATH"
  }
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path")
  return pathKey || "PATH"
}

function executeCommand(command, args, options = {}) {
  if (!options.silent) {
    console.log(`Executing: ${command} ${args.join(" ")}`)
  }

  const env = { ...process.env }
  const pathKey = findPathKey(env)
  const localBinPath = path.join(__dirname, "..", "node_modules", ".bin")

  // Prepend local bin path
  env[pathKey] = [localBinPath, env[pathKey]].filter(Boolean).join(path.delimiter)

  const spawnOptions = {
    stdio: "inherit",
    shell: true,
    env: env,
  }

  console.log(`executeCommand: Spawning command: ${command} with args: ${args.join(" ")}`)
  const child = spawn(command, args, spawnOptions)

  child.on("error", (err) => {
    console.error(`Failed to start subprocess: ${err.message}`)
  })
}

function executeOutdatedCommand(command, args) {
  console.log(`Executing: ${command} ${args.join(" ")}`)

  const env = { ...process.env }
  const pathKey = findPathKey(env)
  const localBinPath = path.join(__dirname, "..", "node_modules", ".bin")

  // Prepend local bin path
  env[pathKey] = [localBinPath, env[pathKey]].filter(Boolean).join(path.delimiter)

  const spawnOptions = {
    stdio: "pipe",
    shell: true,
    env: env,
  }

  const child = spawn(command, args, spawnOptions)

  let stdout = ""
  let stderr = ""

  if (child.stdout) {
    child.stdout.on("data", (data) => {
      stdout += data.toString()
    })
  }
  if (child.stderr) {
    child.stderr.on("data", (data) => {
      stderr += data.toString()
    })
  }

  child.on("close", (code) => {
    if (code === 0 && stdout.trim() === "" && stderr.trim() === "") {
      console.log("All dependencies are up to date.")
    } else {
      if (stdout.trim()) {
        console.log(stdout.trim())
      }
      if (stderr.trim()) {
        console.error(stderr.trim())
      }
    }
  })

  child.on("error", (err) => {
    console.error(`Failed to start subprocess: ${err.message}`)
  })
}

function listversions() {
  const scriptPath = path.join(__dirname, "..", "detectpkgmgr.ps1")
  if (process.platform === "win32") {
    executeCommand("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
      silent: true,
    })
  } else {
    console.log("'listversions' is only supported on Windows.")
    process.exit(1)
  }
}

function manageCommand(args) {
  if (args[0] === "selfupdate") {
    console.log("Attempting to self-update betterpack...")
    const pmsToCheck = {
      npm: ["list", "-g", "--depth=0"],
      pnpm: ["list", "-g", "--depth=0"],
      yarn: ["global", "list"],
    }
    let installedWith = null

    for (const pm in pmsToCheck) {
      const result = spawnSync(pm, pmsToCheck[pm], { shell: true, encoding: "utf8" })
      if (result.status === 0 && result.stdout && result.stdout.includes("betterpack")) {
        installedWith = pm
        break
      }
    }

    if (installedWith) {
      console.log(`betterpack was installed with ${installedWith}. Attempting update...`)
      let updateArgs
      switch (installedWith) {
        case "npm":
          updateArgs = ["install", "-g", "betterpack@latest"]
          break
        case "pnpm":
          updateArgs = ["update", "-g", "betterpack"]
          break
        case "yarn":
          updateArgs = ["global", "upgrade", "betterpack"]
          break
      }
      executeCommand(installedWith, updateArgs)
    } else {
      console.error("Could not determine how betterpack was installed globally. Please update manually.")
      process.exit(1)
    }
    return
  }

  if (args[0] === "about") {
    const topic = args[1]
    let url
    switch (topic) {
      case "github":
        url = "https://github.com/involvex/betterpack"
        break
      case "npmjs":
        url = "https://www.npmjs.com/package/betterpack"
        break
      default:
        console.error("Usage: bpack manage about <github|npmjs>")
        process.exit(1)
    }
    console.log(`Opening ${url}...`)
    const openCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"
    executeCommand(openCmd, [url], { silent: true })
    return
  }

  if (args[0] === "support") {
    const url = "https://www.buymeacoffee.com/involvex"
    console.log(`Opening ${url}...`)
    const openCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"
    executeCommand(openCmd, [url], { silent: true })
    return
  }

  if (args[0] === "git" && args[1] === "autocommit") {
    const status = args[2]
    if (status !== "on" && status !== "off") {
      console.error("Usage: bpack manage git autocommit <on|off>")
      process.exit(1)
    }
    const configPath = path.join(require("os").homedir(), ".bpackrc")
    let config = {}
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    }
    config.autocommit = status === "on"
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log(`Autocommit is now ${status}.`)
    return
  }

  const [pkgMgr, action, ...rest] = args
  const availablePms = getAvailablePms()

  if (!pkgMgr || !action) {
    console.log("Usage: bpack manage <package-manager> <action> [args]")
    console.log("       bpack manage selfupdate")
    console.log("       bpack manage about <github|npmjs>")
    console.log("       bpack manage git autocommit <on|off>")
    console.log(`  Package Managers: ${availablePms.join(", ")}`)
    console.log("  Actions: install, update, remove, version, list")
    console.log("  Note: 'update' with no package name will attempt to update the manager itself.")
    process.exit(1)
  }

  if (!availablePms.includes(pkgMgr)) {
    console.error(`Error: Package manager '${pkgMgr}' not found. Available: ${availablePms.join(", ")}`)
    process.exit(1)
  }

  // Special handling for updating the package manager itself
  if (action === "update" && rest.length === 0) {
    const updateCmd = pkgMgr
    let updateArgs = []
    switch (pkgMgr) {
      case "npm":
        updateArgs = ["install", "-g", "npm@latest"]
        break
      case "pnpm":
        updateArgs = ["self-update"]
        break
      case "bun":
        updateArgs = ["upgrade"]
        break
      case "yarn":
        console.log("Attempting to set Yarn version for current project...")
        updateArgs = ["set", "version", "stable"]
        break
    }
    executeCommand(updateCmd, updateArgs)
    return
  }

  if (action === "version") {
    executeCommand(pkgMgr, ["--version"])
    return
  }

  const baseArgs = GLOBAL_COMMANDS[pkgMgr][action]
  if (!baseArgs) {
    console.error(`Error: Unknown action '${action}'. Supported: install, update, remove, version, list`)
    process.exit(1)
  }

  const cmdArgs = [...baseArgs, ...rest]
  executeCommand(pkgMgr, cmdArgs)
}

function displayHelp() {
  console.log("\nUsage: bpack <command> [args]")

  const universalCommands = {
    "install": "Install project dependencies.",
    "add <pkg>": "Add a new dependency.",
    "remove <pkg>": "Remove a dependency.",
    "update [pkg]": "Update dependencies.",
    "outdated": "Check for outdated dependencies.",
    "ci": "Install dependencies from a lockfile.",
    "run <script>": "Run a script from package.json.",
    "test": "Run project tests.",
    "build": "Build the project.",
    "start": "Start the project.",
    "pack": "Create a package tarball.",
    "list": "List installed packages.",
    "global": "List global packages.",
    "cache clean": "Clear the package manager cache.",
    "doctor": "Run a health check.",
    "link": "Link a local package.",
    "search <query>": "Search for packages (uses npm).",
    "lint [--fix]": "Run linter and optionally fix issues.",
    "audit [--fix]": "Run security audit and optionally fix issues.",
    "fix": "Alias for 'audit --fix'.",
  }

  console.log("\n\x1b[1mUniversal Commands:\x1b[0m")
  const universalEntries = Object.entries(universalCommands)
  const maxCmdLength = Math.max(...universalEntries.map(([cmd]) => cmd.length))
  for (const [cmd, desc] of universalEntries) {
    console.log(`  \x1b[36m${cmd.padEnd(maxCmdLength + 2)}\x1b[0m ${desc}`)
  }

  const betterpackCommands = {
    "agent <action>": "Run the automated agent (e.g., start, analyze).",
    "bundle <format>": "Bundle project into various formats.",
    "create": "Interactive project builder (alias: build-project).",
    "host": "Start the agent dashboard web server.",
    "listversions": "List installed package manager versions.",
    "manage <pm> <action>": "Manage global packages or package managers.",
    "node <file>": "Execute a JavaScript file.",
    "watch <command>": "Watch files and restart a process on change.",
  }

  console.log("\n\x1b[1mBetterpack Commands:\x1b[0m")
  const betterpackEntries = Object.entries(betterpackCommands)
  const maxBpackCmdLength = Math.max(...betterpackEntries.map(([cmd]) => cmd.length))
  for (const [cmd, desc] of betterpackEntries) {
    console.log(`  \x1b[36m${cmd.padEnd(maxBpackCmdLength + 2)}\x1b[0m ${desc}`)
  }

  console.log("\nRun `bpack <command> --help` for more information on a specific command.")
  console.log("")
  process.exit(0)
}

function runCli() {
  let args = process.argv.slice(2)
  getAvailablePms() // Populate availablePmPaths at the start

  const configPath = path.join(require("os").homedir(), ".bpackrc")
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    if (config[args[0]]) {
      args = config[args[0]].split(" ")
    }
  }

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    displayHelp()
    return
  }

  let universalCommand = args[0]
  const commandArgs = args.slice(1)

  const internalCommands = [
    "listversions",
    "manage",
    "buildexe",
    "bundle",
    "node",
    "watch",
    "host",
    "gemini",
    "create",
    "build-project",
    "agent",
  ]

  if (commandArgs.includes("--help") || commandArgs.includes("-h")) {
    displayHelp()
    return
  }

  // --- Internal Command Dispatcher ---
  if (internalCommands.includes(universalCommand)) {
    switch (universalCommand) {
      case "listversions":
        listversions()
        return
      case "manage":
        manageCommand(commandArgs)
        return
      case "bundle":
        const { handleBundleCommand } = require("./bundler")
        handleBundleCommand(commandArgs)
        return
      case "create":
      case "build-project":
        const { InteractiveProjectBuilder } = require("./interactive-builder")
        const builder = new InteractiveProjectBuilder()
        builder
          .start()
          .then(() => {
            builder.close()
            process.exit(0)
          })
          .catch((error) => {
            console.error("❌ Error in interactive builder:", error.message)
            builder.close()
            process.exit(1)
          })
        return
      case "agent":
        const { runAgentCli } = require("./agent/index.cjs")
        runAgentCli(commandArgs)
        return
      case "node":
        if (commandArgs.length === 0) {
          console.error("Error: Please specify a file to execute.")
          process.exit(1)
        }
        executeCommand("node", commandArgs)
        return
      case "watch":
        if (commandArgs.length === 0) {
          console.error("Error: Please specify a command to run.")
          console.error("Usage: bpack watch <command>")
          process.exit(1)
        }
        const chokidar = require("chokidar")
        const commandToRun = commandArgs.join(" ")
        console.log(`Watching for file changes to run: ${commandToRun}`)

        const watcher = chokidar.watch(".", {
          ignored: /(^|[\/\\])\..*|node_modules|dist/, // ignore dotfiles, node_modules, dist
          persistent: true,
        })

        let childProcess
        const runCommand = () => {
          if (childProcess) {
            childProcess.kill()
          }
          console.log(`Running: ${commandToRun}`)
          const [cmd, ...args] = commandToRun.split(" ")
          childProcess = spawn(cmd, args, { stdio: "inherit", shell: true })
        }

        watcher.on("change", (path) => {
          console.log(`File ${path} has been changed. Restarting...`)
          runCommand()
        })

        runCommand() // Run once on start
        return
      case "host":
        const portIndexHost = commandArgs.findIndex((arg) => arg === "-p" || arg === "--port")
        const portHost = portIndexHost !== -1 ? commandArgs[portIndexHost + 1] : "3000"
        console.log(`Starting dashboard at http://localhost:${portHost}`)
        executeCommand("node", ["server.cjs"], { env: { ...process.env, PORT: portHost } })
        return
      default:
        console.log(`Command '${universalCommand}' is recognized as an internal command but not yet implemented.`)
        return
    }
  }

  // --- Universal PM Command Handling ---

  // Handle aliases and flags
  if (universalCommand === "fix") {
    universalCommand = "audit:fix"
  } else {
    const fixIndex = commandArgs.indexOf("--fix")
    if (fixIndex !== -1) {
      if (universalCommand === "audit" || universalCommand === "lint") {
        universalCommand += ":fix"
        commandArgs.splice(fixIndex, 1)
      }
    }
  }

  const pmName = detectPackageManager()
  console.log(`Detected package manager: ${pmName}`)

  const translatedCommand = translateCommand(pmName, universalCommand, commandArgs)

  if (translatedCommand) {
    const [cmd, ...cmdArgs] = translatedCommand
    if (universalCommand === "outdated") {
      executeOutdatedCommand(cmd, cmdArgs)
    } else {
      executeCommand(cmd, cmdArgs)
    }
  } else {
    process.exit(1)
  }
}

module.exports = { runCli, detectPackageManager, translateCommand, executeCommand, listversions, manageCommand }
