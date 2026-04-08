import { useState } from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectGroup,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface RuleSettings {
  startId: number;
  severity: string;
  tags: string[];
  message: string;
}

const SEVERITIES = [
  { value: "", label: "None" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "ALERT", label: "Alert" },
  { value: "CRITICAL", label: "Critical" },
  { value: "ERROR", label: "Error" },
  { value: "WARNING", label: "Warning" },
  { value: "NOTICE", label: "Notice" },
  { value: "INFO", label: "Info" },
  { value: "DEBUG", label: "Debug" },
];

interface Props {
  settings: RuleSettings;
  onChange: (settings: RuleSettings) => void;
}

export function AdvancedSettings({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !settings.tags.includes(tag)) {
      onChange({ ...settings, tags: [...settings.tags, tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onChange({ ...settings, tags: settings.tags.filter((t) => t !== tag) });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <Settings className="h-4 w-4" />
        Advanced Settings
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-4 rounded-lg border bg-muted/30 p-4">
          {/* Start ID */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Start Rule ID</label>
            <Input
              type="number"
              value={settings.startId}
              min={1}
              max={999999}
              onChange={(e) => {
                const parsed = parseInt(e.target.value);
                const clamped = Number.isNaN(parsed)
                  ? 1000
                  : Math.max(1, Math.min(999999, parsed));
                onChange({ ...settings, startId: clamped });
              }}
              placeholder="1000"
            />
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Severity</label>
            <Select
              value={settings.severity || "none"}
              onValueChange={(v: string | null) => {
                if (!v) return;
                onChange({ ...settings, severity: v === "none" ? "" : v });
              }}
            >
              <SelectTrigger className="w-full sm:w-50">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SEVERITIES.map((s) => (
                    <SelectItem
                      key={s.value || "none"}
                      value={s.value || "none"}
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. attack-sqli"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            {settings.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {settings.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
