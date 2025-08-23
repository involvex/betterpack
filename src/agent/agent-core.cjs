const { ProjectAnalyzer } = require("./project-analyzer.cjs")
const { executeCommand } = require("../index.cjs")
const fs = require("fs")
const path = require("path")

class AutomatedAgent {
  constructor(options = {}) {
    this.options = {
      autoFix: options.autoFix || false,
      watchMode: options.watchMode || false,
      aggressiveness: options.aggressiveness || "moderate", // conservative, moderate, aggressive
      projectPath: options.projectPath || process.cwd(),
      ...options,
    }

    this.analyzer = new ProjectAnalyzer(this.options.projectPath)
    this.isRunning = false
    this.lastAnalysis = null
    this.actionHistory = []
  }

  async start() {
    console.log("[Agent] Starting automated project management...")
    this.isRunning = true

    // Initial analysis
    await this.performAnalysis()

    // Execute initial recommendations
    if (this.options.autoFix) {
      await this.executeRecommendations()
    }

    // Start watch mode if enabled
    if (this.options.watchMode) {
      this.startWatching()
    }

    return this.lastAnalysis
  }

  async stop() {
    console.log("[Agent] Stopping automated project management...")
    this.isRunning = false
    if (this.watcher) {
      this.watcher.close()
    }
  }

  async performAnalysis() {
    console.log("[Agent] Performing project analysis...")
    this.lastAnalysis = await this.analyzer.analyzeProject()

    const summary = this.analyzer.getAnalysisSummary()
    console.log(`[Agent] Analysis complete - Health: ${summary.healthStatus} (${summary.healthScore}/100)`)
    console.log(`[Agent] Found ${summary.issuesCount} issues and ${summary.recommendationsCount} recommendations`)

    return this.lastAnalysis
  }

  async executeRecommendations() {
    if (!this.lastAnalysis || !this.options.autoFix) {
      return
    }

    console.log("[Agent] Executing automated fixes...")

    for (const issue of this.lastAnalysis.issues) {
      if (this.shouldAutoFix(issue)) {
        await this.executeAutoFix(issue)
      }
    }

    for (const recommendation of this.lastAnalysis.recommendations) {
      if (this.shouldExecuteRecommendation(recommendation)) {
        await this.executeRecommendation(recommendation)
      }
    }
  }

  shouldAutoFix(issue) {
    const { aggressiveness } = this.options

    // Conservative: only fix critical errors
    if (aggressiveness === "conservative") {
      return issue.severity === "high" && issue.type === "error"
    }

    // Moderate: fix errors and important warnings
    if (aggressiveness === "moderate") {
      return issue.severity === "high" || (issue.severity === "medium" && issue.type === "error")
    }

    // Aggressive: fix most issues
    if (aggressiveness === "aggressive") {
      return issue.severity !== "low"
    }

    return false
  }

  shouldExecuteRecommendation(recommendation) {
    const { aggressiveness } = this.options

    // Conservative: only security fixes
    if (aggressiveness === "conservative") {
      return recommendation.type === "security"
    }

    // Moderate: security and performance
    if (aggressiveness === "moderate") {
      return ["security", "performance"].includes(recommendation.type)
    }

    // Aggressive: all recommendations except workflow changes
    if (aggressiveness === "aggressive") {
      return recommendation.type !== "workflow"
    }

    return false
  }

  async executeAutoFix(issue) {
    if (!issue.fix) return

    console.log(`[Agent] Auto-fixing: ${issue.message}`)

    try {
      // Parse and execute the fix command
      const command = issue.fix.match(/"([^"]+)"/)?.[1] || issue.fix

      if (
        command.startsWith("bpack ") ||
        command.startsWith("npm ") ||
        command.startsWith("yarn ") ||
        command.startsWith("pnpm ")
      ) {
        // Execute package management commands
        const parts = command.split(" ")
        const cmd = parts[0]
        const args = parts.slice(1)

        if (cmd === "bpack") {
          // Use our own CLI
          const { runCli } = require("../index.cjs")
          process.argv = ["node", "bpack", ...args]
          await runCli()
        } else {
          // Execute external command
          executeCommand(cmd, args)
        }

        this.actionHistory.push({
          timestamp: new Date(),
          action: "auto-fix",
          issue: issue.message,
          command: command,
          status: "success",
        })
      }
    } catch (error) {
      console.error(`[Agent] Failed to auto-fix: ${issue.message}`, error.message)
      this.actionHistory.push({
        timestamp: new Date(),
        action: "auto-fix",
        issue: issue.message,
        command: issue.fix,
        status: "failed",
        error: error.message,
      })
    }
  }

  async executeRecommendation(recommendation) {
    console.log(`[Agent] Executing recommendation: ${recommendation.message}`)

    try {
      // Parse and execute the recommendation action
      const command = recommendation.action.match(/"([^"]+)"/)?.[1] || recommendation.action

      if (command.startsWith("Run ")) {
        const actualCommand = command.replace("Run ", "").replace(/"/g, "")
        const parts = actualCommand.split(" ")
        const cmd = parts[0]
        const args = parts.slice(1)

        if (cmd === "bpack") {
          const { runCli } = require("../index.cjs")
          process.argv = ["node", "bpack", ...args]
          await runCli()
        } else {
          executeCommand(cmd, args)
        }

        this.actionHistory.push({
          timestamp: new Date(),
          action: "recommendation",
          type: recommendation.type,
          message: recommendation.message,
          command: actualCommand,
          status: "success",
        })
      }
    } catch (error) {
      console.error(`[Agent] Failed to execute recommendation: ${recommendation.message}`, error.message)
      this.actionHistory.push({
        timestamp: new Date(),
        action: "recommendation",
        type: recommendation.type,
        message: recommendation.message,
        command: recommendation.action,
        status: "failed",
        error: error.message,
      })
    }
  }

  startWatching() {
    console.log("[Agent] Starting file system monitoring...")

    const chokidar = require("chokidar")
    const watchPaths = [
      path.join(this.options.projectPath, "package.json"),
      path.join(this.options.projectPath, "package-lock.json"),
      path.join(this.options.projectPath, "yarn.lock"),
      path.join(this.options.projectPath, "pnpm-lock.yaml"),
      path.join(this.options.projectPath, "bun.lockb"),
    ]

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true,
    })

    this.watcher.on("change", async (filePath) => {
      console.log(`[Agent] Detected change in ${path.basename(filePath)}`)

      // Debounce rapid changes
      clearTimeout(this.watchTimeout)
      this.watchTimeout = setTimeout(async () => {
        await this.performAnalysis()
        if (this.options.autoFix) {
          await this.executeRecommendations()
        }
      }, 2000)
    })
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastAnalysis: this.lastAnalysis ? this.analyzer.getAnalysisSummary() : null,
      actionHistory: this.actionHistory.slice(-10), // Last 10 actions
      options: this.options,
    }
  }

  async generateReport() {
    if (!this.lastAnalysis) {
      await this.performAnalysis()
    }

    const report = {
      timestamp: new Date(),
      project: {
        path: this.options.projectPath,
        type: this.lastAnalysis.structure.projectType,
        frameworks: this.lastAnalysis.structure.frameworks,
        buildTools: this.lastAnalysis.structure.buildTools,
      },
      health: this.lastAnalysis.health,
      dependencies: {
        total: this.lastAnalysis.dependencies.total,
        outdated: this.lastAnalysis.dependencies.outdated.length,
        vulnerable: this.lastAnalysis.dependencies.vulnerable.length,
      },
      issues: this.lastAnalysis.issues,
      recommendations: this.lastAnalysis.recommendations,
      actions: this.actionHistory,
    }

    return report
  }
}

module.exports = { AutomatedAgent }
