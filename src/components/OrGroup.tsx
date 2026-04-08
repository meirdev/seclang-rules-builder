import { Badge } from "@/components/ui/badge";
import type { AndNode, ConditionNode } from "../lib/ast";
import { ConditionRow } from "./ConditionRow";

interface Props {
  group: AndNode;
  groupIndex: number;
  onUpdate: (
    groupIndex: number,
    condIndex: number,
    patch: Partial<
      Pick<ConditionNode, "field" | "operator" | "value" | "name">
    >,
  ) => void;
  onRemove: (groupIndex: number, condIndex: number) => void;
  onAddAnd: (groupIndex: number) => void;
}

export function OrGroup({
  group,
  groupIndex,
  onUpdate,
  onRemove,
  onAddAnd,
}: Props) {
  const conditions = group.conditions as ConditionNode[];

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 sm:p-4 space-y-2.5">
      {conditions.map((cond, condIndex) => (
        <div key={cond.id}>
          {condIndex > 0 && (
            <div className="flex items-center gap-2 pb-2.5">
              <Badge
                variant="secondary"
                className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0"
              >
                and
              </Badge>
              <div className="h-px flex-1 bg-border/60" />
            </div>
          )}
          <ConditionRow
            condition={cond}
            groupIndex={groupIndex}
            condIndex={condIndex}
            isLastInGroup={condIndex === conditions.length - 1}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onAddAnd={onAddAnd}
          />
        </div>
      ))}
    </div>
  );
}
