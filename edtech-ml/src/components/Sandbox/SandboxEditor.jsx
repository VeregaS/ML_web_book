import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

/**
 * Базовый компонент редактора кода.
 * Теперь он не имеет встроенных рамок и заголовков,
 * делегируя управление внешним контейнерам.
 */
const SandboxEditor = ({ code, onChange }) => (
  <div className="h-full w-full bg-[#282c34]">
    <CodeMirror
      value={code}
      height="100%"
      theme="dark"
      extensions={[python()]}
      onChange={onChange}
      className="text-sm sm:text-base font-mono h-full"
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
