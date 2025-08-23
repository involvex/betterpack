class PerformanceTracker {
  constructor(options = {}) {
    this.options = {
      trackingEnabled: options.trackingEnabled !== false,
      sampleRate: options.sampleRate || 1.0, // 100% sampling
      maxSamples: options.maxSamples || 1000,
      ...options,
    }

    this.metrics = new Map()
    this.samples = []
    this.timers = new Map()
  }

  startTimer(name, metadata = {}) {
    if (!this.options.trackingEnabled) return

    const timer = {
      name,
      startTime: process.hrtime.bigint(),
      metadata,
    }

    this.timers.set(name, timer)
    return timer
  }

  endTimer(name, additionalMetadata = {}) {
    if (!this.options.trackingEnabled) return

    const timer = this.timers.get(name)
    if (!timer) {
      console.warn(`[PerformanceTracker] Timer '${name}' not found`)
      return
    }

    const endTime = process.hrtime.bigint()
    const duration = Number(endTime - timer.startTime) / 1000000 // Convert to milliseconds

    const sample = {
      name: timer.name,
      duration,
      timestamp: new Date(),
      metadata: { ...timer.metadata, ...additionalMetadata },
    }

    this.recordSample(sample)
    this.timers.delete(name)

    return sample
  }

  recordMetric(name, value, metadata = {}) {
    if (!this.options.trackingEnabled) return

    const sample = {
      name,
      value,
      timestamp: new Date(),
      metadata,
    }

    this.recordSample(sample)
  }

  recordSample(sample) {
    // Apply sampling rate
    if (Math.random() > this.options.sampleRate) {
      return
    }

    this.samples.push(sample)

    // Update metrics
    if (!this.metrics.has(sample.name)) {
      this.metrics.set(sample.name, {
        name: sample.name,
        count: 0,
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        avg: 0,
        recent: [],
      })
    }

    const metric = this.metrics.get(sample.name)
    const value = sample.duration || sample.value || 0

    metric.count++
    metric.sum += value
    metric.min = Math.min(metric.min, value)
    metric.max = Math.max(metric.max, value)
    metric.avg = metric.sum / metric.count
    metric.recent.push({ value, timestamp: sample.timestamp })

    // Keep only recent samples
    if (metric.recent.length > 100) {
      metric.recent = metric.recent.slice(-100)
    }

    // Cleanup old samples
    if (this.samples.length > this.options.maxSamples) {
      this.samples = this.samples.slice(-this.options.maxSamples)
    }
  }

  getMetric(name) {
    return this.metrics.get(name)
  }

  getAllMetrics() {
    return Array.from(this.metrics.values())
  }

  getMetricsSummary() {
    const summary = {}

    for (const [name, metric] of this.metrics) {
      summary[name] = {
        count: metric.count,
        avg: Math.round(metric.avg * 100) / 100,
        min: Math.round(metric.min * 100) / 100,
        max: Math.round(metric.max * 100) / 100,
        recent: metric.recent.slice(-10), // Last 10 samples
      }
    }

    return summary
  }

  // Convenience methods for common operations
  trackTaskExecution(taskName, executor) {
    return async (...args) => {
      const timer = this.startTimer(`task_${taskName}`, { taskName })

      try {
        const result = await executor(...args)
        this.endTimer(`task_${taskName}`, { status: "success" })
        return result
      } catch (error) {
        this.endTimer(`task_${taskName}`, { status: "error", error: error.message })
        throw error
      }
    }
  }

  trackAnalysis(analysisName, analyzer) {
    return async (...args) => {
      const timer = this.startTimer(`analysis_${analysisName}`, { analysisName })

      try {
        const result = await analyzer(...args)
        this.endTimer(`analysis_${analysisName}`, {
          status: "success",
          resultSize: JSON.stringify(result).length,
        })
        return result
      } catch (error) {
        this.endTimer(`analysis_${analysisName}`, { status: "error", error: error.message })
        throw error
      }
    }
  }

  trackDecision(decisionName, decisionMaker) {
    return async (...args) => {
      const timer = this.startTimer(`decision_${decisionName}`, { decisionName })

      try {
        const result = await decisionMaker(...args)
        this.endTimer(`decision_${decisionName}`, {
          status: "success",
          confidence: result.confidence,
          recommendationCount: result.recommendations?.length || 0,
        })
        return result
      } catch (error) {
        this.endTimer(`decision_${decisionName}`, { status: "error", error: error.message })
        throw error
      }
    }
  }

  // Performance analysis
  getSlowOperations(threshold = 1000) {
    // Return operations that took longer than threshold (ms)
    return this.samples.filter((sample) => (sample.duration || sample.value || 0) > threshold)
  }

  getErrorRate(metricName) {
    const metric = this.metrics.get(metricName)
    if (!metric) return 0

    const errorSamples = this.samples.filter(
      (sample) => sample.name === metricName && sample.metadata?.status === "error",
    )

    return metric.count > 0 ? (errorSamples.length / metric.count) * 100 : 0
  }

  getTrends(metricName, timeWindow = 60 * 60 * 1000) {
    // Get trends for the last hour by default
    const cutoffTime = new Date(Date.now() - timeWindow)
    const recentSamples = this.samples.filter((sample) => sample.name === metricName && sample.timestamp > cutoffTime)

    if (recentSamples.length < 2) {
      return { trend: "insufficient_data", samples: recentSamples.length }
    }

    // Simple trend calculation
    const values = recentSamples.map((s) => s.duration || s.value || 0)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    let trend = "stable"
    if (change > 10) trend = "increasing"
    else if (change < -10) trend = "decreasing"

    return {
      trend,
      change: Math.round(change * 100) / 100,
      firstAvg: Math.round(firstAvg * 100) / 100,
      secondAvg: Math.round(secondAvg * 100) / 100,
      samples: recentSamples.length,
    }
  }

  // Cleanup and maintenance
  clearMetrics() {
    this.metrics.clear()
    this.samples = []
    this.timers.clear()
  }

  exportMetrics() {
    return {
      timestamp: new Date(),
      metrics: this.getAllMetrics(),
      samples: this.samples,
      summary: this.getMetricsSummary(),
    }
  }
}

module.exports = { PerformanceTracker }
