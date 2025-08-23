import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Cpu, HardDrive, Activity, Wifi, Server, Monitor } from "lucide-react"

interface SystemMonitoringProps {
  systemMetrics: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
}

export function SystemMonitoring({ systemMetrics }: SystemMonitoringProps) {
  const getUsageColor = (usage: number) => {
    if (usage > 80) return "text-chart-5"
    if (usage > 60) return "text-chart-4"
    return "text-chart-1"
  }

  const getUsageBadge = (usage: number) => {
    if (usage > 80) return <Badge className="bg-chart-5/10 text-chart-5">High</Badge>
    if (usage > 60) return <Badge className="bg-chart-4/10 text-chart-4">Medium</Badge>
    return <Badge className="bg-chart-1/10 text-chart-1">Normal</Badge>
  }

  const metrics = [
    {
      title: "CPU Usage",
      value: systemMetrics.cpu,
      icon: <Cpu className="h-5 w-5" />,
      description: "Processor utilization",
      details: [
        { label: "Cores", value: "8" },
        { label: "Threads", value: "16" },
        { label: "Base Clock", value: "3.2 GHz" },
        { label: "Boost Clock", value: "4.8 GHz" },
      ],
    },
    {
      title: "Memory Usage",
      value: systemMetrics.memory,
      icon: <HardDrive className="h-5 w-5" />,
      description: "RAM utilization",
      details: [
        { label: "Total RAM", value: "16 GB" },
        { label: "Available", value: "6.1 GB" },
        { label: "Used", value: "9.9 GB" },
        { label: "Cached", value: "2.4 GB" },
      ],
    },
    {
      title: "Disk Usage",
      value: systemMetrics.disk,
      icon: <Server className="h-5 w-5" />,
      description: "Storage utilization",
      details: [
        { label: "Total Space", value: "512 GB" },
        { label: "Used Space", value: "174 GB" },
        { label: "Free Space", value: "338 GB" },
        { label: "Type", value: "NVMe SSD" },
      ],
    },
    {
      title: "Network Activity",
      value: systemMetrics.network,
      icon: <Wifi className="h-5 w-5" />,
      description: "Network throughput",
      details: [
        { label: "Download", value: "45.2 Mbps" },
        { label: "Upload", value: "12.8 Mbps" },
        { label: "Latency", value: "23 ms" },
        { label: "Connection", value: "Ethernet" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            System Overview
          </CardTitle>
          <CardDescription>Real-time system resource monitoring and utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <div className={`p-3 rounded-full bg-muted ${getUsageColor(metric.value)}`}>{metric.icon}</div>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getUsageColor(metric.value)}`}>{metric.value.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  {metric.title}
                </div>
                {getUsageBadge(metric.value)}
              </CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Usage</span>
                  <span className={getUsageColor(metric.value)}>{metric.value.toFixed(1)}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Details:</p>
                {metric.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Operating System</p>
              <p className="font-medium">macOS Sonoma 14.2</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Node.js Version</p>
              <p className="font-medium">v20.10.0</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Architecture</p>
              <p className="font-medium">arm64</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <p className="font-medium">2d 14h 32m</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
