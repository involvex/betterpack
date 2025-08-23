import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, XCircle, Activity, Package, Server, Bot } from "lucide-react"

interface HealthMetricsProps {
  healthData: {
    overall: { score: number; status: string }
    project: { score: number; status: string }
    system: { score: number; status: string }
    agent: { score: number; status: string }
  }
}

export function HealthMetrics({ healthData }: HealthMetricsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-chart-1" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-chart-4" />
      case "critical":
        return <XCircle className="h-5 w-5 text-chart-5" />
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-chart-1/10 text-chart-1 hover:bg-chart-1/20">Healthy</Badge>
      case "warning":
        return <Badge className="bg-chart-4/10 text-chart-4 hover:bg-chart-4/20">Warning</Badge>
      case "critical":
        return <Badge className="bg-chart-5/10 text-chart-5 hover:bg-chart-5/20">Critical</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const healthCategories = [
    {
      title: "Project Health",
      description: "Dependencies, configuration, and project structure",
      icon: <Package className="h-5 w-5" />,
      data: healthData.project,
      details: [
        { label: "Package.json", status: "healthy" },
        { label: "Dependencies", status: "healthy" },
        { label: "Lockfile", status: "healthy" },
        { label: "Node Modules", status: "warning" },
      ],
    },
    {
      title: "System Health",
      description: "CPU, memory, disk, and network resources",
      icon: <Server className="h-5 w-5" />,
      data: healthData.system,
      details: [
        { label: "CPU Usage", status: "healthy" },
        { label: "Memory Usage", status: "warning" },
        { label: "Disk Space", status: "healthy" },
        { label: "Network", status: "healthy" },
      ],
    },
    {
      title: "Agent Health",
      description: "AI engine, task execution, and monitoring systems",
      icon: <Bot className="h-5 w-5" />,
      data: healthData.agent,
      details: [
        { label: "AI Engine", status: "healthy" },
        { label: "Task Executor", status: "healthy" },
        { label: "Monitoring", status: "healthy" },
        { label: "Learning System", status: "healthy" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Overall System Health
          </CardTitle>
          <CardDescription>Comprehensive health score across all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(healthData.overall.status)}
              <div>
                <p className="text-2xl font-bold">{healthData.overall.score}/100</p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
            </div>
            {getStatusBadge(healthData.overall.status)}
          </div>
          <Progress value={healthData.overall.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {healthCategories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {category.icon}
                {category.title}
              </CardTitle>
              <CardDescription className="text-sm">{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(category.data.status)}
                  <span className="font-medium">{category.data.score}/100</span>
                </div>
                {getStatusBadge(category.data.status)}
              </div>

              <Progress value={category.data.score} className="h-2" />

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Components:</p>
                {category.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-center justify-between text-sm">
                    <span>{detail.label}</span>
                    <div className="flex items-center gap-1">{getStatusIcon(detail.status)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
          <CardDescription>Health score changes over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Health trend chart would be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
