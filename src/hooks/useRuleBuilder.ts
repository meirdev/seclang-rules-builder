import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { OrNode, AndNode, ConditionNode, DNFResult } from "../lib/ast";
import { emptyCondition, emptyAndGroup, initialAST } from "../lib/ast";
import { toDNF } from "../lib/dnf";
import { getOperatorDef } from "../lib/fields";
import type { RuleSettings } from "../components/AdvancedSettings";

interface RuleBuilderState {
  ast: OrNode;
  action: string;
  settings: RuleSettings;

  setAction: (action: string) => void;
  setSettings: (settings: RuleSettings) => void;
  addCondition: (groupIndex: number) => void;
  updateCondition: (
    groupIndex: number,
    condIndex: number,
    patch: Partial<
      Pick<ConditionNode, "field" | "operator" | "value" | "name">
    >,
  ) => void;
  removeCondition: (groupIndex: number, condIndex: number) => void;
  addOrGroup: () => void;
  removeGroup: (groupIndex: number) => void;
}

export const useRuleBuilder = create<RuleBuilderState>()(
  immer((set) => ({
    ast: initialAST(),
    action: "deny",
    settings: {
      startId: 1000,
      severity: "",
      tags: [],
      message: "",
    },

    setAction: (action) => set({ action }),
    setSettings: (settings) => set({ settings }),

    addCondition: (groupIndex) =>
      set((s) => {
        (s.ast.conditions[groupIndex] as AndNode).conditions.push(
          emptyCondition(),
        );
      }),

    updateCondition: (groupIndex, condIndex, patch) =>
      set((s) => {
        const cond = (s.ast.conditions[groupIndex] as AndNode).conditions[
          condIndex
        ] as ConditionNode;
        Object.assign(cond, patch);
      }),

    removeCondition: (groupIndex, condIndex) =>
      set((s) => {
        const group = s.ast.conditions[groupIndex] as AndNode;
        group.conditions.splice(condIndex, 1);
        if (group.conditions.length === 0) {
          s.ast.conditions.splice(groupIndex, 1);
        }
        if (s.ast.conditions.length === 0) {
          s.ast.conditions.push(emptyAndGroup());
        }
      }),

    addOrGroup: () =>
      set((s) => {
        s.ast.conditions.push(emptyAndGroup());
      }),

    removeGroup: (groupIndex) =>
      set((s) => {
        s.ast.conditions.splice(groupIndex, 1);
        if (s.ast.conditions.length === 0) {
          s.ast.conditions.push(emptyAndGroup());
        }
      }),
  })),
);

export function computeDnf(ast: OrNode): DNFResult {
  const groups = ast.conditions as AndNode[];
  const hasIncomplete = groups.some((g) =>
    (g.conditions as ConditionNode[]).some((c) => {
      if (!c.field || !c.operator) return true;
      const op = getOperatorDef(c.operator);
      if (!op?.noValue && !c.value) return true;
      return false;
    }),
  );
  if (hasIncomplete) return [];
  return toDNF(ast);
}
