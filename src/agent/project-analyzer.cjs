const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

class ProjectAnalyzer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath
    this.analysis = {
      structure: {},
      dependencies: {},
      health: {},
      issues: [],
      recommendations: [],
    }
  }

  async analyzeProject() {
    console.log(`[Agent] Analyzing project at: ${this.projectPath}`)

    await this.analyzeStructure()
    await this.analyzeDependencies()
    await this.analyzeHealth()
    await this.detectIssues()
    await this.generateRecommendations()

    return this.analysis
  }

  async analyzeStructure() {
    const structure = {
      hasPackageJson: false,
      hasLockfile: false,
      lockfileType: null,
      hasNodeModules: false,
      hasGitRepo: false,
      projectType: "unknown",
      frameworks: [],
      buildTools: [],
    }

    // Check for package.json
    const packageJsonPath = path.join(this.projectPath, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      structure.hasPackageJson = true
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
        structure.projectType = this.detectProjectType(packageJson)
        structure.frameworks = this.detectFrameworks(packageJson)
        structure.buildTools = this.detectBuildTools(packageJson)
      } catch (error) {
        this.analysis.issues.push({
          type: "error",
          category: "structure",
          message: "Invalid package.json format",
          severity: "high",
        })
      }
    }

    // Check for lockfiles
    const lockfiles = {
      "package-lock.json": "npm",
      "yarn.lock": "yarn",
      "pnpm-lock.yaml": "pnpm",
      "bun.lockb": "bun",
    }

    for (const [filename, manager] of Object.entries(lockfiles)) {
      if (fs.existsSync(path.join(this.projectPath, filename))) {
        structure.hasLockfile = true
        structure.lockfileType = manager
        break
      }
    }

    // Check for node_modules
    structure.hasNodeModules = fs.existsSync(path.join(this.projectPath, "node_modules"))

    // Check for git repository
    structure.hasGitRepo = fs.existsSync(path.join(this.projectPath, ".git"))

    this.analysis.structure = structure
  }

  async analyzeDependencies() {
    const packageJsonPath = path.join(this.projectPath, "package.json")
    if (!fs.existsSync(packageJsonPath)) {
      return
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
      const deps = {
        production: Object.keys(packageJson.dependencies || {}),
        development: Object.keys(packageJson.devDependencies || {}),
        peer: Object.keys(packageJson.peerDependencies || {}),
        optional: Object.keys(packageJson.optionalDependencies || {}),
        total: 0,
        outdated: [],
        vulnerable: [],
        unused: [],
      }

      deps.total = deps.production.length + deps.development.length + deps.peer.length + deps.optional.length

      // Check for outdated dependencies
      await this.checkOutdatedDependencies(deps)

      // Check for security vulnerabilities
      await this.checkVulnerabilities(deps)

      this.analysis.dependencies = deps
    } catch (error) {
      this.analysis.issues.push({
        type: "error",
        category: "dependencies",
        message: "Failed to analyze dependencies",
        severity: "medium",
      })
    }
  }

  async analyzeHealth() {
    const health = {
      score: 100,
      status: "healthy",
      checks: {
        packageJson: this.analysis.structure.hasPackageJson,
        lockfile: this.analysis.structure.hasLockfile,
        nodeModules: this.analysis.structure.hasNodeModules,
        gitRepo: this.analysis.structure.hasGitRepo,
        noVulnerabilities: true,
        upToDate: true,
      },
    }

    // Calculate health score
    let deductions = 0

    if (!health.checks.packageJson) deductions += 30
    if (!health.checks.lockfile) deductions += 20
    if (!health.checks.nodeModules) deductions += 10
    if (!health.checks.gitRepo) deductions += 5

    if (this.analysis.dependencies.vulnerable?.length > 0) {
      deductions += this.analysis.dependencies.vulnerable.length * 5
      health.checks.noVulnerabilities = false
    }

    if (this.analysis.dependencies.outdated?.length > 0) {
      deductions += this.analysis.dependencies.outdated.length * 2
      health.checks.upToDate = false
    }

    health.score = Math.max(0, health.score - deductions)

    if (health.score >= 80) health.status = "healthy"
    else if (health.score >= 60) health.status = "warning"
    else health.status = "critical"

    this.analysis.health = health
  }

  async detectIssues() {
    // Check for common project issues
    if (!this.analysis.structure.hasPackageJson) {
      this.analysis.issues.push({
        type: "error",
        category: "structure",
        message: "No package.json found",
        severity: "high",
        fix: 'Run "npm init" to create a package.json file',
      })
    }

    if (!this.analysis.structure.hasLockfile) {
      this.analysis.issues.push({
        type: "warning",
        category: "structure",
        message: "No lockfile found",
        severity: "medium",
        fix: 'Run "npm install" to generate a lockfile',
      })
    }

    if (!this.analysis.structure.hasNodeModules && this.analysis.dependencies.total > 0) {
      this.analysis.issues.push({
        type: "warning",
        category: "dependencies",
        message: "Dependencies not installed",
        severity: "medium",
        fix: 'Run "bpack install" to install dependencies',
      })
    }

    // Check for multiple lockfiles (conflicting package managers)
    const lockfileCount = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"].filter((file) =>
      fs.existsSync(path.join(this.projectPath, file)),
    ).length

    if (lockfileCount > 1) {
      this.analysis.issues.push({
        type: "warning",
        category: "structure",
        message: "Multiple lockfiles detected",
        severity: "medium",
        fix: "Remove conflicting lockfiles and use one package manager",
      })
    }
  }

  async generateRecommendations() {
    const recommendations = []

    // Performance recommendations
    if (this.analysis.dependencies.total > 100) {
      recommendations.push({
        type: "performance",
        message: "Consider auditing dependencies - high dependency count detected",
        action: 'Run "bpack audit" to check for unused dependencies',
      })
    }

    // Security recommendations
    if (this.analysis.dependencies.vulnerable.length > 0) {
      recommendations.push({
        type: "security",
        message: `${this.analysis.dependencies.vulnerable.length} vulnerable dependencies found`,
        action: 'Run "bpack audit --fix" to fix security issues',
      })
    }

    // Maintenance recommendations
    if (this.analysis.dependencies.outdated.length > 5) {
      recommendations.push({
        type: "maintenance",
        message: "Multiple outdated dependencies detected",
        action: 'Run "bpack update" to update dependencies',
      })
    }

    // Development workflow recommendations
    if (!this.analysis.structure.hasGitRepo) {
      recommendations.push({
        type: "workflow",
        message: "No git repository initialized",
        action: 'Run "git init" to initialize version control',
      })
    }

    this.analysis.recommendations = recommendations
  }

  detectProjectType(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (deps.react || deps["@types/react"]) return "react"
    if (deps.vue || deps["@vue/cli"]) return "vue"
    if (deps.angular || deps["@angular/core"]) return "angular"
    if (deps.next || deps["next"]) return "nextjs"
    if (deps.nuxt || deps["nuxt3"]) return "nuxt"
    if (deps.svelte || deps["@sveltejs/kit"]) return "svelte"
    if (deps.express || deps.fastify || deps.koa) return "backend"
    if (packageJson.type === "module" || deps.typescript) return "modern-js"

    return "javascript"
  }

  detectFrameworks(packageJson) {
    const frameworks = []
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const frameworkMap = {
      react: "React",
      vue: "Vue.js",
      "@angular/core": "Angular",
      next: "Next.js",
      nuxt: "Nuxt.js",
      svelte: "Svelte",
      "@sveltejs/kit": "SvelteKit",
      express: "Express",
      fastify: "Fastify",
      koa: "Koa",
    }

    for (const [dep, framework] of Object.entries(frameworkMap)) {
      if (deps[dep]) frameworks.push(framework)
    }

    return frameworks
  }

  detectBuildTools(packageJson) {
    const buildTools = []
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const toolMap = {
      webpack: "Webpack",
      vite: "Vite",
      rollup: "Rollup",
      parcel: "Parcel",
      esbuild: "ESBuild",
      typescript: "TypeScript",
      "@babel/core": "Babel",
      eslint: "ESLint",
      prettier: "Prettier",
    }

    for (const [dep, tool] of Object.entries(toolMap)) {
      if (deps[dep]) buildTools.push(tool)
    }

    return buildTools
  }

  async checkOutdatedDependencies(deps) {
    // This would integrate with the existing betterpack outdated command
    try {
      const result = spawnSync("node", [path.join(__dirname, "../index.js"), "outdated"], {
        cwd: this.projectPath,
        encoding: "utf8",
        timeout: 30000,
      })

      if (result.stdout && result.stdout.trim() !== "All dependencies are up to date.") {
        // Parse outdated output and populate deps.outdated
        const lines = result.stdout.split("\n").filter((line) => line.trim())
        deps.outdated = lines.map((line) => {
          const parts = line.split(/\s+/)
          return {
            name: parts[0],
            current: parts[1],
            wanted: parts[2],
            latest: parts[3],
          }
        })
      }
    } catch (error) {
      console.log("[Agent] Could not check outdated dependencies:", error.message)
    }
  }

  async checkVulnerabilities(deps) {
    // This would integrate with the existing betterpack audit command
    try {
      const result = spawnSync("node", [path.join(__dirname, "../index.js"), "audit"], {
        cwd: this.projectPath,
        encoding: "utf8",
        timeout: 30000,
      })

      if (result.stdout && result.stdout.includes("vulnerabilities")) {
        // Parse audit output and populate deps.vulnerable
        const vulnerabilityMatch = result.stdout.match(/(\d+) vulnerabilities/)
        if (vulnerabilityMatch) {
          const count = Number.parseInt(vulnerabilityMatch[1])
          deps.vulnerable = Array(count)
            .fill()
            .map((_, i) => ({
              id: `vuln-${i}`,
              severity: "unknown",
              package: "unknown",
            }))
        }
      }
    } catch (error) {
      console.log("[Agent] Could not check vulnerabilities:", error.message)
    }
  }

  getAnalysisSummary() {
    return {
      projectType: this.analysis.structure.projectType,
      healthScore: this.analysis.health.score,
      healthStatus: this.analysis.health.status,
      totalDependencies: this.analysis.dependencies.total,
      issuesCount: this.analysis.issues.length,
      recommendationsCount: this.analysis.recommendations.length,
      frameworks: this.analysis.structure.frameworks,
      buildTools: this.analysis.structure.buildTools,
    }
  }
}

module.exports = { ProjectAnalyzer }
