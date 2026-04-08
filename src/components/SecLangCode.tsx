import { useRef, useEffect } from "react";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { seclangLanguage } from "../lib/seclang-lang";

export interface CodeError {
  /** Which rule index (0-based) has the error */
  ruleIndex: number;
  message: string;
}

interface Props {
  code: string;
  /** Offsets where each rule starts in the combined code string */
  ruleOffsets?: { from: number; to: number }[];
  errors?: CodeError[];
  className?: string;
}

export function SecLangCode({ code, ruleOffsets, errors, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        seclangLanguage,
        oneDark,
        lineNumbers(),
        lintGutter(),
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        EditorView.theme({
          "&": { fontSize: "14px" },
          ".cm-gutters": { border: "none" },
          ".cm-content": { padding: "8px 0" },
          "&.cm-focused": { outline: "none" },
          ".cm-diagnostic-error": { borderLeft: "3px solid #f85149" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update content when code changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== code) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: code },
      });
    }
  }, [code]);

  // Update diagnostics (wavy underlines) when errors change
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !ruleOffsets) return;

    const diagnostics: Diagnostic[] = [];

    if (errors) {
      for (const err of errors) {
        const offset = ruleOffsets[err.ruleIndex];
        if (!offset) continue;
        diagnostics.push({
          from: offset.from,
          to: offset.to,
          severity: "error",
          message: err.message,
        });
      }
    }

    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [errors, ruleOffsets, code]);

  return <div ref={containerRef} className={className} />;
}
