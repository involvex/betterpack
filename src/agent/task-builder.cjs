class TaskBuilder {
  constructor() {
    this.tasks = []
  }

  static create() {
    return new TaskBuilder()
  }

  // Package management tasks
  install(packages = []) {
    this.tasks.push({
      type: "package",
      action: "install",
      packages: Array.isArray(packages) ? packages : [packages],
      name: `Install ${Array.isArray(packages) ? packages.join(", ") : packages || "dependencies"}`,
    })
    return this
  }

  update(packages = []) {
    this.tasks.push({
      type: "package",
      action: "update",
      packages: Array.isArray(packages) ? packages : [packages],
      name: `Update ${Array.isArray(packages) ? packages.join(", ") : packages || "dependencies"}`,
    })
    return this
  }

  audit(fix = false) {
    this.tasks.push({
      type: "package",
      action: "audit",
      flags: fix ? ["--fix"] : [],
      name: `Security audit${fix ? " with fixes" : ""}`,
    })
    return this
  }

  // File operations
  createFile(filePath, content = "") {
    this.tasks.push({
      type: "file",
      operation: "create",
      filePath,
      content,
      name: `Create file: ${filePath}`,
    })
    return this
  }

  modifyFile(filePath, content) {
    this.tasks.push({
      type: "file",
      operation: "modify",
      filePath,
      content,
      name: `Modify file: ${filePath}`,
    })
    return this
  }

  deleteFile(filePath) {
    this.tasks.push({
      type: "file",
      operation: "delete",
      filePath,
      name: `Delete file: ${filePath}`,
    })
    return this
  }

  // Git operations
  gitInit() {
    this.tasks.push({
      type: "git",
      gitAction: "init",
      name: "Initialize git repository",
    })
    return this
  }

  gitAdd(files = ".") {
    this.tasks.push({
      type: "git",
      gitAction: "add",
      args: [files],
      name: `Git add: ${files}`,
    })
    return this
  }

  gitCommit(message) {
    this.tasks.push({
      type: "git",
      gitAction: "commit",
      args: ["-m", message],
      name: `Git commit: ${message}`,
    })
    return this
  }

  // Command execution
  command(command, args = []) {
    this.tasks.push({
      type: "command",
      command,
      args: Array.isArray(args) ? args : [args],
      name: `Execute: ${command} ${Array.isArray(args) ? args.join(" ") : args}`,
    })
    return this
  }

  // Script execution
  script(scriptPath, args = []) {
    this.tasks.push({
      type: "script",
      scriptPath,
      args: Array.isArray(args) ? args : [args],
      name: `Run script: ${scriptPath}`,
    })
    return this
  }

  // Custom task
  custom(name, executor) {
    this.tasks.push({
      type: "custom",
      name,
      executor,
    })
    return this
  }

  // Action from string (for AI recommendations)
  fromAction(action, name = null) {
    this.tasks.push({
      type: "inferred",
      action,
      name: name || `Execute: ${action}`,
    })
    return this
  }

  // Build from AI recommendations
  fromRecommendations(recommendations) {
    for (const rec of recommendations) {
      if (rec.action) {
        this.fromAction(rec.action, rec.message)
      }
    }
    return this
  }

  // Build from analysis issues
  fromIssues(issues) {
    for (const issue of issues) {
      if (issue.fix) {
        this.fromAction(issue.fix, `Fix: ${issue.message}`)
      }
    }
    return this
  }

  // Conditional tasks
  when(condition, taskBuilder) {
    if (condition) {
      if (typeof taskBuilder === "function") {
        taskBuilder(this)
      } else {
        this.tasks.push(...taskBuilder.build())
      }
    }
    return this
  }

  // Parallel execution group
  parallel(taskBuilder) {
    const parallelTasks =
      typeof taskBuilder === "function" ? taskBuilder(TaskBuilder.create()).build() : taskBuilder.build()

    this.tasks.push({
      type: "parallel",
      tasks: parallelTasks,
      name: `Parallel execution of ${parallelTasks.length} tasks`,
    })
    return this
  }

  // Sequential execution group
  sequential(taskBuilder) {
    const sequentialTasks =
      typeof taskBuilder === "function" ? taskBuilder(TaskBuilder.create()).build() : taskBuilder.build()

    this.tasks.push({
      type: "sequential",
      tasks: sequentialTasks,
      name: `Sequential execution of ${sequentialTasks.length} tasks`,
    })
    return this
  }

  // Build the task list
  build() {
    return [...this.tasks]
  }

  // Clear tasks
  clear() {
    this.tasks = []
    return this
  }

  // Get task count
  count() {
    return this.tasks.length
  }
}

// Helper functions for common task patterns
class TaskPatterns {
  static projectSetup() {
    return TaskBuilder.create().install().gitInit().gitAdd(".").gitCommit("Initial commit")
  }

  static securityUpdate() {
    return TaskBuilder.create().audit(true).update()
  }

  static dependencyMaintenance() {
    return TaskBuilder.create().command("bpack", ["outdated"]).update().audit()
  }

  static buildAndTest() {
    return TaskBuilder.create().command("bpack", ["build"]).command("bpack", ["test"])
  }

  static fromAnalysis(analysisData) {
    const builder = TaskBuilder.create()

    // Handle critical issues first
    const criticalIssues = analysisData.issues?.filter((i) => i.severity === "high") || []
    builder.fromIssues(criticalIssues)

    // Handle AI recommendations
    if (analysisData.aiRecommendations) {
      builder.fromRecommendations(analysisData.aiRecommendations)
    } else if (analysisData.recommendations) {
      builder.fromRecommendations(analysisData.recommendations)
    }

    return builder
  }
}

module.exports = { TaskBuilder, TaskPatterns }
