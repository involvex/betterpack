import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Play, Pause, RotateCcw } from "lucide-react"

export function TaskExecution() {
  const runningTasks = [
    {
      id: 1,
      name: "Security Audit",
      progress: 75,
      status: "running",
      startTime: new Date(Date.now() - 120000),
      estimatedCompletion: new Date(Date.now() + 30000),
    },
    {
      id: 2,
      name: "Dependency Update",
      progress: 45,
      status: "running",
      startTime: new Date(Date.now() - 300000),
      estimatedCompletion: new Date(Date.now() + 180000),
    },
  ]

  const recentTasks = [
    {
      id: 3,
      name: "Project Analysis",
      status: "completed",
      duration: 45000,
      completedAt: new Date(Date.now() - 600000),
      result: "success",
    },
    {
      id: 4,
      name: "Install Dependencies",
      status: "completed",
      duration: 120000,
      completedAt: new Date(Date.now() - 900000),
      result: "success",
    },
    {
      id: 5,
      name: "Lint Fix",
      status: "failed",
      duration: 15000,
      completedAt: new Date(Date.now() - 1200000),
      result: "error",
      error: "Syntax errors found",
    },
  ]

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusIcon = (status: string, result?: string) => {
    if (status === "running") return <Clock className="h-4 w-4 text-chart-2 animate-spin" />
    if (status === "completed" && result === "success") return <CheckCircle className="h-4 w-4 text-chart-1" />
    if (status === "failed" || result === "error") return <XCircle className="h-4 w-4 text-chart-5" />
    return <Clock className="h-4 w-4 text-muted-foreground" />
  }

  const getStatusBadge = (status: string, result?: string) => {
    if (status === "running") return <Badge className="bg-chart-2/10 text-chart-2">Running</Badge>
    if (status === "completed" && result === "success")
      return <Badge className="bg-chart-1/10 text-chart-1">Success</Badge>
    if (status === "failed" || result === "error") return <Badge className="bg-chart-5/10 text-chart-5">Failed</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Task Queue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Running Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{runningTasks.length}</div>
            <p className="text-sm text-muted-foreground">Currently executing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">12</div>
            <p className="text-sm text-muted-foreground">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">94%</div>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Running Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Active Tasks
          </CardTitle>
          <CardDescription>Currently executing tasks and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          {runningTasks.length > 0 ? (
            <div className="space-y-4">
              {runningTasks.map((task) => (
                <div key={task.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {formatDuration(Date.now() - task.startTime.getTime())} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                    <p className="text-xs text-muted-foreground">
                      Estimated completion: {task.estimatedCompletion.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks currently running</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Recent Tasks
          </CardTitle>
          <CardDescription>Recently completed and failed task executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status, task.result)}
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(task.duration)} • {task.completedAt.toLocaleTimeString()}
                    </p>
                    {task.error && <p className="text-sm text-chart-5">{task.error}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(task.status, task.result)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
