"use client"

import { NetworkContactType } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const CONTACT_TYPES: { value: NetworkContactType; label: string }[] = [
  { value: "decision_maker", label: "Decision Maker" },
  { value: "info_source", label: "Info Source" },
  { value: "supporter", label: "Supporter" },
]

export interface NetworkLogFormData {
  person_name: string
  contact_type: NetworkContactType | ""
  notes: string
}

interface NetworkLogFormProps {
  data: NetworkLogFormData
  onChange: (data: NetworkLogFormData) => void
}

export function NetworkLogForm({ data, onChange }: NetworkLogFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="person_name">Person name</Label>
        <Input
          id="person_name"
          placeholder="Who did you connect with?"
          value={data.person_name}
          onChange={(e) => onChange({ ...data, person_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Contact type</Label>
        <Select
          value={data.contact_type}
          onValueChange={(val) =>
            onChange({ ...data, contact_type: val as NetworkContactType })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select contact type" />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Brief notes about the interaction..."
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
        />
      </div>
    </div>
  )
}
