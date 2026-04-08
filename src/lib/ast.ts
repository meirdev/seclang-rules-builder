let _nextId = 1;
export function uid(): string {
  return `n${_nextId++}`;
}

export interface ConditionNode {
  type: "condition";
  id: string;
  field: string; // SecLang variable, e.g. "REMOTE_ADDR", "REQUEST_HEADERS"
  operator: string; // SecLang operator, e.g. "@streq", "!@rx"
  value: string;
  name?: string; // sub-field selector, e.g. header name "content-type"
}

export interface AndNode {
  type: "and";
  id: string;
  conditions: ASTNode[];
}

export interface OrNode {
  type: "or";
  conditions: ASTNode[];
}

export interface NotNode {
  type: "not";
  operand: ASTNode;
}

export type ASTNode = ConditionNode | AndNode | OrNode | NotNode;

export type DNFResult = ConditionNode[][];

export const cond = (
  field: string,
  operator: string,
  value: string,
  name?: string,
): ConditionNode => ({
  type: "condition",
  id: uid(),
  field,
  operator,
  value,
  ...(name ? { name } : {}),
});

export const and = (...conditions: ASTNode[]): AndNode => ({
  type: "and",
  id: uid(),
  conditions,
});

export const or = (...conditions: ASTNode[]): OrNode => ({
  type: "or",
  conditions,
});

export const not = (operand: ASTNode): NotNode => ({
  type: "not",
  operand,
});

/** Create an empty condition for a new row */
export function emptyCondition(): ConditionNode {
  return { type: "condition", id: uid(), field: "", operator: "", value: "" };
}

/** Create an empty AND group with one empty condition */
export function emptyAndGroup(): AndNode {
  return { type: "and", id: uid(), conditions: [emptyCondition()] };
}

/** Create the initial OR-of-ANDs state */
export function initialAST(): OrNode {
  return { type: "or", conditions: [emptyAndGroup()] };
}
