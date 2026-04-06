import { useState, useEffect } from "react"

export function useSSEStream(url: string | null) {
  const [text, setText] = useState("")
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    // Reset state when URL changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText("")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDone(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)

    const es = new EventSource(url)
    es.addEventListener("chunk", (e) => setText((prev) => prev + e.data))
    es.addEventListener("done", () => {
      setIsDone(true)
      es.close()
    })
    es.addEventListener("error", (e: Event) => {
      const errorEvent = e as MessageEvent
      setError(errorEvent.data || "Unknown Streaming Error")
      es.close()
    })

    return () => es.close()
  }, [url])

  return { text, isDone, error }
}
