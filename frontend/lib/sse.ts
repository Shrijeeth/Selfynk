import { useState, useEffect } from "react"

export function useSSEStream(url: string | null) {
  const [text, setText] = useState("")
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    setText("")
    setIsDone(false)
    setError(null)

    const es = new EventSource(url)
    es.addEventListener("chunk", (e) => setText(prev => prev + e.data))
    es.addEventListener("done", () => { setIsDone(true); es.close() })
    es.addEventListener("error", (e: any) => { setError(e.data); es.close() })

    return () => es.close()
  }, [url])

  return { text, isDone, error }
}
