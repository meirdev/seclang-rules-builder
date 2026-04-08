import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRuleBuilder, computeDnf } from "../hooks/useRuleBuilder";
import type { AndNode } from "../lib/ast";
import { OrGroup } from "./OrGroup";
import { SecLangOutput } from "./SecLangOutput";
import { ActionSelect } from "./ActionSelect";
import { AdvancedSettings } from "./AdvancedSettings";

export function RuleBuilder() {
  const {
    ast,
    action,
    setAction,
    settings,
    setSettings,
    addCondition,
    updateCondition,
    removeCondition,
    addOrGroup,
    removeGroup,
  } = useRuleBuilder();
  const groups = ast.conditions as AndNode[];
  const dnf = useMemo(() => computeDnf(ast), [ast]);

  return (
    <div className="space-y-6">
      {/* Rule name & Advanced Settings */}
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5 space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Rule name
          </label>
          <Input
            value={settings.message}
            onChange={(e) =>
              setSettings({ ...settings, message: e.target.value })
            }
            placeholder="Give your rule a descriptive name."
          />
        </div>
        <AdvancedSettings settings={settings} onChange={setSettings} />
      </section>

      {/* Conditions */}
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            When incoming requests match...
          </h2>
        </div>

        <div className="space-y-0">
          {groups.map((group, groupIndex) => (
            <div key={group.id}>
              {groupIndex > 0 && (
                <div className="flex items-center gap-3 py-3">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium uppercase tracking-wider"
                  >
                    or
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => removeGroup(groupIndex)}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <OrGroup
                group={group}
                groupIndex={groupIndex}
                onUpdate={updateCondition}
                onRemove={removeCondition}
                onAddAnd={addCondition}
              />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={addOrGroup}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add OR group
        </Button>
      </section>

      {/* Action */}
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <ActionSelect action={action} onChange={setAction} />
      </section>

      {/* Output */}
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <SecLangOutput dnf={dnf} action={action} settings={settings} />
      </section>
    </div>
  );
}
