// CodeMirror Editor Setup for Renderer Process
const { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, Decoration, ViewPlugin } = require('@codemirror/view');
const { EditorState, StateField, StateEffect, RangeSetBuilder } = require('@codemirror/state');
const { sql } = require('@codemirror/lang-sql');
const { defaultKeymap, history, historyKeymap } = require('@codemirror/commands');
const { searchKeymap, highlightSelectionMatches } = require('@codemirror/search');
const { syntaxHighlighting, HighlightStyle } = require('@codemirror/language');
const { tags } = require('@lezer/highlight');
const { autocompletion, acceptCompletion, startCompletion } = require('@codemirror/autocomplete');

// Custom theme for comments
const customHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#9ccc9c" },
  { tag: tags.keyword, color: "#0000ff", fontWeight: "bold" },
  { tag: tags.string, color: "#032f62" },
  { tag: tags.number, color: "#005cc5" }
]);

// Custom decorator for // comments (SQL mode only recognizes -- by default)
const slashCommentDecoration = Decoration.mark({ class: "cm-comment" });

const slashCommentPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.buildDecorations(view);
  }
  
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }
  
  buildDecorations(view) {
    const builder = new RangeSetBuilder();
    const doc = view.state.doc;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const lineText = line.text;
      const slashIndex = lineText.indexOf('//');
      
      if (slashIndex !== -1) {
        const from = line.from + slashIndex;
        const to = line.to;
        builder.add(from, to, slashCommentDecoration);
      }
    }
    
    return builder.finish();
  }
}, {
  decorations: v => v.decorations
});

window.createCodeMirrorEditor = function(parent) {
  // SOQL autocomplete function
  const soqlAutocompletion = async (context) => {
    const text = context.state.doc.toString();
    const cursorPos = context.pos;
    
    // Get autocomplete context using existing logic
    const acContext = window.getAutocompleteContext ? window.getAutocompleteContext(text, cursorPos) : null;
    
    if (!acContext) return null;
    
    let suggestions = [];
    
    try {
      if (acContext.type === 'object') {
        const sobjects = await window.fetchSObjects();
        suggestions = sobjects.map(obj => {
          const objName = typeof obj === 'string' ? obj : obj.name;
          const objLabel = typeof obj === 'object' ? obj.label : '';
          return {
            label: objName,
            type: "class",
            detail: objLabel
          };
        });
      } else if (acContext.type === 'field') {
        const fields = await window.fetchObjectFields(acContext.objectName);
        suggestions = fields.map(field => {
          let detail = field.label || field.type;
          if (field.isRelationship && field.referenceTo && field.referenceTo.length > 0) {
            detail = `${field.label || field.relationshipName} → ${field.referenceTo.join(', ')}`;
          }
          return {
            label: field.isRelationship ? field.relationshipName : field.name,
            type: field.isRelationship ? "namespace" : "property",
            detail: detail,
            info: field.type
          };
        });
      } else if (acContext.type === 'relationship-field') {
        const baseFields = await window.fetchObjectFields(acContext.baseObjectName);
        const relationshipField = baseFields.find(f => 
          f.relationshipName && f.relationshipName.toLowerCase() === acContext.relationshipName.toLowerCase()
        );
        
        if (relationshipField && relationshipField.referenceTo && relationshipField.referenceTo.length > 0) {
          const relatedObjectName = relationshipField.referenceTo[0];
          const relatedFields = await window.fetchObjectFields(relatedObjectName);
          suggestions = relatedFields.map(field => {
            let detail = field.label || field.type;
            if (field.isRelationship && field.referenceTo && field.referenceTo.length > 0) {
              detail = `${field.label || field.relationshipName} → ${field.referenceTo.join(', ')}`;
            }
            return {
              label: field.isRelationship ? field.relationshipName : field.name,
              type: field.isRelationship ? "namespace" : "property",
              detail: detail,
              info: field.type
            };
          });
        }
      } else if (acContext.type === 'multi-relationship-field') {
        // Handle multi-level relationships like Profile.CreatedBy.Name
        let currentObjectName = acContext.baseObjectName;
        
        // Traverse the relationship path to find the final object
        for (const relName of acContext.relationshipPath) {
          const fields = await window.fetchObjectFields(currentObjectName);
          const relField = fields.find(f => 
            f.relationshipName && f.relationshipName.toLowerCase() === relName.toLowerCase()
          );
          
          if (!relField || !relField.referenceTo || relField.referenceTo.length === 0) {
            return null; // Can't traverse further
          }
          
          currentObjectName = relField.referenceTo[0];
        }
        
        // Now fetch fields from the final object
        const finalFields = await window.fetchObjectFields(currentObjectName);
        suggestions = finalFields.map(field => {
          let detail = field.label || field.type;
          if (field.isRelationship && field.referenceTo && field.referenceTo.length > 0) {
            detail = `${field.label || field.relationshipName} → ${field.referenceTo.join(', ')}`;
          }
          return {
            label: field.isRelationship ? field.relationshipName : field.name,
            type: field.isRelationship ? "namespace" : "property",
            detail: detail,
            info: field.type
          };
        });
      }
      
      if (suggestions.length === 0) return null;
      
      // Filter by prefix
      const prefix = acContext.prefix.toLowerCase();
      const filtered = suggestions.filter(s => s.label.toLowerCase().startsWith(prefix));
      
      if (filtered.length === 0) return null;
      
      // Calculate the position to replace (from start of prefix to cursor)
      const from = cursorPos - acContext.prefix.length;
      
      return {
        from: from,
        options: filtered
      };
    } catch (error) {
      console.error('Autocomplete error:', error);
      return null;
    }
  };
  
  const state = EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection({ drawRangeCursor: true }),
      EditorView.contentAttributes.of({ spellcheck: "false" }),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      EditorState.languageData.of(() => [{ autocomplete: soqlAutocompletion }]),
      rectangularSelection(),
      crosshairCursor(),
      //highlightActiveLine(),
      //highlightSelectionMatches(),
      sql(),
      slashCommentPlugin,
      autocompletion({ 
        override: [soqlAutocompletion],
        activateOnTyping: true,
        closeOnBlur: true,
        maxRenderedOptions: 500
      }),
      syntaxHighlighting(customHighlightStyle),
      keymap.of([
        // Custom key handlers for autocomplete
        {
          key: "Tab",
          run: (view) => {
            // Accept autocomplete if open
            if (acceptCompletion(view)) {
              return true;
            }
            return false;
          }
        },
        {
          key: "Enter",
          run: (view) => {
            // If autocomplete is open, accept selection
            if (acceptCompletion(view)) {
              return true;
            }
            // Otherwise just insert newline without indentation
            view.dispatch(view.state.replaceSelection("\n"));
            return true;
          }
        },
        {
          key: ".",
          run: (view) => {
            if (acceptCompletion(view)) {
              view.dispatch(view.state.replaceSelection("."));
              startCompletion(view);
              return true;
            }
            return false;
          }
        },
        {
          key: ",",
          run: (view) => {
            if (acceptCompletion(view)) {
              view.dispatch(view.state.replaceSelection(", "));
              return true;
            }
            return false;
          }
        },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap
      ]),
      EditorView.baseTheme({
        "&.cm-editor.cm-focused": {
          outline: "none"
        },
        ".cm-scroller": {
          overflow: "auto"
        },
        ".cm-selectionBackground": {
          backgroundColor: "#b3d7ff !important"
        },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "#ffeb3b !important"
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "14px",
          backgroundColor: "#fff"
        },
        ".cm-content": {
          fontFamily: "monospace",
          padding: "8px 0",
          caretColor: "#000"
        },
        ".cm-comment": {
          color: "#9ccc9c"
        },
        ".cm-tooltip-autocomplete": {
          maxHeight: "400px"
        },
        ".cm-completionIcon": {
          display: "none"
        },
        ".cm-panel.cm-search": {
          background: "#fff",
          border: "2px solid #0066cc",
          borderRadius: "4px",
          padding: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        },
        ".cm-search input, .cm-search button, .cm-search label": {
          fontSize: "12px"
        },
        ".cm-search input": {
          border: "1px solid #ccc",
          padding: "4px",
          marginRight: "4px"
        },
        ".cm-search button": {
          background: "#0066cc",
          color: "white",
          border: "none",
          padding: "4px 8px",
          cursor: "pointer",
          borderRadius: "3px"
        },
        ".cm-search button:hover": {
          background: "#0052a3"
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
        ".cm-selectionMatch": {
          backgroundColor: "#99ff99"
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
};
