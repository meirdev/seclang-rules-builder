import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ACTIONS } from "../lib/fields";

interface Props {
  action: string;
  onChange: (action: string) => void;
}

function parseAction(action: string): { key: string; param: string } {
  const eqIdx = action.indexOf("=");
  if (eqIdx === -1) return { key: action, param: "" };
  return { key: action.slice(0, eqIdx), param: action.slice(eqIdx + 1) };
}

export function ActionSelect({ action, onChange }: Props) {
  const { key, param } = parseAction(action);
  const actionDef = ACTIONS.find((a) => a.key === key);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">
        Then take action...
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={key}
          onValueChange={(v: string | null) => {
            if (!v) return;
            const def = ACTIONS.find((a) => a.key === v);
            if (def?.options) {
              onChange(`${v}=${def.options[0]}`);
            } else if (def?.needsInput) {
              onChange(`${v}=`);
            } else {
              onChange(v);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue placeholder="Select action...">
              {actionDef?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ACTIONS.map((a) => (
                <SelectItem key={a.key} value={a.key}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {actionDef?.options && (
          <Select
            value={param || actionDef.options[0]}
            onValueChange={(v: string | null) => {
              if (!v) return;
              onChange(`${key}=${v}`);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue>{param || actionDef.options[0]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {actionDef.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        {actionDef?.needsInput && (
          <Input
            className="w-full sm:w-40"
            value={param}
            onChange={(e) => onChange(`${key}=${e.target.value}`)}
            placeholder={
              actionDef.needsInput === "id" ? "e.g. 920100" : "e.g. attack-sqli"
            }
          />
        )}
      </div>
    </div>
  );
}
