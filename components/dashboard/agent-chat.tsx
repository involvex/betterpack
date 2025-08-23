"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User, Send } from "lucide-react"

interface Message {
  sender: "user" | "bot"
  text: string
}

interface AgentChatProps {
  ws: WebSocket | null
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

export function AgentChat({ ws, messages, setMessages }: AgentChatProps) {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim() && ws && ws.readyState === WebSocket.OPEN) {
      const userMessage: Message = { sender: "user", text: input }
      setMessages((prev) => [...prev, userMessage])
      ws.send(JSON.stringify({ text: input }))
      setInput("")
    }
  }

  return (
    <Card suppressHydrationWarning>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot />
          Agent Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-96">
          <ScrollArea className="flex-grow p-4 border rounded-md">
            <div className="space-y-4" ref={scrollAreaRef}>
              {messages.map((msg: Message, index: number) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}>
                  {msg.sender === "bot" && <Bot className="h-6 w-6 text-primary" />}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  {msg.sender === "user" && <User className="h-6 w-6" />}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
              placeholder="Ask the agent to do something..."
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
