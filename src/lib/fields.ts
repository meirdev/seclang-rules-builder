import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export const Phase = {
  REQUEST_HEADERS: 1,
  REQUEST_BODY: 2,
  RESPONSE_HEADERS: 3,
  RESPONSE_BODY: 4,
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

export const PHASE_LABELS: Record<Phase, string> = {
  [Phase.REQUEST_HEADERS]: "Request Headers",
  [Phase.REQUEST_BODY]: "Request Body",
  [Phase.RESPONSE_HEADERS]: "Response Headers",
  [Phase.RESPONSE_BODY]: "Response Body",
};

export type FieldType = "ip" | "numeric" | "string" | "enum";

export interface FieldDef {
  key: string; // SecLang variable name, e.g. "REMOTE_ADDR"
  label: string;
  phase: Phase;
  fieldType: FieldType;
  hasName: boolean; // supports ":name" selector (e.g. REQUEST_HEADERS:content-type)
  group?: string; // UI group override (e.g. "Geo") — defaults to phase label
  placeholder?: string;
  namePlaceholder?: string;
  enumValues?: string[]; // predefined values for enum-typed fields
}

export interface OperatorDef {
  key: string; // SecLang operator, e.g. "@streq", "!@rx"
  label: string;
  noValue?: boolean; // operator doesn't accept a value (e.g. @detectSQLi)
  separator?: string; // for multi-value operators: "," for @ipMatch, " " for @pm
}

export interface CountryDef {
  code: string;
  name: string;
  flag: string;
}

/** Convert a 2-letter country code to its flag emoji */
export function toFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export const COUNTRY_CODES: CountryDef[] = Object.entries(
  countries.getNames("en", { select: "official" }),
)
  .map(([code, name]) => ({ code, name, flag: toFlag(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const FIELDS: FieldDef[] = [
  {
    key: "REMOTE_ADDR",
    label: "Source IP",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "ip",
    hasName: false,
    placeholder: "e.g. 1.1.1.1",
  },
  {
    key: "REMOTE_HOST",
    label: "Source Hostname",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. client.example.com",
  },
  {
    key: "REMOTE_PORT",
    label: "Source Port",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 443",
  },
  {
    key: "REMOTE_USER",
    label: "Authenticated User",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "SERVER_ADDR",
    label: "Server IP",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "ip",
    hasName: false,
    placeholder: "e.g. 10.0.0.1",
  },
  {
    key: "SERVER_NAME",
    label: "Server Hostname",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. www.example.com",
  },
  {
    key: "SERVER_PORT",
    label: "Server Port",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 8080",
  },
  {
    key: "GEO:COUNTRY_CONTINENT",
    label: "Continent",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "enum",
    group: "Geo",
    hasName: false,
    placeholder: "e.g. EU",
    enumValues: ["AF", "AN", "AS", "EU", "NA", "OC", "SA"],
  },
  {
    key: "GEO:COUNTRY_CODE",
    label: "Country",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "enum",
    group: "Geo",
    hasName: false,
    placeholder: "e.g. GB",
    enumValues: COUNTRY_CODES.map((c) => c.code),
  },
  {
    key: "GEO:CITY",
    label: "City",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    group: "Geo",
    hasName: false,
  },
  {
    key: "GEO:POSTAL_CODE",
    label: "Postal Code",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    group: "Geo",
    hasName: false,
  },
  {
    key: "GEO:REGION",
    label: "Region",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    group: "Geo",
    hasName: false,
  },
  {
    key: "GEO:METRO_CODE",
    label: "Metro Code",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "numeric",
    group: "Geo",
    hasName: false,
  },
  {
    key: "GEO:LATITUDE",
    label: "Latitude",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "numeric",
    group: "Geo",
    hasName: false,
  },
  {
    key: "GEO:LONGITUDE",
    label: "Longitude",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "numeric",
    group: "Geo",
    hasName: false,
  },
  {
    key: "REQUEST_METHOD",
    label: "Method",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "enum",
    hasName: false,
    placeholder: "e.g. POST",
    enumValues: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
      "CONNECT",
      "TRACE",
    ],
  },
  {
    key: "REQUEST_PROTOCOL",
    label: "Protocol",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "enum",
    hasName: false,
    placeholder: "e.g. HTTP/1.1",
    enumValues: ["HTTP/0.9", "HTTP/1.0", "HTTP/1.1", "HTTP/2.0", "HTTP/3.0"],
  },
  {
    key: "REQUEST_URI",
    label: "URI (full)",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. /admin?foo=bar",
  },
  {
    key: "REQUEST_URI_RAW",
    label: "URI (raw)",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "REQUEST_FILENAME",
    label: "URI Path",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. /admin",
  },
  {
    key: "REQUEST_BASENAME",
    label: "URI Basename",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. index.php",
  },
  {
    key: "REQUEST_LINE",
    label: "Request Line",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. GET /index.html HTTP/1.1",
  },
  {
    key: "QUERY_STRING",
    label: "Query String",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. foo=bar&baz=1",
  },
  {
    key: "REQUEST_HEADERS",
    label: "Request Headers",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. content-type",
  },
  {
    key: "REQUEST_HEADERS_NAMES",
    label: "Request Header Names",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "REQUEST_COOKIES",
    label: "Cookies",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. session_id",
    placeholder: "e.g. name=val*",
  },
  {
    key: "REQUEST_COOKIES_NAMES",
    label: "Cookie Names",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "ARGS_GET",
    label: "Query Args",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. page",
  },
  {
    key: "ARGS_GET_NAMES",
    label: "Query Arg Names",
    phase: Phase.REQUEST_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "REQUEST_BODY",
    label: "Body (raw)",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "REQUEST_BODY_LENGTH",
    label: "Body Length",
    phase: Phase.REQUEST_BODY,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 1024",
  },
  {
    key: "ARGS",
    label: "All Args",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. username",
  },
  {
    key: "ARGS_NAMES",
    label: "All Arg Names",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "ARGS_POST",
    label: "POST Args",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. username",
  },
  {
    key: "ARGS_POST_NAMES",
    label: "POST Arg Names",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "ARGS_COMBINED_SIZE",
    label: "Args Combined Size",
    phase: Phase.REQUEST_BODY,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 4096",
  },
  {
    key: "FILES",
    label: "Upload Filenames",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "FILES_NAMES",
    label: "Upload Field Names",
    phase: Phase.REQUEST_BODY,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "FILES_SIZES",
    label: "Upload File Sizes",
    phase: Phase.REQUEST_BODY,
    fieldType: "numeric",
    hasName: false,
  },
  {
    key: "FILES_COMBINED_SIZE",
    label: "Upload Total Size",
    phase: Phase.REQUEST_BODY,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 10485760",
  },
  {
    key: "RESPONSE_STATUS",
    label: "Status Code",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 200",
  },
  {
    key: "RESPONSE_PROTOCOL",
    label: "Response Protocol",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "enum",
    hasName: false,
    enumValues: ["HTTP/0.9", "HTTP/1.0", "HTTP/1.1", "HTTP/2.0", "HTTP/3.0"],
  },
  {
    key: "RESPONSE_HEADERS",
    label: "Response Headers",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "string",
    hasName: true,
    namePlaceholder: "e.g. content-type",
  },
  {
    key: "RESPONSE_HEADERS_NAMES",
    label: "Response Header Names",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "string",
    hasName: false,
  },
  {
    key: "RESPONSE_CONTENT_TYPE",
    label: "Content Type",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "string",
    hasName: false,
    placeholder: "e.g. text/html",
  },
  {
    key: "RESPONSE_CONTENT_LENGTH",
    label: "Content Length",
    phase: Phase.RESPONSE_HEADERS,
    fieldType: "numeric",
    hasName: false,
    placeholder: "e.g. 1024",
  },
  {
    key: "RESPONSE_BODY",
    label: "Response Body",
    phase: Phase.RESPONSE_BODY,
    fieldType: "string",
    hasName: false,
  },
];

export const OPERATORS: OperatorDef[] = [
  { key: "@streq", label: "equals" },
  { key: "!@streq", label: "does not equal" },
  { key: "@contains", label: "contains" },
  { key: "!@contains", label: "does not contain" },
  { key: "@beginsWith", label: "starts with" },
  { key: "!@beginsWith", label: "does not start with" },
  { key: "@endsWith", label: "ends with" },
  { key: "!@endsWith", label: "does not end with" },
  { key: "@strmatch", label: "substring match" },
  { key: "!@strmatch", label: "no substring match" },
  { key: "@within", label: "is within" },
  { key: "!@within", label: "is not within" },

  { key: "@rx", label: "matches regex" },
  { key: "!@rx", label: "does not match regex" },
  { key: "@pm", label: "pattern match", separator: " " },
  { key: "!@pm", label: "no pattern match", separator: " " },

  { key: "@eq", label: "numeric equals" },
  { key: "!@eq", label: "numeric not equals" },
  { key: "@gt", label: "greater than" },
  { key: "@ge", label: "greater or equal" },
  { key: "@lt", label: "less than" },
  { key: "@le", label: "less or equal" },

  { key: "@ipMatch", label: "IP match", separator: "," },
  { key: "!@ipMatch", label: "IP does not match", separator: "," },

  { key: "@detectSQLi", label: "detect SQL injection", noValue: true },
  { key: "@detectXSS", label: "detect XSS", noValue: true },
];

const BASE_OPERATOR_KEYS = OPERATORS.filter((o) => !o.key.startsWith("!")).map(
  (o) => o.key,
);
type BaseOperatorKey = (typeof BASE_OPERATOR_KEYS)[number];

const OPERATORS_FOR_TYPE: Record<FieldType, BaseOperatorKey[]> = {
  ip: ["@ipMatch", "@streq", "@rx", "@within"],

  numeric: ["@eq", "@gt", "@ge", "@lt", "@le"],

  string: [
    "@streq",
    "@contains",
    "@beginsWith",
    "@endsWith",
    "@strmatch",
    "@within",
    "@rx",
    "@pm",
    "@detectSQLi",
    "@detectXSS",
  ],

  enum: ["@streq", "@within"],
};

export interface ActionDef {
  key: string; // SecLang action prefix, e.g. "deny", "ctl:ruleEngine"
  label: string;
  options?: string[]; // predefined param values (select box)
  needsInput?: "id" | "tag"; // free-text param input
}

export const ACTIONS: ActionDef[] = [
  { key: "deny", label: "Deny" },
  { key: "allow", label: "Allow" },
  { key: "log", label: "Log Only" },
  {
    key: "ctl:ruleEngine",
    label: "Change Rule Engine",
    options: ["On", "Off", "DetectionOnly"],
  },
  {
    key: "ctl:ruleRemoveById",
    label: "Skip by ID",
    needsInput: "id",
  },
  {
    key: "ctl:ruleRemoveByTag",
    label: "Skip by Tag",
    needsInput: "tag",
  },
];

const OPERATOR_MAP = new Map(OPERATORS.map((o) => [o.key, o]));
const FIELD_MAP = new Map(FIELDS.map((f) => [f.key, f]));

/** Get operator definition by key */
export function getOperatorDef(opKey: string): OperatorDef | undefined {
  return OPERATOR_MAP.get(opKey);
}

/** Get field definition by key */
export function getFieldDef(fieldKey: string): FieldDef | undefined {
  return FIELD_MAP.get(fieldKey);
}

/** Get field groups for the combobox (uses `group` override or phase label) */
export function getFieldGroups(): { label: string; fields: FieldDef[] }[] {
  const groups: { label: string; fields: FieldDef[] }[] = [];
  const seen = new Map<string, number>();
  for (const f of FIELDS) {
    const label = f.group ?? PHASE_LABELS[f.phase];
    const idx = seen.get(label);
    if (idx !== undefined) {
      groups[idx]!.fields.push(f);
    } else {
      seen.set(label, groups.length);
      groups.push({ label, fields: [f] });
    }
  }
  return groups;
}

/** Get operators valid for a given field (includes negated forms) */
export function getOperatorsForField(fieldKey: string): OperatorDef[] {
  const field = getFieldDef(fieldKey);
  if (!field) return OPERATORS;

  const allowedBases = new Set<string>(OPERATORS_FOR_TYPE[field.fieldType]);

  return OPERATORS.filter((op) => {
    const base = op.key.startsWith("!") ? op.key.slice(1) : op.key;
    return allowedBases.has(base);
  });
}
