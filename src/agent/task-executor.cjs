const { spawn, spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const { executeCommand } = require("../index.cjs")

class TaskExecutor {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      maxConcurrent: options.maxConcurrent || 3,
      timeout: options.timeout || 300000, // 5 minutes
      retryAttempts: options.retryAttempts || 2,
      rollbackEnabled: options.rollbackEnabled !== false,
      safeMode: options.safeMode !== false,
      ...options,
    }

    this.taskQueue = []
    this.runningTasks = new Map()
    this.completedTasks = []
    this.failedTasks = []
    this.rollbackStack = []
    this.isExecuting = false
  }

  async executeTask(task) {
    const taskId = this.generateTaskId()
    const executionTask = {
      id: taskId,
      ...task,
      status: "pending",
      startTime: null,
      endTime: null,
      duration: 0,
      attempts: 0,
      output: "",
      error: null,
      rollbackData: null,
    }

    console.log(`[Executor] Queuing task: ${task.name || task.action}`)

    if (this.options.dryRun) {
      return this.simulateTask(executionTask)
    }

    return this.executeTaskInternal(executionTask)
  }

  async executeBatch(tasks) {
    console.log(`[Executor] Executing batch of ${tasks.length} tasks`)

    const results = []
    this.isExecuting = true

    try {
      // Add all tasks to queue
      for (const task of tasks) {
        const taskId = this.generateTaskId()
        const executionTask = {
          id: taskId,
          ...task,
          status: "queued",
          startTime: null,
          endTime: null,
          duration: 0,
          attempts: 0,
          output: "",
          error: null,
          rollbackData: null,
        }
        this.taskQueue.push(executionTask)
      }

      // Process queue
      while (this.taskQueue.length > 0 || this.runningTasks.size > 0) {
        // Start new tasks if we have capacity
        while (this.runningTasks.size < this.options.maxConcurrent && this.taskQueue.length > 0) {
          const task = this.taskQueue.shift()
          this.startTask(task)
        }

        // Wait for at least one task to complete
        if (this.runningTasks.size > 0) {
          await this.waitForAnyTask()
        }
      }

      results.push(...this.completedTasks)
      results.push(...this.failedTasks)
    } catch (error) {
      console.error("[Executor] Batch execution failed:", error.message)

      if (this.options.rollbackEnabled) {
        await this.rollbackAll()
      }
    } finally {
      this.isExecuting = false
    }

    return {
      total: tasks.length,
      successful: this.completedTasks.length,
      failed: this.failedTasks.length,
      results: results,
    }
  }

  async executeTaskInternal(task) {
    task.status = "running"
    task.startTime = new Date()
    task.attempts++

    console.log(`[Executor] Executing task: ${task.name || task.action} (Attempt ${task.attempts})`)

    try {
      // Pre-execution safety checks
      if (this.options.safeMode && !this.isSafeTask(task)) {
        throw new Error("Task blocked by safety checks")
      }

      // Create rollback data before execution
      if (this.options.rollbackEnabled) {
        task.rollbackData = await this.createRollbackData(task)
      }

      // Execute the task based on its type
      const result = await this.executeByType(task)

      task.status = "completed"
      task.endTime = new Date()
      task.duration = task.endTime - task.startTime
      task.output = result.output || ""

      this.completedTasks.push(task)

      if (this.options.rollbackEnabled) {
        this.rollbackStack.push(task)
      }

      console.log(`[Executor] Task completed: ${task.name || task.action} (${task.duration}ms)`)
      return task
    } catch (error) {
      task.status = "failed"
      task.endTime = new Date()
      task.duration = task.endTime - task.startTime
      task.error = error.message

      console.error(`[Executor] Task failed: ${task.name || task.action} - ${error.message}`)

      // Retry logic
      if (task.attempts < this.options.retryAttempts && this.shouldRetry(task, error)) {
        console.log(`[Executor] Retrying task: ${task.name || task.action}`)
        await this.delay(1000 * task.attempts) // Exponential backoff
        return this.executeTaskInternal(task)
      }

      this.failedTasks.push(task)
      throw error
    }
  }

  async executeByType(task) {
    switch (task.type) {
      case "command":
        return this.executeCommand(task)
      case "package":
        return this.executePackageCommand(task)
      case "file":
        return this.executeFileOperation(task)
      case "git":
        return this.executeGitCommand(task)
      case "script":
        return this.executeScript(task)
      case "custom":
        return this.executeCustomTask(task)
      default:
        // Try to infer type from action
        return this.executeInferredTask(task)
    }
  }

  async executeCommand(task) {
    const { command, args = [], options = {} } = task

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        timeout: this.options.timeout,
        ...options,
      })

      let stdout = ""
      let stderr = ""

      child.stdout?.on("data", (data) => {
        stdout += data.toString()
      })

      child.stderr?.on("data", (data) => {
        stderr += data.toString()
      })

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ output: stdout, exitCode: code })
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`))
        }
      })

      child.on("error", (error) => {
        reject(error)
      })

      // Handle timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGTERM")
          reject(new Error("Task timeout"))
        }
      }, this.options.timeout)
    })
  }

  async executePackageCommand(task) {
    const { action, packages = [], flags = [] } = task

    // Use the existing betterpack CLI functionality
    const args = [action, ...packages, ...flags]

    return new Promise((resolve, reject) => {
      try {
        // Import and use the existing CLI
        const { runCli } = require("../index.cjs")
        const originalArgv = process.argv

        process.argv = ["node", "bpack", ...args]

        // Capture output
        const originalLog = console.log
        const originalError = console.error
        let output = ""
        let errorOutput = ""

        console.log = (...args) => {
          output += args.join(" ") + "\n"
          originalLog(...args)
        }

        console.error = (...args) => {
          errorOutput += args.join(" ") + "\n"
          originalError(...args)
        }

        runCli()

        // Restore
        process.argv = originalArgv
        console.log = originalLog
        console.error = originalError

        if (errorOutput && !output) {
          reject(new Error(errorOutput))
        } else {
          resolve({ output: output || "Command completed successfully" })
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async executeFileOperation(task) {
    const { operation, filePath, content, backup = true } = task

    switch (operation) {
      case "create":
        if (backup && fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, `${filePath}.backup`)
        }
        fs.writeFileSync(filePath, content || "")
        return { output: `Created file: ${filePath}` }

      case "delete":
        if (backup && fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, `${filePath}.backup`)
        }
        fs.unlinkSync(filePath)
        return { output: `Deleted file: ${filePath}` }

      case "modify":
        if (backup && fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, `${filePath}.backup`)
        }
        fs.writeFileSync(filePath, content)
        return { output: `Modified file: ${filePath}` }

      default:
        throw new Error(`Unknown file operation: ${operation}`)
    }
  }

  async executeGitCommand(task) {
    const { gitAction, args = [] } = task
    return this.executeCommand({
      command: "git",
      args: [gitAction, ...args],
    })
  }

  async executeScript(task) {
    const { scriptPath, args = [] } = task
    const ext = path.extname(scriptPath)

    let command
    switch (ext) {
      case ".js":
        command = "node"
        break
      case ".py":
        command = "python"
        break
      case ".sh":
        command = "bash"
        break
      default:
        command = scriptPath
        args.unshift()
    }

    return this.executeCommand({
      command,
      args: [scriptPath, ...args],
    })
  }

  async executeCustomTask(task) {
    if (typeof task.executor === "function") {
      return task.executor(task)
    }
    throw new Error("Custom task must provide an executor function")
  }

  async executeInferredTask(task) {
    const { action } = task

    if (!action) {
      throw new Error("Task must specify an action")
    }

    // Try to parse as a command
    const parts = action.split(" ")
    const command = parts[0]
    const args = parts.slice(1)

    // Check if it's a betterpack command
    if (command === "bpack") {
      return this.executePackageCommand({
        action: args[0],
        packages: args.slice(1).filter((arg) => !arg.startsWith("-")),
        flags: args.slice(1).filter((arg) => arg.startsWith("-")),
      })
    }

    // Execute as regular command
    return this.executeCommand({ command, args })
  }

  async simulateTask(task) {
    console.log(`[Executor] [DRY RUN] Would execute: ${task.name || task.action}`)

    task.status = "simulated"
    task.startTime = new Date()
    task.endTime = new Date()
    task.duration = 0
    task.output = "Dry run - task not actually executed"

    return task
  }

  isSafeTask(task) {
    const dangerousPatterns = [
      /rm\s+-rf/,
      /del\s+\/[sq]/i,
      /format\s+[a-z]:/i,
      /shutdown/i,
      /reboot/i,
      /kill\s+-9/,
      /sudo\s+rm/,
      /npm\s+uninstall\s+.*--save/,
    ]

    const actionStr = task.action || task.command || ""

    return !dangerousPatterns.some((pattern) => pattern.test(actionStr))
  }

  async createRollbackData(task) {
    const rollbackData = {
      taskId: task.id,
      type: task.type,
      timestamp: new Date(),
    }

    switch (task.type) {
      case "file":
        if (task.operation === "create" || task.operation === "modify") {
          if (fs.existsSync(task.filePath)) {
            rollbackData.originalContent = fs.readFileSync(task.filePath, "utf8")
            rollbackData.fileExisted = true
          } else {
            rollbackData.fileExisted = false
          }
        }
        break

      case "package":
        // Store current package.json state
        const packageJsonPath = path.join(process.cwd(), "package.json")
        if (fs.existsSync(packageJsonPath)) {
          rollbackData.packageJson = fs.readFileSync(packageJsonPath, "utf8")
        }
        break
    }

    return rollbackData
  }

  async rollbackTask(task) {
    if (!task.rollbackData) {
      console.log(`[Executor] No rollback data for task: ${task.id}`)
      return
    }

    console.log(`[Executor] Rolling back task: ${task.name || task.action}`)

    try {
      switch (task.type) {
        case "file":
          if (task.rollbackData.fileExisted) {
            fs.writeFileSync(task.filePath, task.rollbackData.originalContent)
          } else {
            if (fs.existsSync(task.filePath)) {
              fs.unlinkSync(task.filePath)
            }
          }
          break

        case "package":
          if (task.rollbackData.packageJson) {
            const packageJsonPath = path.join(process.cwd(), "package.json")
            fs.writeFileSync(packageJsonPath, task.rollbackData.packageJson)
          }
          break
      }

      console.log(`[Executor] Rollback completed for task: ${task.id}`)
    } catch (error) {
      console.error(`[Executor] Rollback failed for task: ${task.id} - ${error.message}`)
    }
  }

  async rollbackAll() {
    console.log(`[Executor] Rolling back ${this.rollbackStack.length} tasks`)

    // Rollback in reverse order
    for (let i = this.rollbackStack.length - 1; i >= 0; i--) {
      await this.rollbackTask(this.rollbackStack[i])
    }

    this.rollbackStack = []
  }

  shouldRetry(task, error) {
    // Don't retry certain types of errors
    const nonRetryableErrors = ["ENOENT", "EACCES", "syntax error", "permission denied"]

    return !nonRetryableErrors.some((pattern) => error.message.toLowerCase().includes(pattern.toLowerCase()))
  }

  async startTask(task) {
    this.runningTasks.set(task.id, task)

    try {
      const result = await this.executeTaskInternal(task)
      this.runningTasks.delete(task.id)
      return result
    } catch (error) {
      this.runningTasks.delete(task.id)
      throw error
    }
  }

  async waitForAnyTask() {
    return new Promise((resolve) => {
      const checkTasks = () => {
        for (const [taskId, task] of this.runningTasks) {
          if (task.status === "completed" || task.status === "failed") {
            resolve(task)
            return
          }
        }
        setTimeout(checkTasks, 100)
      }
      checkTasks()
    })
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getStatus() {
    return {
      isExecuting: this.isExecuting,
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length,
      rollbackStackSize: this.rollbackStack.length,
      options: this.options,
    }
  }

  getTaskHistory() {
    return {
      completed: this.completedTasks.map((task) => ({
        id: task.id,
        name: task.name || task.action,
        duration: task.duration,
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
      })),
      failed: this.failedTasks.map((task) => ({
        id: task.id,
        name: task.name || task.action,
        error: task.error,
        attempts: task.attempts,
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
      })),
    }
  }
}

module.exports = { TaskExecutor }
