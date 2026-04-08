import { useState, useEffect, useMemo } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DNFResult } from "../lib/ast";
import { getFieldDef, ACTIONS } from "../lib/fields";
import type { ConditionNode } from "../lib/ast";
import { initWasm, type WasmAPI } from "../lib/wasm";
import { SecLangCode, type CodeError } from "./SecLangCode";
import type { RuleSettings } from "./AdvancedSettings";

interface Props {
  dnf: DNFResult;
  action: string;
  settings: RuleSettings;
}

function actionToSecLang(action: string): string {
  const eqIdx = action.indexOf("=");
  if (eqIdx !== -1) {
    // Parameterized action like "ctl:ruleEngine=Off"
    return action;
  }
  const actionDef = ACTIONS.find((a) => a.key === action);
  if (!actionDef) return "deny";
  return actionDef.key;
}

const INDENT = "    ";

function andGroupToSecLang(
  group: ConditionNode[],
  baseId: number,
  actionKey: string,
  settings: RuleSettings,
): string {
  if (group.length === 0) return "";

  const actionStr = actionToSecLang(actionKey);

  return group
    .map((c, i) => {
      const fieldDef = getFieldDef(c.field);
      const variable = c.name ? `${c.field}:${c.name}` : c.field;
      const phase = fieldDef?.phase ?? 1;
      const isFirst = i === 0;
      const isLast = i === group.length - 1;

      // Chained rules get additional indentation
      const prefix = isFirst ? "" : INDENT;

      const operatorValue = c.value
        ? `"${c.operator} ${c.value}"`
        : `"${c.operator}"`;

      const actionParts: string[] = [];
      if (isFirst) {
        actionParts.push(`id:${baseId}`, `phase:${phase}`, actionStr);
        if (settings.severity)
          actionParts.push(`severity:'${settings.severity}'`);
        if (settings.message) actionParts.push(`msg:'${settings.message}'`);
        for (const tag of settings.tags) actionParts.push(`tag:'${tag}'`);
        if (!isLast) actionParts.push("chain");
      } else {
        if (!isLast) actionParts.push("chain");
      }

      if (actionParts.length === 0) {
        return `${prefix}SecRule ${variable} ${operatorValue}`;
      }
      const quoteIndent = prefix + INDENT;
      const actionsStr = actionParts.join(",\\\n" + quoteIndent);
      return `${prefix}SecRule ${variable} ${operatorValue} \\\n${quoteIndent}"${actionsStr}"`;
    })
    .join("\n");
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

export function SecLangOutput({ dnf, action, settings }: Props) {
  const ruleId = settings.startId;
  const [wasm, setWasm] = useState<WasmAPI | null>(null);
  const [wasmError, setWasmError] = useState(false);
  const [validations, setValidations] = useState<
    Record<number, ValidationResult>
  >({});

  useEffect(() => {
    initWasm()
      .then(setWasm)
      .catch(() => setWasmError(true));
  }, []);

  const rules = dnf.map((group, i) =>
    andGroupToSecLang(group, ruleId + i, action, settings),
  );

  const fullOutput = rules.join("\n\n");

  useEffect(() => {
    if (!wasm || rules.length === 0) {
      setValidations({});
      return;
    }
    const results: Record<number, ValidationResult> = {};
    for (let i = 0; i < rules.length; i++) {
      results[i] = wasm.validateSecLang(rules[i]!);
    }
    setValidations(results);
  }, [wasm, fullOutput]);

  // Compute character offsets for each rule in the combined output
  const ruleOffsets = useMemo(() => {
    const offsets: { from: number; to: number }[] = [];
    let pos = 0;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]!;
      offsets.push({ from: pos, to: pos + rule.length });
      pos += rule.length + 2; // +2 for "\n\n" separator
    }
    return offsets;
  }, [rules]);

  // Convert validations to CodeError array
  const codeErrors = useMemo<CodeError[]>(() => {
    const errs: CodeError[] = [];
    for (const [idx, v] of Object.entries(validations)) {
      if (!v.valid && v.error) {
        errs.push({ ruleIndex: Number(idx), message: v.error });
      }
    }
    return errs;
  }, [validations]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          SecLang Output
        </h2>
        {dnf.length > 0 && <CopyBtn value={fullOutput} />}
        {wasmError && <Badge variant="outline">WASM unavailable</Badge>}
      </div>

      {dnf.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete all conditions to generate rules.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-hidden rounded-xl">
          {/* Code editor with wavy underline errors */}
          <div>
            <SecLangCode
              code={fullOutput}
              ruleOffsets={ruleOffsets}
              errors={codeErrors}
            />
          </div>
        </div>
      )}
    </div>
  );
}
