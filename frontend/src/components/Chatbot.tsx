import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Send, Loader, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot({ reportId }: { reportId: string }) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat history on mount
  useEffect(() => {
    if (!reportId || !token) return

    const loadChatHistory = async () => {
      try {
        console.log(`[Chatbot] Fetching chat history for reportId: ${reportId}`)
        const response = await fetch(
          `${API_URL}/chat/${reportId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        console.log(`[Chatbot] GET /chat/${reportId} response:`, response.status, response.statusText)
        if (response.ok) {
          const data = await response.json()
          console.log(`[Chatbot] Loaded ${data.messages?.length || 0} messages`)
          setMessages(data.messages || [])
        } else {
          const errorData = await response.json()
          console.error('[Chatbot] Error loading chat history:', errorData)
        }
      } catch (err) {
        console.error('[Chatbot] Failed to load chat history:', err)
      }
    }

    loadChatHistory()
  }, [reportId, token])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !token) return

    try {
      setError(null)
      setLoading(true)
      console.log(`[Chatbot] Sending message to /chat for reportId: ${reportId}`)

      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportId,
            message: input.trim(),
          }),
        }
      )

      console.log(`[Chatbot] POST /chat response:`, response.status, response.statusText)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Chatbot] Error response:', errorData)
        throw new Error(errorData.message || 'Failed to send message')
      }

      const data = await response.json()
      console.log('[Chatbot] Message sent successfully, received assistant reply')

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: data.userMessage,
        },
      ])

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.assistantMessage,
        },
      ])

      setInput('')
    } catch (err) {
      console.error('[Chatbot] Error in handleSendMessage:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 flex flex-col h-96">
      <h3 className="text-lg font-semibold mb-4">AI Chatbot</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Start a conversation about this report
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about this report..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  )
}
