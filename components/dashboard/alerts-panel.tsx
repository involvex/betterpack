"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, Info, Bell, BellOff } from "lucide-react"

interface Alert {
  id: number
  type: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

interface AlertsPanelProps {
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
}

export function AlertsPanel({ alerts, setAlerts }: AlertsPanelProps) {
  const acknowledgeAlert = (id: number) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-chart-5" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-4" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-chart-1" />
      case "info":
        return <Info className="h-4 w-4 text-chart-2" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "error":
        return <Badge className="bg-chart-5/10 text-chart-5">Error</Badge>
      case "warning":
        return <Badge className="bg-chart-4/10 text-chart-4">Warning</Badge>
      case "success":
        return <Badge className="bg-chart-1/10 text-chart-1">Success</Badge>
      case "info":
        return <Badge className="bg-chart-2/10 text-chart-2">Info</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return "Just now"
  }

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)
  const acknowledgedAlerts = alerts.filter((alert) => alert.acknowledged)

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{activeAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{alerts.filter((a) => a.type === "error").length}</div>
            <p className="text-sm text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{alerts.filter((a) => a.type === "warning").length}</div>
            <p className="text-sm text-muted-foreground">Potential issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Active Alerts
          </CardTitle>
          <CardDescription>Alerts that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground mt-1">{formatTimeAgo(alert.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAlertBadge(alert.type)}
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">All systems are running normally</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-primary" />
            Recent Alerts
          </CardTitle>
          <CardDescription>Previously acknowledged alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {acknowledgedAlerts.length > 0 ? (
            <div className="space-y-3">
              {acknowledgedAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{formatTimeAgo(alert.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAlertBadge(alert.type)}
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No acknowledged alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
