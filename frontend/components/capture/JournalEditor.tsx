"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from "lucide-react"

interface JournalEditorProps {
  content: string
  onChange: (content: string) => void
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  return (
    <div className="border-border bg-muted/40 flex flex-wrap gap-1 overflow-hidden rounded-t-xl border-b p-1.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("bold") && "bg-background text-foreground shadow-sm"
        )}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("italic") && "bg-background text-foreground shadow-sm"
        )}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>

      <div className="bg-border mx-1 h-6 w-px self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("heading", { level: 2 }) &&
            "bg-background text-foreground shadow-sm"
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("heading", { level: 3 }) &&
            "bg-background text-foreground shadow-sm"
        )}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div className="bg-border mx-1 h-6 w-px self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("bulletList") &&
            "bg-background text-foreground shadow-sm"
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-md p-2 transition-colors",
          editor.isActive("orderedList") &&
            "bg-background text-foreground shadow-sm"
        )}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
    </div>
  )
}

export function JournalEditor({ content, onChange }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[200px] p-5 text-sm md:text-base leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_p]:my-2 [&_li>p]:my-0 empty:before:content-['Start_writing...'] empty:before:text-muted-foreground empty:before:pointer-events-none",
      },
    },
  })

  return (
    <div className="border-input bg-background focus-within:ring-ring flex flex-col rounded-xl border shadow-sm transition-all focus-within:border-transparent focus-within:ring-2">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="flex-1 cursor-text"
        onClick={() => editor?.commands.focus()}
      />
    </div>
  )
}
