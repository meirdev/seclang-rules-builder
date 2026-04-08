import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxCollection,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { ConditionNode } from "../lib/ast";
import {
  OPERATORS,
  COUNTRY_CODES,
  type FieldDef,
  type CountryDef,
  getFieldDef,
  getOperatorDef,
  getOperatorsForField,
  getFieldGroups,
} from "../lib/fields";

interface Props {
  condition: ConditionNode;
  groupIndex: number;
  condIndex: number;
  isLastInGroup: boolean;
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

const FIELD_GROUPS = getFieldGroups();
const FIELD_COMBOBOX_ITEMS = FIELD_GROUPS.map((g) => ({
  value: g.label,
  items: g.fields,
}));
const COUNTRY_MAP = new Map(COUNTRY_CODES.map((c) => [c.code, c]));
const MULTI_OPS = new Set(["@within", "@pm", "@ipMatch"]);

export function ConditionRow({
  condition,
  groupIndex,
  condIndex,
  isLastInGroup,
  onUpdate,
  onRemove,
  onAddAnd,
}: Props) {
  const fieldDef = getFieldDef(condition.field);
  const operatorDef = getOperatorDef(condition.operator);
  const availableOperators = condition.field
    ? getOperatorsForField(condition.field)
    : OPERATORS;

  const isEnum = fieldDef?.fieldType === "enum" && fieldDef.enumValues;
  const isCountry = condition.field === "GEO:COUNTRY_CODE";
  const isEnumSingle =
    isEnum &&
    (condition.operator === "@streq" || condition.operator === "!@streq");
  const isEnumMulti =
    isEnum &&
    (condition.operator === "@within" || condition.operator === "!@within");

  const selectedCountry = isCountry
    ? (COUNTRY_MAP.get(condition.value) ?? null)
    : null;

  const selectedMultiCountries =
    isEnumMulti && isCountry
      ? condition.value
          .split(" ")
          .filter(Boolean)
          .map((code) => COUNTRY_MAP.get(code))
          .filter((c): c is CountryDef => !!c)
      : [];

  const selectedMultiStrings =
    isEnumMulti && !isCountry ? condition.value.split(" ").filter(Boolean) : [];

  const multiCountryAnchor = useComboboxAnchor();
  const multiEnumAnchor = useComboboxAnchor();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {/* Field combobox (grouped by phase) */}
      <Combobox
        items={FIELD_COMBOBOX_ITEMS}
        value={fieldDef ?? null}
        onValueChange={(val) => {
          const f = val as FieldDef | null;
          if (!f) return;
          const newFieldDef = getFieldDef(f.key);
          const patch: Partial<ConditionNode> = {
            field: f.key,
            operator: "",
            value: "",
          };
          if (!newFieldDef?.hasName) patch.name = undefined;
          onUpdate(groupIndex, condIndex, patch);
        }}
        itemToStringLabel={(f) => f.label}
        isItemEqualToValue={(a, b) => a.key === b.key}
      >
        <ComboboxInput
          placeholder="Search fields..."
          className="w-full sm:w-45"
        />
        <ComboboxContent>
          <ComboboxEmpty>No fields found.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(group: { value: string; items: FieldDef[] }) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(field: FieldDef) => (
                      <ComboboxItem key={field.key} value={field}>
                        {field.label}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {/* Name input (only for fields with hasName) */}
      {fieldDef?.hasName && (
        <Input
          className="w-full sm:w-35"
          value={condition.name ?? ""}
          onChange={(e) =>
            onUpdate(groupIndex, condIndex, { name: e.target.value })
          }
          placeholder={fieldDef.namePlaceholder ?? "Name"}
        />
      )}

      {/* Operator select */}
      <Select
        value={condition.operator ?? null}
        onValueChange={(v: string | null) => {
          if (!v) return;
          const patch: Partial<ConditionNode> = { operator: v };
          const oldBase = condition.operator.replace(/^!/, "");
          const newBase = v.replace(/^!/, "");
          const oldOp = getOperatorDef(condition.operator);
          const newOp = getOperatorDef(v);
          const oldIsMulti = MULTI_OPS.has(oldBase);
          const newIsMulti = MULTI_OPS.has(newBase);
          if (newOp?.noValue || oldOp?.noValue || oldIsMulti !== newIsMulti) {
            patch.value = "";
          }
          onUpdate(groupIndex, condIndex, patch);
        }}
      >
        <SelectTrigger className="w-full sm:w-45">
          <SelectValue placeholder="Select operator...">
            {operatorDef?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableOperators.map((op) => (
              <SelectItem key={op.key} value={op.key}>
                {op.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Value: country single select */}
      {!operatorDef?.noValue && isEnumSingle && isCountry && (
        <Combobox
          items={COUNTRY_CODES}
          value={selectedCountry}
          onValueChange={(val) => {
            const c = val as CountryDef | null;
            onUpdate(groupIndex, condIndex, { value: c?.code ?? "" });
          }}
          itemToStringLabel={(c) => `${c.flag} ${c.name}`}
          isItemEqualToValue={(a, b) => a.code === b.code}
        >
          <ComboboxInput
            placeholder="Search country..."
            className="w-full sm:min-w-40 sm:flex-1"
          />
          <ComboboxContent>
            <ComboboxEmpty>No country found.</ComboboxEmpty>
            <ComboboxList>
              {(c: CountryDef) => (
                <ComboboxItem key={c.code} value={c}>
                  {c.flag} {c.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}

      {/* Value: enum single select (non-country) */}
      {!operatorDef?.noValue &&
        isEnumSingle &&
        !isCountry &&
        fieldDef?.enumValues && (
          <Select
            value={condition.value ?? null}
            onValueChange={(v: string | null) => {
              if (!v) return;
              onUpdate(groupIndex, condIndex, { value: v });
            }}
          >
            <SelectTrigger className="w-full sm:min-w-40 sm:flex-1">
              <SelectValue
                placeholder={fieldDef.placeholder ?? "Select value..."}
              >
                {condition.value || undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {fieldDef.enumValues.map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

      {/* Value: country multi select */}
      {!operatorDef?.noValue &&
        isEnumMulti &&
        isCountry &&
        fieldDef?.enumValues && (
          <Combobox
            multiple
            items={COUNTRY_CODES}
            value={selectedMultiCountries}
            onValueChange={(val) => {
              const countries = val as CountryDef[];
              onUpdate(groupIndex, condIndex, {
                value: countries.map((c) => c.code).join(" "),
              });
            }}
            itemToStringLabel={(c) => `${c.flag} ${c.name}`}
            isItemEqualToValue={(a, b) => a.code === b.code}
          >
            <ComboboxChips
              ref={multiCountryAnchor}
              className="w-full sm:min-w-40 sm:flex-1"
            >
              {selectedMultiCountries.map((c) => (
                <ComboboxChip key={c.code}>
                  {c.flag} {c.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Search country..." />
            </ComboboxChips>
            <ComboboxContent anchor={multiCountryAnchor}>
              <ComboboxEmpty>No country found.</ComboboxEmpty>
              <ComboboxList>
                {(c: CountryDef) => (
                  <ComboboxItem key={c.code} value={c}>
                    {c.flag} {c.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}

      {/* Value: enum multi select (non-country) */}
      {!operatorDef?.noValue &&
        isEnumMulti &&
        !isCountry &&
        fieldDef?.enumValues && (
          <Combobox
            multiple
            items={fieldDef.enumValues}
            value={selectedMultiStrings}
            onValueChange={(val) => {
              const values = val as string[];
              onUpdate(groupIndex, condIndex, {
                value: values.join(" "),
              });
            }}
          >
            <ComboboxChips
              ref={multiEnumAnchor}
              className="w-full sm:min-w-40 sm:flex-1"
            >
              {selectedMultiStrings.map((val) => (
                <ComboboxChip key={val}>{val}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Search..." />
            </ComboboxChips>
            <ComboboxContent anchor={multiEnumAnchor}>
              <ComboboxEmpty>No options found.</ComboboxEmpty>
              <ComboboxList>
                {(val: string) => (
                  <ComboboxItem key={val} value={val}>
                    {val}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}

      {/* Value: free text input */}
      {!operatorDef?.noValue && !isEnumSingle && !isEnumMulti && (
        <Input
          className="w-full sm:min-w-40 sm:flex-1"
          value={condition.value}
          onChange={(e) =>
            onUpdate(groupIndex, condIndex, { value: e.target.value })
          }
          placeholder={fieldDef?.placeholder ?? "Value"}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-1 self-end sm:self-auto">
        {isLastInGroup && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => onAddAnd(groupIndex)}
          >
            <Plus className="h-3 w-3 mr-1" />
            And
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(groupIndex, condIndex)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
