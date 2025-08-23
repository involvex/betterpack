"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import {
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Settings,
  Cpu,
  HardDrive,
  Zap,
  Moon,
  Sun,
  Brain,
} from "lucide-react"
import { AgentOverview } from "@/components/dashboard/agent-overview"
import { HealthMetrics } from "@/components/dashboard/health-metrics"
import { TaskExecution } from "@/components/dashboard/task-execution"
import { SystemMonitoring } from "@/components/dashboard/system-monitoring"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { PerformanceCharts } from "@/components/dashboard/performance-charts"
import { ModelConfiguration } from "@/components/dashboard/model-configuration"
import { AgentChat } from "@/components/dashboard/agent-chat"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([])
  const [agentStatus, setAgentStatus] = useState({
    isRunning: false,
    mode: "smart",
    uptime: 0,
    lastActivity: new Date(),
  })

  const [healthData, setHealthData] = useState({
    overall: { score: 85, status: "healthy" },
    project: { score: 90, status: "healthy" },
    system: { score: 78, status: "warning" },
    agent: { score: 88, status: "healthy" },
  })

  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 34,
    network: 12,
  })

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: "warning",
      message: "High memory usage detected",
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
    },
    {
      id: 2,
      type: "info",
      message: "Task execution completed successfully",
      timestamp: new Date(Date.now() - 600000),
      acknowledged: true,
    },
  ])

  const toggleAgent = async () => {
    const action = agentStatus.isRunning ? "stop" : "start"
    try {
      const response = await fetch(`/api/agent?action=${action}`)
      const data = await response.json()
      console.log(data.message)
      setAgentStatus((prev) => ({ ...prev, isRunning: !prev.isRunning }))
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error)
    }
  }

  // Simulate real-time updates
  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      const socket = new WebSocket("ws://localhost:8080")
      setWs(socket)

      socket.onopen = () => {
        console.log("WebSocket connected")
        setMessages([{ sender: "bot", text: "Connected to agent. How can I help you?" }])
      }

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setMessages((prev) => [...prev, { sender: "bot", text: message.text || "Received empty message" }])
      }

      socket.onclose = () => {
        console.log("WebSocket disconnected")
        setMessages((prev) => [...prev, { sender: "bot", text: "Connection lost. Please restart the agent." }])
      }
    }

    const interval = setInterval(() => {
      setSystemMetrics((prev) => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
      }))

      if (agentStatus.isRunning) {
        setAgentStatus((prev) => ({
          ...prev,
          uptime: prev.uptime + 5000,
          lastActivity: new Date(),
        }))
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      if (ws) {
        ws.close()
      }
    }
  }, [agentStatus.isRunning, ws])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-chart-1"
      case "warning":
        return "text-chart-4"
      case "critical":
        return "text-chart-5"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
        return <XCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="BetterPack Logo" width={24} height={24} />
                <h1 className="text-2xl font-bold text-foreground">BetterPack Agent</h1>
              </div>
              <Badge variant={agentStatus.isRunning ? "default" : "secondary"}>
                {agentStatus.isRunning ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Agent Status:</span>
                <Switch checked={agentStatus.isRunning} onCheckedChange={toggleAgent} />
              </div>
              <SettingsDialog />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              <div className={getStatusColor(healthData.overall.status)}>
                {getStatusIcon(healthData.overall.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData.overall.score}/100</div>
              <Progress value={healthData.overall.score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">System is {healthData.overall.status}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.cpu.toFixed(1)}%</div>
              <Progress value={systemMetrics.cpu} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {systemMetrics.cpu > 80 ? "High usage" : "Normal usage"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.memory.toFixed(1)}%</div>
              <Progress value={systemMetrics.memory} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {systemMetrics.memory > 80 ? "High usage" : "Normal usage"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.filter((a) => !a.acknowledged).length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {alerts.filter((a) => a.type === "warning").length} warnings,{" "}
                {alerts.filter((a) => a.type === "error").length} errors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="models">
              <Brain className="h-4 w-4 mr-2" />
              AI Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentOverview agentStatus={agentStatus} healthData={healthData} systemMetrics={systemMetrics} />
              <AgentChat ws={ws} messages={messages} setMessages={setMessages} />
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <HealthMetrics healthData={healthData} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskExecution />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <SystemMonitoring systemMetrics={systemMetrics} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel alerts={alerts} setAlerts={setAlerts} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceCharts />
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <ModelConfiguration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
