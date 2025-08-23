const { EventEmitter } = require("events")

class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super()

    this.options = {
      enableNotifications: options.enableNotifications !== false,
      alertCooldown: options.alertCooldown || 300000, // 5 minutes
      maxAlerts: options.maxAlerts || 100,
      notificationChannels: options.notificationChannels || ["console"],
      ...options,
    }

    this.alerts = []
    this.alertCooldowns = new Map()
    this.notificationHandlers = new Map()

    this.setupDefaultHandlers()
  }

  setupDefaultHandlers() {
    // Console notification handler
    this.addNotificationHandler("console", (alert) => {
      const timestamp = alert.timestamp.toISOString()
      const level = alert.severity.toUpperCase()
      console.log(`[ALERT] [${timestamp}] [${level}] [${alert.type}] ${alert.message}`)

      if (alert.data) {
        console.log(`[ALERT] Data:`, JSON.stringify(alert.data, null, 2))
      }
    })

    // File notification handler
    this.addNotificationHandler("file", (alert) => {
      const fs = require("fs")
      const path = require("path")

      const logDir = path.join(process.cwd(), "logs")
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      const logFile = path.join(logDir, "alerts.log")
      const logEntry = {
        timestamp: alert.timestamp,
        severity: alert.severity,
        type: alert.type,
        message: alert.message,
        data: alert.data,
      }

      fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n")
    })
  }

  addNotificationHandler(channel, handler) {
    this.notificationHandlers.set(channel, handler)
  }

  removeNotificationHandler(channel) {
    this.notificationHandlers.delete(channel)
  }

  async createAlert(type, severity, message, data = null) {
    const alert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      data,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    }

    // Check cooldown
    const cooldownKey = `${type}_${severity}`
    if (this.alertCooldowns.has(cooldownKey)) {
      const lastAlert = this.alertCooldowns.get(cooldownKey)
      if (Date.now() - lastAlert < this.options.alertCooldown) {
        console.log(`[AlertManager] Alert suppressed due to cooldown: ${type}`)
        return null
      }
    }

    this.alertCooldowns.set(cooldownKey, Date.now())

    // Store alert
    this.alerts.push(alert)

    // Cleanup old alerts
    if (this.alerts.length > this.options.maxAlerts) {
      this.alerts = this.alerts.slice(-this.options.maxAlerts)
    }

    // Send notifications
    if (this.options.enableNotifications) {
      await this.sendNotifications(alert)
    }

    // Emit event
    this.emit("alert-created", alert)

    return alert
  }

  async sendNotifications(alert) {
    for (const channel of this.options.notificationChannels) {
      const handler = this.notificationHandlers.get(channel)
      if (handler) {
        try {
          await handler(alert)
        } catch (error) {
          console.error(`[AlertManager] Notification failed for channel ${channel}:`, error.message)
        }
      }
    }
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedAt = new Date()
      this.emit("alert-acknowledged", alert)
      return alert
    }
    return null
  }

  resolveAlert(alertId, resolution = null) {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      alert.resolution = resolution
      this.emit("alert-resolved", alert)
      return alert
    }
    return null
  }

  getAlerts(filters = {}) {
    let filteredAlerts = [...this.alerts]

    if (filters.severity) {
      filteredAlerts = filteredAlerts.filter((a) => a.severity === filters.severity)
    }

    if (filters.type) {
      filteredAlerts = filteredAlerts.filter((a) => a.type === filters.type)
    }

    if (filters.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter((a) => a.acknowledged === filters.acknowledged)
    }

    if (filters.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter((a) => a.resolved === filters.resolved)
    }

    if (filters.since) {
      filteredAlerts = filteredAlerts.filter((a) => a.timestamp >= filters.since)
    }

    return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  getActiveAlerts() {
    return this.getAlerts({ resolved: false })
  }

  getCriticalAlerts() {
    return this.getAlerts({ severity: "critical", resolved: false })
  }

  getAlertsSummary() {
    const total = this.alerts.length
    const active = this.getActiveAlerts().length
    const critical = this.getCriticalAlerts().length
    const acknowledged = this.alerts.filter((a) => a.acknowledged).length

    const byType = {}
    const bySeverity = {}

    for (const alert of this.alerts) {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    }

    return {
      total,
      active,
      critical,
      acknowledged,
      byType,
      bySeverity,
    }
  }

  // Predefined alert types
  async healthAlert(healthScore, healthData) {
    let severity = "info"
    if (healthScore < 30) severity = "critical"
    else if (healthScore < 60) severity = "warning"

    return this.createAlert("health", severity, `Project health score: ${healthScore}/100`, healthData)
  }

  async performanceAlert(metricName, value, threshold) {
    return this.createAlert(
      "performance",
      "warning",
      `Performance threshold exceeded: ${metricName} = ${value} (threshold: ${threshold})`,
      { metricName, value, threshold },
    )
  }

  async taskFailureAlert(taskName, error) {
    return this.createAlert("task", "error", `Task failed: ${taskName}`, { taskName, error: error.message })
  }

  async systemResourceAlert(resource, usage, threshold) {
    let severity = "warning"
    if (usage > threshold * 1.2) severity = "critical"

    return this.createAlert(
      "system",
      severity,
      `High ${resource} usage: ${usage.toFixed(1)}% (threshold: ${threshold}%)`,
      { resource, usage, threshold },
    )
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup methods
  clearResolvedAlerts() {
    const beforeCount = this.alerts.length
    this.alerts = this.alerts.filter((alert) => !alert.resolved)
    const removedCount = beforeCount - this.alerts.length

    console.log(`[AlertManager] Cleared ${removedCount} resolved alerts`)
    return removedCount
  }

  clearOldAlerts(maxAge = 24 * 60 * 60 * 1000) {
    // Default: 24 hours
    const cutoffTime = new Date(Date.now() - maxAge)
    const beforeCount = this.alerts.length

    this.alerts = this.alerts.filter((alert) => alert.timestamp > cutoffTime)
    const removedCount = beforeCount - this.alerts.length

    console.log(`[AlertManager] Cleared ${removedCount} old alerts`)
    return removedCount
  }
}

module.exports = { AlertManager }
