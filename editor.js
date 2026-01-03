// CodeMirror Editor Setup
const { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } = require('@codemirror/view');
const { EditorState, Compartment } = require('@codemirror/state');
const { sql } = require('@codemirror/lang-sql');
const { defaultKeymap, history, historyKeymap } = require('@codemirror/commands');
const { searchKeymap, highlightSelectionMatches } = require('@codemirror/search');
const { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } = require('@codemirror/language');
const { tags } = require('@lezer/highlight');

// Custom theme for comments
const customHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#9ccc9c" },
  { tag: tags.keyword, color: "#d73a49", fontWeight: "bold" },
  { tag: tags.string, color: "#032f62" },
  { tag: tags.number, color: "#005cc5" }
]);

function createEditor(parent) {
  const state = EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      sql(),
      syntaxHighlighting(customHighlightStyle),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap
      ]),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "14px",
          backgroundColor: "#fff"
        },
        ".cm-content": {
          fontFamily: "monospace",
          padding: "8px 0"
        },
        ".cm-gutters": {
          backgroundColor: "#f5f5f5",
          color: "#999",
          border: "none"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "#e8f2ff"
        },
        ".cm-activeLine": {
          backgroundColor: "#f0f8ff"
        },
        ".cm-selectionBackground": {
          backgroundColor: "#ffd700 !important"
        },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "#ffd700 !important"
        },
        ".cm-cursor": {
          borderLeftColor: "#000"
        }
      })
    ]
  });

  return new EditorView({
    state,
    parent
  });
}

module.exports = { createEditor };
