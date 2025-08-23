import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, Zap, Brain, Settings, Play, Pause } from "lucide-react"

interface AgentOverviewProps {
  agentStatus: {
    isRunning: boolean
    mode: string
    uptime: number
    lastActivity: Date
  }
  healthData: {
    overall: { score: number; status: string }
    project: { score: number; status: string }
    system: { score: number; status: string }
    agent: { score: number; status: string }
  }
  systemMetrics: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
}

export function AgentOverview({ agentStatus, healthData, systemMetrics }: AgentOverviewProps) {
  const [formattedLastActivity, setFormattedLastActivity] = useState("")

  useEffect(() => {
    setFormattedLastActivity(agentStatus.lastActivity.toLocaleTimeString())
  }, [agentStatus.lastActivity])

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Agent Status */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image src="/logo.png" alt="BetterPack Logo" width={20} height={20} />
            Agent Status
          </CardTitle>
          <CardDescription>Current status and configuration of the automated agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${agentStatus.isRunning ? "bg-chart-1" : "bg-muted"}`} />
              <div>
                <p className="font-medium">{agentStatus.isRunning ? "Active" : "Inactive"}</p>
                <p className="text-sm text-muted-foreground">Mode: {agentStatus.mode}</p>
              </div>
            </div>
            <Badge variant={agentStatus.isRunning ? "default" : "secondary"}>
              {agentStatus.isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <p className="text-2xl font-bold">{formatUptime(agentStatus.uptime)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Activity</span>
              </div>
              <p className="text-sm text-muted-foreground">{formattedLastActivity}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant={agentStatus.isRunning ? "outline" : "default"}>
              {agentStatus.isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Agent
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Agent
                </>
              )}
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall</span>
              <span className="text-sm text-muted-foreground">{healthData.overall.score}/100</span>
            </div>
            <Progress value={healthData.overall.score} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project</span>
              <span className="text-sm text-muted-foreground">{healthData.project.score}/100</span>
            </div>
            <Progress value={healthData.project.score} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System</span>
              <span className="text-sm text-muted-foreground">{healthData.system.score}/100</span>
            </div>
            <Progress value={healthData.system.score} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent</span>
              <span className="text-sm text-muted-foreground">{healthData.agent.score}/100</span>
            </div>
            <Progress value={healthData.agent.score} />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations for project management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Activity className="h-6 w-6" />
              <span className="text-sm">Run Analysis</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Zap className="h-6 w-6" />
              <span className="text-sm">Update Dependencies</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Security Audit</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Brain className="h-6 w-6" />
              <span className="text-sm">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
