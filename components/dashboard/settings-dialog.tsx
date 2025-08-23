"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings } from "lucide-react"

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [autoFix, setAutoFix] = useState(false)
  const [watchMode, setWatchMode] = useState(false)
  const [aggressiveness, setAggressiveness] = useState("moderate")

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Agent Settings</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                X
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure the agent's behavior and settings.
            </p>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auto-fix" className="text-right">
                  Auto-fix
                </Label>
                <Switch id="auto-fix" checked={autoFix} onCheckedChange={setAutoFix} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="watch-mode" className="text-right">
                  Watch Mode
                </Label>
                <Switch id="watch-mode" checked={watchMode} onCheckedChange={setWatchMode} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aggressiveness" className="text-right">
                  Aggressiveness
                </Label>
                <select
                  id="aggressiveness"
                  value={aggressiveness}
                  onChange={(e) => setAggressiveness(e.target.value)}
                  className="col-span-3 bg-input border rounded-md p-2"
                  title="aggressiveness"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
