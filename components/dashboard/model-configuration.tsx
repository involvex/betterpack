"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Cloud, HardDrive, Key, Settings, Download, Play, Square } from "lucide-react"

interface ModelConfig {
  provider: string
  model: string
  apiKey?: string
  endpoint?: string
  isLocal: boolean
  status: "connected" | "disconnected" | "loading"
  performance: {
    latency: number
    tokensPerSecond: number
    memoryUsage: number
  }
}

export function ModelConfiguration() {
  const [currentModel, setCurrentModel] = useState<ModelConfig>({
    provider: "google",
    model: "gemini-pro",
    status: "connected",
    isLocal: false,
    performance: {
      latency: 245,
      tokensPerSecond: 42,
      memoryUsage: 1.2,
    },
  })

  const [availableModels, setAvailableModels] = useState([
    { provider: "google", model: "gemini-pro", type: "cloud", size: "540B" },
    { provider: "google", model: "gemini-pro-vision", type: "cloud", size: "540B" },
    { provider: "openai", model: "gpt-4", type: "cloud", size: "175B" },
    { provider: "openai", model: "gpt-3.5-turbo", type: "cloud", size: "175B" },
    { provider: "local", model: "tinyllama", type: "local", size: "1.1B" },
    { provider: "local", model: "phi-3-mini", type: "local", size: "3.8B" },
    { provider: "local", model: "llama-2-7b", type: "local", size: "7B" },
  ])

  const [localModels, setLocalModels] = useState([
    { name: "tinyllama", status: "downloaded", size: "637MB", path: "/models/tinyllama" },
    { name: "phi-3-mini", status: "available", size: "2.3GB", path: "" },
    { name: "llama-2-7b", status: "available", size: "3.5GB", path: "" },
  ])

  const [apiKeys, setApiKeys] = useState({
    google: "",
    openai: "",
    anthropic: "",
  })

  const [isLocalServerRunning, setIsLocalServerRunning] = useState(false)

  const handleModelChange = (provider: string, model: string) => {
    setCurrentModel((prev) => ({
      ...prev,
      provider,
      model,
      isLocal: provider === "local",
      status: "loading",
    }))

    // Simulate connection
    setTimeout(() => {
      setCurrentModel((prev) => ({ ...prev, status: "connected" }))
    }, 2000)
  }

  const downloadLocalModel = (modelName: string) => {
    setLocalModels((prev) =>
      prev.map((model) => (model.name === modelName ? { ...model, status: "downloading" } : model)),
    )

    // Simulate download
    setTimeout(() => {
      setLocalModels((prev) =>
        prev.map((model) =>
          model.name === modelName ? { ...model, status: "downloaded", path: `/models/${modelName}` } : model,
        ),
      )
    }, 5000)
  }

  const toggleLocalServer = () => {
    setIsLocalServerRunning(!isLocalServerRunning)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "downloaded":
        return "text-green-500"
      case "loading":
      case "downloading":
        return "text-yellow-500"
      case "disconnected":
      case "available":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
      case "downloaded":
        return (
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        )
      case "loading":
      case "downloading":
        return <Badge variant="secondary">Loading...</Badge>
      case "disconnected":
      case "available":
        return <Badge variant="outline">Available</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Current AI Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {currentModel.isLocal ? <HardDrive className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
                <span className="font-medium">
                  {currentModel.provider}/{currentModel.model}
                </span>
              </div>
              {getStatusBadge(currentModel.status)}
            </div>
            <div className="flex items-center gap-2">
              {currentModel.isLocal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLocalServer}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {isLocalServerRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isLocalServerRunning ? "Stop" : "Start"} Server
                </Button>
              )}
            </div>
          </div>

          {currentModel.status === "connected" && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentModel.performance.latency}ms</div>
                <div className="text-sm text-muted-foreground">Latency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentModel.performance.tokensPerSecond}</div>
                <div className="text-sm text-muted-foreground">Tokens/sec</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentModel.performance.memoryUsage}GB</div>
                <div className="text-sm text-muted-foreground">Memory</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Tabs defaultValue="cloud" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cloud">Cloud Models</TabsTrigger>
          <TabsTrigger value="local">Local Models</TabsTrigger>
        </TabsList>

        <TabsContent value="cloud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Cloud AI Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={currentModel.provider}
                    onValueChange={(value) => handleModelChange(value, currentModel.model)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={currentModel.model}
                    onValueChange={(value) => handleModelChange(currentModel.provider, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels
                        .filter((m) => m.provider === currentModel.provider && m.type === "cloud")
                        .map((model) => (
                          <SelectItem key={model.model} value={model.model}>
                            {model.model} ({model.size})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* API Keys */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <Label>API Keys</Label>
                </div>

                {currentModel.provider === "google" && (
                  <div className="space-y-2">
                    <Label htmlFor="google-key">Google AI API Key</Label>
                    <Input
                      id="google-key"
                      type="password"
                      placeholder="AIza..."
                      value={apiKeys.google}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, google: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        className="text-primary hover:underline"
                        rel="noreferrer"
                      >
                        Google AI Studio
                      </a>{" "}
                      (Free tier available with generous limits)
                    </p>
                  </div>
                )}

                {currentModel.provider === "openai" && (
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, openai: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Requires paid OpenAI account</p>
                  </div>
                )}

                {currentModel.provider === "anthropic" && (
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk-ant-..."
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, anthropic: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Local AI Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Local Server Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isLocalServerRunning ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="font-medium">Local Model Server</span>
                  <Badge variant={isLocalServerRunning ? "default" : "secondary"}>
                    {isLocalServerRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleLocalServer}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {isLocalServerRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isLocalServerRunning ? "Stop" : "Start"}
                </Button>
              </div>

              {/* Available Local Models */}
              <div className="space-y-3">
                {localModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.size}</div>
                      </div>
                      {getStatusBadge(model.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {model.status === "available" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadLocalModel(model.name)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                      {model.status === "downloaded" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModelChange("local", model.name)}
                          disabled={currentModel.model === model.name}
                        >
                          {currentModel.model === model.name ? "Active" : "Use Model"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Local Model Configuration */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Label>Local Server Configuration</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="local-port">Server Port</Label>
                    <Input id="local-port" placeholder="11434" defaultValue="11434" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local-host">Host</Label>
                    <Input id="local-host" placeholder="localhost" defaultValue="localhost" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model-path">Models Directory</Label>
                  <Input id="model-path" placeholder="/path/to/models" defaultValue="./models" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
