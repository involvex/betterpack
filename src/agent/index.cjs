const { AutomatedAgent } = require("./agent-core.cjs")
const { ProjectAnalyzer } = require("./project-analyzer.cjs")
const { showAgentStatus } = require("./agent-status.cjs")
const { generateReport } = require("./report-generator.cjs")
const { stopAgent } = require("./agent-stop.cjs")
const http = require("http")
const { createWebSocketServer } = require("./ws-server.cjs")

// CLI interface for the agent
function runAgentCli(args) {
  const command = args[0]
  const options = parseAgentOptions(args.slice(1))

  switch (command) {
    case "start":
      return startAgent(options)
    case "analyze":
      return analyzeProject(options)
    case "status":
      return showAgentStatus(options)
    case "report":
      return generateReport(options)
    case "stop":
      return stopAgent(options)
    default:
      showAgentHelp()
  }
}

async function startAgent(options) {
  console.log("[Agent] Initializing automated project management...")

  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("Agent WebSocket server is running\n")
  })

  const wss = createWebSocketServer(server)
  const port = options.port || 8080
  server.listen(port, () => {
    console.log(`[Agent] WebSocket server listening on port ${port}`)
  })

  const agent = new AutomatedAgent({ ...options, wss })
  const analysis = await agent.start()

  console.log("\n=== Project Analysis Summary ===")
  const summary = agent.analyzer.getAnalysisSummary()
  console.log(`Project Type: ${summary.projectType}`)
  console.log(`Health Score: ${summary.healthScore}/100 (${summary.healthStatus})`)
  console.log(`Dependencies: ${summary.totalDependencies}`)
  console.log(`Issues Found: ${summary.issuesCount}`)
  console.log(`Recommendations: ${summary.recommendationsCount}`)

  if (summary.frameworks.length > 0) {
    console.log(`Frameworks: ${summary.frameworks.join(", ")}`)
  }

  if (summary.buildTools.length > 0) {
    console.log(`Build Tools: ${summary.buildTools.join(", ")}`)
  }

  console.log("\n[Agent] Automated management is now active!")
  console.log('Use "bpack agent status" to check status')
  console.log('Use "bpack agent stop" to stop the agent')

  // Keep the process running in watch mode
  if (options.watchMode) {
    process.on("SIGINT", async () => {
      console.log("\n[Agent] Shutting down...")
      await agent.stop()
      process.exit(0)
    })

    // Keep alive
    setInterval(() => {}, 1000)
  }
}

async function analyzeProject(options) {
  console.log("[Agent] Analyzing project...")

  const analyzer = new ProjectAnalyzer(options.projectPath)
  const analysis = await analyzer.analyzeProject()

  console.log("\n=== Project Analysis Report ===")
  console.log(JSON.stringify(analysis, null, 2))
}

function parseAgentOptions(args) {
  const options = {
    autoFix: false,
    watchMode: false,
    aggressiveness: "moderate",
    projectPath: process.cwd(),
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case "--auto-fix":
        options.autoFix = true
        break
      case "--watch":
        options.watchMode = true
        break
      case "--aggressive":
        options.aggressiveness = "aggressive"
        break
      case "--conservative":
        options.aggressiveness = "conservative"
        break
      case "--path":
        options.projectPath = args[++i]
        break
      case "--port":
        options.port = parseInt(args[++i], 10)
        break
    }
  }

  return options
}

function showAgentHelp() {
  console.log("\n\x1b[1mBetterpack Agent - Automated Project Management\x1b[0m")
  console.log("\nUsage: bpack agent <command> [options]")
  console.log("\n\x1b[1mCommands:\x1b[0m")
  console.log("  \x1b[36mstart\x1b[0m      Start the automated agent")
  console.log("  \x1b[36manalyze\x1b[0m    Analyze the current project")
  console.log("  \x1b[36mstatus\x1b[0m     Show agent status")
  console.log("  \x1b[36mreport\x1b[0m     Generate detailed report")
  console.log("  \x1b[36mstop\x1b[0m       Stop the agent")
  console.log("\n\x1b[1mOptions:\x1b[0m")
  console.log("  \x1b[36m--auto-fix\x1b[0m       Automatically fix detected issues")
  console.log("  \x1b[36m--watch\x1b[0m          Monitor files for changes")
  console.log("  \x1b[36m--aggressive\x1b[0m     More aggressive automation")
  console.log("  \x1b[36m--conservative\x1b[0m   Conservative automation (safer)")
  console.log("  \x1b[36m--path <dir>\x1b[0m     Specify project directory")
  console.log("  \x1b[36m--port <num>\x1b[0m     WebSocket server port (default: 8080)")
  console.log("\n\x1b[1mExamples:\x1b[0m")
  console.log("  bpack agent start --auto-fix --watch")
  console.log("  bpack agent analyze --path /path/to/project")
  console.log("  bpack agent start --conservative")
}

module.exports = { runAgentCli, AutomatedAgent, ProjectAnalyzer }
