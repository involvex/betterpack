const fs = require("fs")
const path = require("path")
const { spawn, spawnSync } = require("child_process")
const archiver = require("archiver")
const tar = require("tar")

class ProjectBundler {
  constructor() {
    this.supportedFormats = ["js", "zip", "tar", "exe", "msix", "sh"]
    this.tempDir = path.join(process.cwd(), ".bpack-temp")
  }

  async bundle(format, options = {}) {
    const { output, include, exclude, minify = true, platform = process.platform } = options

    console.log(`🔧 Starting bundle process for format: ${format}`)

    try {
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true })
      }

      switch (format) {
        case "js":
          return await this.bundleToJS(output, { minify, include, exclude })
        case "zip":
          return await this.bundleToZip(output, { include, exclude })
        case "tar":
          return await this.bundleToTar(output, { include, exclude })
        case "exe":
          return await this.bundleToExe(output, { platform, minify })
        case "msix":
          return await this.bundleToMSIX(output, options)
        case "sh":
          return await this.bundleToShellInstaller(output, options)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      console.error(`❌ Bundle failed: ${error.message}`)
      throw error
    } finally {
      // Cleanup temp directory
      this.cleanup()
    }
  }

  async bundleToJS(outputPath, options) {
    console.log("📦 Bundling to single JavaScript file...")

    const packageJson = this.getPackageJson()
    const entryPoint = packageJson.main || "index.js"

    // Use webpack or rollup for bundling
    const bundlerConfig = this.createBundlerConfig(entryPoint, outputPath, options)

    if (this.hasWebpack()) {
      return await this.bundleWithWebpack(bundlerConfig)
    } else if (this.hasRollup()) {
      return await this.bundleWithRollup(bundlerConfig)
    } else {
      // Fallback: simple concatenation
      return await this.simpleBundleJS(entryPoint, outputPath, options)
    }
  }

  async bundleToZip(outputPath, options) {
    console.log("📦 Creating ZIP archive...")

    const output = fs.createWriteStream(outputPath || "bundle.zip")
    const archive = archiver("zip", { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`✅ ZIP created: ${archive.pointer()} bytes`)
        resolve(outputPath || "bundle.zip")
      })

      archive.on("error", reject)
      archive.pipe(output)

      // Add files based on include/exclude patterns
      this.addFilesToArchive(archive, options)
      archive.finalize()
    })
  }

  async bundleToTar(outputPath, options) {
    console.log("📦 Creating TAR archive...")

    const files = this.getFilesToBundle(options)
    const tarPath = outputPath || "bundle.tar.gz"

    await tar.create(
      {
        gzip: true,
        file: tarPath,
        cwd: process.cwd(),
      },
      files,
    )

    console.log(`✅ TAR created: ${tarPath}`)
    return tarPath
  }

  async bundleToExe(outputPath, options) {
    console.log("📦 Creating executable...")

    // First bundle to JS
    const jsBundle = path.join(this.tempDir, "bundle.js")
    await this.bundleToJS(jsBundle, options)

    // Use nexe or pkg to create executable
    if (this.hasNexe()) {
      return await this.createExeWithNexe(jsBundle, outputPath, options)
    } else if (this.hasPkg()) {
      return await this.createExeWithPkg(jsBundle, outputPath, options)
    } else {
      throw new Error("No executable bundler found. Install nexe or pkg: npm install -g nexe pkg")
    }
  }

  async bundleToMSIX(outputPath, options) {
    if (process.platform !== "win32") {
      throw new Error("MSIX packages can only be created on Windows")
    }

    console.log("📦 Creating MSIX installer...")

    // Create app manifest and package structure
    const packageDir = path.join(this.tempDir, "msix-package")
    await this.createMSIXStructure(packageDir, options)

    // Use Windows SDK tools to create MSIX
    const msixPath = outputPath || "installer.msix"
    await this.createMSIXPackage(packageDir, msixPath)

    console.log(`✅ MSIX created: ${msixPath}`)
    return msixPath
  }

  async bundleToShellInstaller(outputPath, options) {
    console.log("📦 Creating shell installer...")

    const installerPath = outputPath || "install.sh"
    const packageJson = this.getPackageJson()

    const installerScript = this.generateShellInstaller(packageJson, options)
    fs.writeFileSync(installerPath, installerScript, { mode: 0o755 })

    console.log(`✅ Shell installer created: ${installerPath}`)
    return installerPath
  }

  // Helper methods
  getPackageJson() {
    const packagePath = path.join(process.cwd(), "package.json")
    if (!fs.existsSync(packagePath)) {
      throw new Error("package.json not found")
    }
    return JSON.parse(fs.readFileSync(packagePath, "utf8"))
  }

  hasWebpack() {
    try {
      require.resolve("webpack")
      return true
    } catch {
      return false
    }
  }

  hasRollup() {
    try {
      require.resolve("rollup")
      return true
    } catch {
      return false
    }
  }

  hasNexe() {
    const result = spawnSync("nexe", ["--version"], { shell: true })
    return result.status === 0
  }

  hasPkg() {
    const result = spawnSync("pkg", ["--version"], { shell: true })
    return result.status === 0
  }

  getFilesToBundle(options) {
    const { include = ["**/*"], exclude = ["node_modules/**", ".git/**", "*.log"] } = options

    // Simple file matching - in production, use glob library
    const allFiles = this.getAllFiles(process.cwd())
    return allFiles.filter((file) => {
      const relativePath = path.relative(process.cwd(), file)
      return this.matchesPattern(relativePath, include) && !this.matchesPattern(relativePath, exclude)
    })
  }

  getAllFiles(dir, files = []) {
    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files)
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  matchesPattern(filePath, patterns) {
    // Simple pattern matching - in production, use minimatch
    return patterns.some((pattern) => {
      if (pattern.includes("**")) {
        const regex = new RegExp(pattern.replace("**", ".*").replace("*", "[^/]*"))
        return regex.test(filePath)
      }
      return filePath.includes(pattern.replace("*", ""))
    })
  }

  generateShellInstaller(packageJson, options) {
    return `#!/bin/bash
# Auto-generated installer for ${packageJson.name}
# Version: ${packageJson.version}

set -e

echo "Installing ${packageJson.name}..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Create installation directory
INSTALL_DIR="/usr/local/lib/${packageJson.name}"
sudo mkdir -p "$INSTALL_DIR"

# Extract and install files
echo "Extracting files..."
# Add extraction logic here based on bundled format

# Create symlink for global access
sudo ln -sf "$INSTALL_DIR/bin/${packageJson.name}" "/usr/local/bin/${packageJson.name}"

echo "✅ ${packageJson.name} installed successfully!"
echo "Run '${packageJson.name} --help' to get started."
`
  }

  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true })
    }
  }
}

function displayBundlerHelp() {
  console.log("\n\x1b[1mBetterpack Bundler\x1b[0m")
  console.log("\nUsage: bpack bundle <format> [options]")
  console.log("\n\x1b[1mSupported Formats:\x1b[0m")
  console.log("  \x1b[36mjs\x1b[0m          Bundle to single JavaScript file")
  console.log("  \x1b[36mzip\x1b[0m         Create ZIP archive")
  console.log("  \x1b[36mtar\x1b[0m         Create TAR.GZ archive")
  console.log("  \x1b[36mexe\x1b[0m         Create executable (requires nexe or pkg)")
  console.log("  \x1b[36mmsix\x1b[0m        Create Windows MSIX installer")
  console.log("  \x1b[36msh\x1b[0m          Create shell installer script")

  console.log("\n\x1b[1mOptions:\x1b[0m")
  console.log("  \x1b[33m-o, --output\x1b[0m    Output file path")
  console.log("  \x1b[33m--include\x1b[0m       Include patterns (comma-separated)")
  console.log("  \x1b[33m--exclude\x1b[0m       Exclude patterns (comma-separated)")
  console.log("  \x1b[33m--no-minify\x1b[0m     Disable minification")
  console.log("  \x1b[33m--platform\x1b[0m      Target platform for executables")

  console.log("\n\x1b[1mExamples:\x1b[0m")
  console.log("  bpack bundle js -o dist/app.js")
  console.log('  bpack bundle zip --exclude "*.log,node_modules/**"')
  console.log("  bpack bundle exe --platform win32")
  console.log("  bpack bundle msix -o MyApp.msix")
  console.log("")
}

async function handleBundleCommand(args) {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    displayBundlerHelp()
    return
  }

  const format = args[0]
  const bundler = new ProjectBundler()

  // Parse options
  const options = {}
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case "-o":
      case "--output":
        options.output = args[++i]
        break
      case "--include":
        options.include = args[++i].split(",")
        break
      case "--exclude":
        options.exclude = args[++i].split(",")
        break
      case "--no-minify":
        options.minify = false
        break
      case "--platform":
        options.platform = args[++i]
        break
    }
  }

  try {
    const result = await bundler.bundle(format, options)
    console.log(`🎉 Bundle completed: ${result}`)
  } catch (error) {
    console.error(`❌ Bundle failed: ${error.message}`)
    process.exit(1)
  }
}

module.exports = { ProjectBundler, handleBundleCommand, displayBundlerHelp }
