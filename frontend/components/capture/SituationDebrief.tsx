"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const SITUATION_TYPES = [
  "meeting",
  "interview",
  "presentation",
  "difficult conversation",
  "other",
] as const

export type SituationType = (typeof SITUATION_TYPES)[number]

export interface SituationDebriefData {
  situation_type: SituationType | ""
  how_i_showed_up: string
  value_demonstrated: string
  what_id_do_differently: string
}

interface SituationDebriefProps {
  data: SituationDebriefData
  onChange: (data: SituationDebriefData) => void
}

export function SituationDebrief({ data, onChange }: SituationDebriefProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Situation type</Label>
        <Select
          value={data.situation_type}
          onValueChange={(val) =>
            onChange({ ...data, situation_type: val as SituationType })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select situation type" />
          </SelectTrigger>
          <SelectContent>
            {SITUATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="how_i_showed_up">How you showed up</Label>
        <Textarea
          id="how_i_showed_up"
          rows={3}
          placeholder="How did you show up in this situation?"
          value={data.how_i_showed_up}
          onChange={(e) =>
            onChange({ ...data, how_i_showed_up: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value_demonstrated">Value demonstrated</Label>
        <Textarea
          id="value_demonstrated"
          rows={3}
          placeholder="What value did you demonstrate or fail to demonstrate?"
          value={data.value_demonstrated}
          onChange={(e) =>
            onChange({ ...data, value_demonstrated: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="what_id_do_differently">
          What you&apos;d do differently
        </Label>
        <Textarea
          id="what_id_do_differently"
          rows={3}
          placeholder="What would you do differently next time?"
          value={data.what_id_do_differently}
          onChange={(e) =>
            onChange({ ...data, what_id_do_differently: e.target.value })
          }
        />
      </div>
    </div>
  )
}
