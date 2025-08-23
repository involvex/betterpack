const fs = require("fs")
const path = require("path")
const os = require("os")
const { EventEmitter } = require("events")

class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super()

    this.options = {
      checkInterval: options.checkInterval || 30000, // 30 seconds
      alertThresholds: {
        healthScore: options.healthScore || 50,
        memoryUsage: options.memoryUsage || 80, // percentage
        diskUsage: options.diskUsage || 90, // percentage
        cpuUsage: options.cpuUsage || 85, // percentage
        taskFailureRate: options.taskFailureRate || 20, // percentage
        ...options.alertThresholds,
      },
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      enableAlerts: options.enableAlerts !== false,
      projectPath: options.projectPath || process.cwd(),
      ...options,
    }

    this.isMonitoring = false
    this.monitoringInterval = null
    this.healthHistory = []
    this.systemMetrics = []
    this.alerts = []
    this.lastHealthCheck = null
    this.startTime = new Date()
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      console.log("[HealthMonitor] Already monitoring")
      return
    }

    console.log("[HealthMonitor] Starting health monitoring...")
    this.isMonitoring = true
    this.startTime = new Date()

    // Initial health check
    await this.performHealthCheck()

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error("[HealthMonitor] Health check failed:", error.message)
        this.emit("error", error)
      }
    }, this.options.checkInterval)

    // Clean up old data periodically
    setInterval(
      () => {
        this.cleanupOldData()
      },
      60 * 60 * 1000,
    ) // Every hour

    this.emit("monitoring-started")
    console.log(`[HealthMonitor] Monitoring started with ${this.options.checkInterval}ms interval`)
  }

  async stopMonitoring() {
    if (!this.isMonitoring) {
      return
    }

    console.log("[HealthMonitor] Stopping health monitoring...")
    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.emit("monitoring-stopped")
  }

  async performHealthCheck() {
    const timestamp = new Date()
    const healthData = {
      timestamp,
      project: await this.checkProjectHealth(),
      system: await this.checkSystemHealth(),
      agent: await this.checkAgentHealth(),
      overall: { score: 0, status: "unknown", issues: [] },
    }

    // Calculate overall health score
    healthData.overall = this.calculateOverallHealth(healthData)

    // Store health data
    this.healthHistory.push(healthData)
    this.lastHealthCheck = healthData

    // Check for alerts
    if (this.options.enableAlerts) {
      await this.checkAlerts(healthData)
    }

    // Emit health update event
    this.emit("health-update", healthData)

    return healthData
  }

  async checkProjectHealth() {
    const projectHealth = {
      score: 100,
      status: "healthy",
      checks: {},
      issues: [],
      metrics: {},
    }

    try {
      // Check if package.json exists and is valid
      const packageJsonPath = path.join(this.options.projectPath, "package.json")
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
          projectHealth.checks.packageJson = true
          projectHealth.metrics.dependencyCount = Object.keys(packageJson.dependencies || {}).length
        } catch (error) {
          projectHealth.checks.packageJson = false
          projectHealth.issues.push("Invalid package.json format")
          projectHealth.score -= 20
        }
      } else {
        projectHealth.checks.packageJson = false
        projectHealth.issues.push("No package.json found")
        projectHealth.score -= 30
      }

      // Check for lockfile
      const lockfiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"]
      projectHealth.checks.lockfile = lockfiles.some((file) => fs.existsSync(path.join(this.options.projectPath, file)))

      if (!projectHealth.checks.lockfile) {
        projectHealth.issues.push("No lockfile found")
        projectHealth.score -= 15
      }

      // Check for node_modules
      projectHealth.checks.nodeModules = fs.existsSync(path.join(this.options.projectPath, "node_modules"))

      if (!projectHealth.checks.nodeModules && projectHealth.metrics.dependencyCount > 0) {
        projectHealth.issues.push("Dependencies not installed")
        projectHealth.score -= 25
      }

      // Check for git repository
      projectHealth.checks.gitRepo = fs.existsSync(path.join(this.options.projectPath, ".git"))

      // Check disk space in project directory
      const stats = fs.statSync(this.options.projectPath)
      const diskUsage = await this.getDiskUsage(this.options.projectPath)
      projectHealth.metrics.diskUsage = diskUsage

      if (diskUsage > 90) {
        projectHealth.issues.push("Low disk space")
        projectHealth.score -= 10
      }

      // Determine status
      if (projectHealth.score >= 80) projectHealth.status = "healthy"
      else if (projectHealth.score >= 60) projectHealth.status = "warning"
      else projectHealth.status = "critical"
    } catch (error) {
      projectHealth.status = "error"
      projectHealth.issues.push(`Health check failed: ${error.message}`)
      projectHealth.score = 0
    }

    return projectHealth
  }

  async checkSystemHealth() {
    const systemHealth = {
      score: 100,
      status: "healthy",
      metrics: {},
      issues: [],
    }

    try {
      // Memory usage
      const memUsage = process.memoryUsage()
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100

      systemHealth.metrics.memory = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        systemUsagePercent: memoryUsagePercent,
      }

      if (memoryUsagePercent > this.options.alertThresholds.memoryUsage) {
        systemHealth.issues.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`)
        systemHealth.score -= 20
      }

      // CPU usage (simplified)
      const cpuUsage = await this.getCPUUsage()
      systemHealth.metrics.cpu = {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
      }

      if (cpuUsage > this.options.alertThresholds.cpuUsage) {
        systemHealth.issues.push(`High CPU usage: ${cpuUsage.toFixed(1)}%`)
        systemHealth.score -= 15
      }

      // Uptime
      systemHealth.metrics.uptime = {
        system: os.uptime(),
        process: process.uptime(),
      }

      // Node.js version
      systemHealth.metrics.nodeVersion = process.version

      // Platform info
      systemHealth.metrics.platform = {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
      }

      // Determine status
      if (systemHealth.score >= 80) systemHealth.status = "healthy"
      else if (systemHealth.score >= 60) systemHealth.status = "warning"
      else systemHealth.status = "critical"
    } catch (error) {
      systemHealth.status = "error"
      systemHealth.issues.push(`System health check failed: ${error.message}`)
      systemHealth.score = 0
    }

    return systemHealth
  }

  async checkAgentHealth() {
    const agentHealth = {
      score: 100,
      status: "healthy",
      metrics: {},
      issues: [],
    }

    try {
      // Agent uptime
      agentHealth.metrics.uptime = new Date() - this.startTime

      // Task execution metrics (would be provided by ExecutionManager)
      agentHealth.metrics.tasks = {
        total: 0,
        successful: 0,
        failed: 0,
        running: 0,
        failureRate: 0,
      }

      // If we have access to execution manager, get real metrics
      if (global.executionManager) {
        const status = global.executionManager.getExecutionStatus()
        const history = global.executionManager.getTaskHistory()

        agentHealth.metrics.tasks = {
          total: history.completed.length + history.failed.length,
          successful: history.completed.length,
          failed: history.failed.length,
          running: status.runningTasks,
          failureRate:
            history.completed.length + history.failed.length > 0
              ? (history.failed.length / (history.completed.length + history.failed.length)) * 100
              : 0,
        }

        if (agentHealth.metrics.tasks.failureRate > this.options.alertThresholds.taskFailureRate) {
          agentHealth.issues.push(`High task failure rate: ${agentHealth.metrics.tasks.failureRate.toFixed(1)}%`)
          agentHealth.score -= 25
        }
      }

      // AI engine health (if available)
      if (global.aiEngine) {
        agentHealth.metrics.ai = {
          enabled: true,
          decisionCount: global.aiEngine.decisionHistory?.length || 0,
          lastDecisionTime: global.aiEngine.decisionHistory?.slice(-1)[0]?.timestamp || null,
        }
      } else {
        agentHealth.metrics.ai = { enabled: false }
      }

      // File system monitoring
      agentHealth.metrics.monitoring = {
        isActive: this.isMonitoring,
        checkInterval: this.options.checkInterval,
        lastCheck: this.lastHealthCheck?.timestamp || null,
      }

      // Determine status
      if (agentHealth.score >= 80) agentHealth.status = "healthy"
      else if (agentHealth.score >= 60) agentHealth.status = "warning"
      else agentHealth.status = "critical"
    } catch (error) {
      agentHealth.status = "error"
      agentHealth.issues.push(`Agent health check failed: ${error.message}`)
      agentHealth.score = 0
    }

    return agentHealth
  }

  calculateOverallHealth(healthData) {
    const weights = {
      project: 0.4,
      system: 0.3,
      agent: 0.3,
    }

    const weightedScore =
      healthData.project.score * weights.project +
      healthData.system.score * weights.system +
      healthData.agent.score * weights.agent

    const allIssues = [...healthData.project.issues, ...healthData.system.issues, ...healthData.agent.issues]

    let status = "healthy"
    if (weightedScore < 40) status = "critical"
    else if (weightedScore < 70) status = "warning"

    return {
      score: Math.round(weightedScore),
      status,
      issues: allIssues,
    }
  }

  async checkAlerts(healthData) {
    const alerts = []

    // Overall health alert
    if (healthData.overall.score < this.options.alertThresholds.healthScore) {
      alerts.push({
        type: "health",
        severity: healthData.overall.score < 30 ? "critical" : "warning",
        message: `Overall health score is low: ${healthData.overall.score}/100`,
        timestamp: new Date(),
        data: healthData.overall,
      })
    }

    // System alerts
    if (healthData.system.metrics.memory?.systemUsagePercent > this.options.alertThresholds.memoryUsage) {
      alerts.push({
        type: "memory",
        severity: "warning",
        message: `High memory usage: ${healthData.system.metrics.memory.systemUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        data: healthData.system.metrics.memory,
      })
    }

    if (healthData.system.metrics.cpu?.usage > this.options.alertThresholds.cpuUsage) {
      alerts.push({
        type: "cpu",
        severity: "warning",
        message: `High CPU usage: ${healthData.system.metrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        data: healthData.system.metrics.cpu,
      })
    }

    // Agent alerts
    if (healthData.agent.metrics.tasks?.failureRate > this.options.alertThresholds.taskFailureRate) {
      alerts.push({
        type: "tasks",
        severity: "warning",
        message: `High task failure rate: ${healthData.agent.metrics.tasks.failureRate.toFixed(1)}%`,
        timestamp: new Date(),
        data: healthData.agent.metrics.tasks,
      })
    }

    // Store and emit alerts
    for (const alert of alerts) {
      this.alerts.push(alert)
      this.emit("alert", alert)
      console.warn(`[HealthMonitor] ALERT [${alert.severity.toUpperCase()}] ${alert.message}`)
    }
  }

  async getDiskUsage(dirPath) {
    try {
      const stats = fs.statSync(dirPath)
      // This is a simplified disk usage check
      // In a real implementation, you'd use a library like 'diskusage'
      return 50 // Placeholder percentage
    } catch (error) {
      return 0
    }
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage()
      const startTime = process.hrtime()

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage)
        const currentTime = process.hrtime(startTime)

        const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000
        const totalUsage = currentUsage.user + currentUsage.system

        const cpuPercent = (totalUsage / totalTime) * 100

        resolve(Math.min(100, cpuPercent))
      }, 100)
    })
  }

  cleanupOldData() {
    const cutoffTime = new Date(Date.now() - this.options.retentionPeriod)

    // Clean up health history
    this.healthHistory = this.healthHistory.filter((entry) => entry.timestamp > cutoffTime)

    // Clean up alerts
    this.alerts = this.alerts.filter((alert) => alert.timestamp > cutoffTime)

    console.log(`[HealthMonitor] Cleaned up old data, retained ${this.healthHistory.length} health entries`)
  }

  // Public API methods
  getHealthStatus() {
    return this.lastHealthCheck
  }

  getHealthHistory(limit = 100) {
    return this.healthHistory.slice(-limit)
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(-limit)
  }

  getActiveAlerts() {
    const recentTime = new Date(Date.now() - 60 * 60 * 1000) // Last hour
    return this.alerts.filter((alert) => alert.timestamp > recentTime)
  }

  getMetricsSummary() {
    if (!this.lastHealthCheck) {
      return null
    }

    return {
      overall: this.lastHealthCheck.overall,
      project: {
        score: this.lastHealthCheck.project.score,
        status: this.lastHealthCheck.project.status,
        dependencyCount: this.lastHealthCheck.project.metrics.dependencyCount,
      },
      system: {
        score: this.lastHealthCheck.system.score,
        status: this.lastHealthCheck.system.status,
        memoryUsage: this.lastHealthCheck.system.metrics.memory?.systemUsagePercent,
        cpuUsage: this.lastHealthCheck.system.metrics.cpu?.usage,
      },
      agent: {
        score: this.lastHealthCheck.agent.score,
        status: this.lastHealthCheck.agent.status,
        uptime: this.lastHealthCheck.agent.metrics.uptime,
        taskMetrics: this.lastHealthCheck.agent.metrics.tasks,
      },
    }
  }

  // Configuration methods
  updateThresholds(newThresholds) {
    this.options.alertThresholds = { ...this.options.alertThresholds, ...newThresholds }
    console.log("[HealthMonitor] Updated alert thresholds")
  }

  setCheckInterval(interval) {
    this.options.checkInterval = interval

    if (this.isMonitoring) {
      // Restart monitoring with new interval
      this.stopMonitoring()
      this.startMonitoring()
    }
  }
}

module.exports = { HealthMonitor }
