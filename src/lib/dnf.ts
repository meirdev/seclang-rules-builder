import { uid } from "./ast";
import type { ASTNode, ConditionNode, DNFResult } from "./ast";

function negateOperator(op: string): string {
  if (op.startsWith("!")) return op.slice(1);
  return `!${op}`;
}

function pushNotDown(node: ASTNode): ASTNode {
  switch (node.type) {
    case "condition":
      return node;

    case "and":
    case "or":
      return { ...node, conditions: node.conditions.map(pushNotDown) };

    case "not": {
      const inner = node.operand;

      switch (inner.type) {
        case "condition":
          return { ...inner, operator: negateOperator(inner.operator) };

        case "not":
          return pushNotDown(inner.operand);

        case "and":
          return pushNotDown({
            type: "or",
            conditions: inner.conditions.map((c) => ({
              type: "not" as const,
              operand: c,
            })),
          });

        case "or":
          return pushNotDown({
            type: "and",
            id: uid(),
            conditions: inner.conditions.map((c) => ({
              type: "not" as const,
              operand: c,
            })),
          });

        default:
          throw new Error(
            `Unknown node type inside NOT: "${(inner as ASTNode).type}"`,
          );
      }
    }

    default:
      throw new Error(`Unknown node type: "${(node as ASTNode).type}"`);
  }
}

function distribute(node: ASTNode): DNFResult {
  switch (node.type) {
    case "condition":
      return [[node]];

    case "or":
      return node.conditions.flatMap(distribute);

    case "and": {
      const dnfSets = node.conditions.map(distribute);
      return dnfSets.reduce(
        (product, currentSet) =>
          product.flatMap((existingGroup) =>
            currentSet.map((newGroup) => [...existingGroup, ...newGroup]),
          ),
        [[]] as DNFResult,
      );
    }

    default:
      throw new Error(
        `Unexpected node type after NOT push: "${(node as ASTNode).type}"`,
      );
  }
}

/**
 * Convert any boolean AST to Disjunctive Normal Form.
 * Each inner array is an AND-group (one SecLang rule/chain).
 * The outer array combines them with OR (independent rules).
 */
export function toDNF(ast: ASTNode): DNFResult {
  const normalized = pushNotDown(ast);
  return distribute(normalized);
}

export function conditionToString(c: ConditionNode): string {
  const name = c.name ? `:${c.name}` : "";
  return `${c.field}${name} ${c.operator} "${c.value}"`;
}

export function dnfToString(dnfGroups: DNFResult): string {
  return dnfGroups
    .map((group) => {
      const inner = group.map(conditionToString).join(" AND ");
      return group.length > 1 ? `(${inner})` : inner;
    })
    .join("\n  OR\n");
}

/** Render an AST node to a human-readable expression string */
export function astToExpression(node: ASTNode): string {
  switch (node.type) {
    case "condition": {
      if (!node.field || !node.operator) return "";
      const name = node.name ? `:${node.name}` : "";
      return `${node.field}${name} ${node.operator} "${node.value}"`;
    }

    case "and": {
      const parts = node.conditions
        .map(astToExpression)
        .filter((s) => s.length > 0);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0];
      return `(${parts.join(" and ")})`;
    }

    case "or": {
      const parts = node.conditions
        .map(astToExpression)
        .filter((s) => s.length > 0);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0];
      return parts.join(" or ");
    }

    case "not": {
      const inner = astToExpression(node.operand);
      return inner ? `not(${inner})` : "";
    }

    default:
      return "";
  }
}
