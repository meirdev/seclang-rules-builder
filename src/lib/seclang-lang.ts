import { StreamLanguage, type StreamParser } from "@codemirror/language";

interface SecLangState {
  /** Are we currently inside a multi-line actions string? */
  inActions: boolean;
}

const seclangParser: StreamParser<SecLangState> = {
  startState(): SecLangState {
    return { inActions: false };
  },

  token(stream, state): string | null {
    if (state.inActions) {
      if (stream.eatSpace()) return null;

      // Closing quote
      if (stream.peek() === '"') {
        stream.next();
        state.inActions = false;
        return "bracket";
      }
      // Backslash continuation
      if (stream.match(/^\\$/)) return "meta";
      // Action keywords
      if (
        stream.match(
          /^(id|phase|deny|allow|drop|pass|log|block|chain|status|msg|tag|severity|logdata|rev|ver|maturity|accuracy|t|ctl|setvar|expirevar|nolog|auditlog|noauditlog)\b/,
        )
      ) {
        return "attributeName";
      }
      // Colon/comma
      if (stream.eat(":") || stream.eat(",")) return "punctuation";
      // Single-quoted strings
      if (stream.eat("'")) {
        stream.match(/^[^']*/);
        stream.eat("'");
        return "string.special";
      }
      // Numbers
      if (stream.match(/^[0-9]+/)) return "number";
      // Other
      stream.next();
      return "string.special";
    }

    if (stream.eatSpace()) return null;

    // Comments
    if (stream.match(/^#.*/)) return "comment";

    // Directive keyword: SecRule, SecAction, etc.
    if (stream.match(/^Sec\w+/)) return "keyword";

    // Variable: REMOTE_ADDR, REQUEST_HEADERS:content-type, etc.
    if (stream.match(/^[A-Z_][A-Z0-9_]*(:[^\s"]+)?/)) {
      return "variableName.special";
    }

    // Pipe (variable separator)
    if (stream.eat("|")) return "operator";

    // Quoted string (operator+value or actions)
    if (stream.eat('"')) {
      // Peek ahead: is this an actions string? (starts with id: or action keyword)
      // Or is it an operator string? (starts with @ or !)
      const rest = stream.string.slice(stream.pos);
      const isOperator = /^[!@]/.test(rest);

      if (isOperator) {
        // Operator+value string — consume until closing quote
        while (!stream.eol()) {
          if (stream.peek() === '"') {
            stream.next();
            return "string";
          }
          stream.next();
        }
        return "string";
      } else {
        // Actions string — enter actions mode
        state.inActions = true;
        return "bracket";
      }
    }

    // Backslash continuation
    if (stream.match(/^\\$/)) return "meta";

    stream.next();
    return null;
  },
};

export const seclangLanguage = StreamLanguage.define(seclangParser);
