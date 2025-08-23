import { spawn } from "child_process"

let agentProcess = null

export default function handler(req, res) {
  const { action } = req.query

  switch (action) {
    case "start":
      if (agentProcess) {
        return res.status(400).json({ message: "Agent is already running." })
      }
      agentProcess = spawn("node", ["cli.js", "agent", "start", "--watch"], {
        stdio: "inherit",
        shell: true,
      })
      res.status(200).json({ message: "Agent started." })
      break
    case "stop":
      if (!agentProcess) {
        return res.status(400).json({ message: "Agent is not running." })
      }
      agentProcess.kill()
      agentProcess = null
      res.status(200).json({ message: "Agent stopped." })
      break
    case "status":
      res.status(200).json({ isRunning: !!agentProcess })
      break
    default:
      res.status(400).json({ message: "Invalid action." })
  }
}
