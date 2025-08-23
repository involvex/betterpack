const { TaskExecutor } = require("./task-executor.cjs")
const { TaskBuilder, TaskPatterns } = require("./task-builder.cjs")

class ExecutionManager {
  constructor(options = {}) {
    this.executor = new TaskExecutor(options)
    this.options = options
    this.executionHistory = []
  }

  async executeFromAnalysis(analysisData, executionOptions = {}) {
    console.log("[ExecutionManager] Creating execution plan from analysis...")

    const taskBuilder = TaskPatterns.fromAnalysis(analysisData)
    const tasks = taskBuilder.build()

    if (tasks.length === 0) {
      console.log("[ExecutionManager] No tasks to execute")
      return { total: 0, successful: 0, failed: 0, results: [] }
    }

    console.log(`[ExecutionManager] Generated ${tasks.length} tasks from analysis`)

    return this.executeTasks(tasks, executionOptions)
  }

  async executeFromRecommendations(recommendations, executionOptions = {}) {
    console.log("[ExecutionManager] Creating execution plan from recommendations...")

    const taskBuilder = TaskBuilder.create().fromRecommendations(recommendations)
    const tasks = taskBuilder.build()

    return this.executeTasks(tasks, executionOptions)
  }

  async executeTasks(tasks, executionOptions = {}) {
    const execution = {
      id: this.generateExecutionId(),
      startTime: new Date(),
      endTime: null,
      duration: 0,
      tasks: tasks,
      options: { ...this.options, ...executionOptions },
      status: "running",
    }

    this.executionHistory.push(execution)

    console.log(`[ExecutionManager] Starting execution ${execution.id} with ${tasks.length} tasks`)

    try {
      const result = await this.executor.executeBatch(tasks)

      execution.endTime = new Date()
      execution.duration = execution.endTime - execution.startTime
      execution.status = result.failed > 0 ? "partial" : "completed"
      execution.result = result

      console.log(`[ExecutionManager] Execution ${execution.id} completed in ${execution.duration}ms`)
      console.log(`[ExecutionManager] Results: ${result.successful} successful, ${result.failed} failed`)

      return result
    } catch (error) {
      execution.endTime = new Date()
      execution.duration = execution.endTime - execution.startTime
      execution.status = "failed"
      execution.error = error.message

      console.error(`[ExecutionManager] Execution ${execution.id} failed: ${error.message}`)
      throw error
    }
  }

  async executeCustomPlan(planBuilder) {
    const tasks = typeof planBuilder === "function" ? planBuilder(TaskBuilder.create()).build() : planBuilder.build()

    return this.executeTasks(tasks)
  }

  // Pre-built execution plans
  async setupProject(projectPath = process.cwd()) {
    console.log("[ExecutionManager] Executing project setup plan...")

    const tasks = TaskPatterns.projectSetup().build()
    return this.executeTasks(tasks)
  }

  async performSecurityUpdate() {
    console.log("[ExecutionManager] Executing security update plan...")

    const tasks = TaskPatterns.securityUpdate().build()
    return this.executeTasks(tasks)
  }

  async performMaintenance() {
    console.log("[ExecutionManager] Executing maintenance plan...")

    const tasks = TaskPatterns.dependencyMaintenance().build()
    return this.executeTasks(tasks)
  }

  async buildAndTest() {
    console.log("[ExecutionManager] Executing build and test plan...")

    const tasks = TaskPatterns.buildAndTest().build()
    return this.executeTasks(tasks)
  }

  // Execution control
  async pauseExecution() {
    // Implementation would pause the current execution
    console.log("[ExecutionManager] Pausing execution...")
  }

  async resumeExecution() {
    // Implementation would resume paused execution
    console.log("[ExecutionManager] Resuming execution...")
  }

  async cancelExecution() {
    // Implementation would cancel current execution
    console.log("[ExecutionManager] Cancelling execution...")

    if (this.executor.isExecuting) {
      await this.executor.rollbackAll()
    }
  }

  // Status and reporting
  getExecutionStatus() {
    const executorStatus = this.executor.getStatus()
    const currentExecution = this.executionHistory.find((e) => e.status === "running")

    return {
      ...executorStatus,
      currentExecution: currentExecution
        ? {
            id: currentExecution.id,
            startTime: currentExecution.startTime,
            taskCount: currentExecution.tasks.length,
            elapsedTime: new Date() - currentExecution.startTime,
          }
        : null,
      totalExecutions: this.executionHistory.length,
      lastExecution: this.executionHistory[this.executionHistory.length - 1],
    }
  }

  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit).map((execution) => ({
      id: execution.id,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.duration,
      status: execution.status,
      taskCount: execution.tasks.length,
      result: execution.result,
    }))
  }

  getTaskHistory() {
    return this.executor.getTaskHistory()
  }

  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Configuration
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    this.executor.options = { ...this.executor.options, ...newOptions }
  }

  enableDryRun() {
    this.updateOptions({ dryRun: true })
  }

  disableDryRun() {
    this.updateOptions({ dryRun: false })
  }

  enableSafeMode() {
    this.updateOptions({ safeMode: true })
  }

  disableSafeMode() {
    this.updateOptions({ safeMode: false })
  }
}

module.exports = { ExecutionManager }
