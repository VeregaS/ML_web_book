import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

const SandboxEditor = ({ code, onChange, onReset }) => (
  <div className="rounded-lg overflow-hidden border border-slate-700 shadow-inner">
    <div className="bg-slate-800 text-slate-400 text-xs px-4 py-1.5 font-mono border-b border-slate-700 flex justify-between items-center">
      <span>main.py</span>
      <button 
        onClick={onReset}
        className="text-slate-400 hover:text-white transition-colors"
        title="Сбросить код к начальному состоянию"
      >
        ⟲ Сбросить
      </button>
    </div>
    <CodeMirror
      value={code}
      height="300px"
      theme="dark"
      extensions={[python()]}
      onChange={onChange}
      className="text-sm sm:text-base font-mono"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        rectangularSelection: true,
        crosshairCursor: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        closeBracketsKeymap: true,
        defaultKeymap: true,
        searchKeymap: true,
        historyKeymap: true,
        foldKeymap: true,
        completionKeymap: true,
        lintKeymap: true,
      }}
    />
  </div>
);

export default SandboxEditor;
