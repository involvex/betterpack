"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, Activity, Clock, Zap } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const generateChartData = () => {
  const data = []
  for (let i = 15; i >= 0; i--) {
    data.push({
      time: new Date(Date.now() - i * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 20,
    })
  }
  return data
}

export function PerformanceCharts() {
  const performanceMetrics = [
    {
      title: "Task Execution Time",
      value: "2.3s",
      change: -12,
      trend: "down",
      description: "Average time per task",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Success Rate",
      value: "94.2%",
      change: 3,
      trend: "up",
      description: "Task completion rate",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: "Throughput",
      value: "45/hr",
      change: 8,
      trend: "up",
      description: "Tasks completed per hour",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Error Rate",
      value: "5.8%",
      change: -15,
      trend: "down",
      description: "Failed task percentage",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ]

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-chart-1" />
    ) : (
      <TrendingDown className="h-4 w-4 text-chart-5" />
    )
  }

  const getTrendColor = (trend: string, isError = false) => {
    if (isError) {
      return trend === "down" ? "text-chart-1" : "text-chart-5"
    }
    return trend === "up" ? "text-chart-1" : "text-chart-5"
  }

  const [chartData, setChartData] = useState<{ time: string; cpu: number; memory: number }[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setChartData(generateChartData())
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(metric.trend)}
                <span className={`text-sm ${getTrendColor(metric.trend, metric.title === "Error Rate")}`}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="text-sm text-muted-foreground">vs last week</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>CPU usage over the last 15 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Memory usage over the last 15 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Analysis
          </CardTitle>
          <CardDescription>Detailed breakdown of system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Top Performing Tasks */}
            <div>
              <h4 className="font-medium mb-3">Top Performing Tasks</h4>
              <div className="space-y-2">
                {[
                  { name: "Security Audit", avgTime: "1.2s", successRate: "98%" },
                  { name: "Dependency Update", avgTime: "3.4s", successRate: "95%" },
                  { name: "Lint Fix", avgTime: "0.8s", successRate: "92%" },
                ].map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="font-medium">{task.name}</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{task.avgTime}</Badge>
                      <Badge className="bg-chart-1/10 text-chart-1">{task.successRate}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Bottlenecks */}
            <div>
              <h4 className="font-medium mb-3">Performance Bottlenecks</h4>
              <div className="space-y-2">
                {[
                  { issue: "High memory usage during large file operations", impact: "Medium" },
                  { issue: "Network latency affecting remote dependency checks", impact: "Low" },
                  { issue: "CPU spikes during concurrent task execution", impact: "High" },
                ].map((bottleneck, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{bottleneck.issue}</span>
                    <Badge
                      variant={
                        bottleneck.impact === "High"
                          ? "destructive"
                          : bottleneck.impact === "Medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {bottleneck.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
