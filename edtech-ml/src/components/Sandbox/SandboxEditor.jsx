import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';

const mlSnippets = [
  snippetCompletion("import pandas as pd\nimport numpy as np", { label: "import ML", info: "Базовые импорты" }),
  snippetCompletion("model.fit(${X_train}, ${y_train})", { label: "fit", info: "Обучение модели" }),
  snippetCompletion("model.predict(${X_test})", { label: "predict", info: "Предсказание" }),
  snippetCompletion("from sklearn.linear_model import LinearRegression", { label: "import LinearRegression" }),
  snippetCompletion("from sklearn.metrics import mean_squared_error", { label: "import MSE" }),
  snippetCompletion("import matplotlib.pyplot as plt", { label: "import plt" })
];

function customCompletions(context) {
  let word = context.matchBefore(/\w*/);
  if (word.from === word.to && !context.explicit) return null;
  return {
    from: word.from,
    options: mlSnippets
  };
}

/**
 * Базовый компонент редактора кода с автодополнением ML-сниппетов.
 */
const SandboxEditor = ({ code, onChange }) => (
  <div className="h-full w-full bg-[#282c34]">
    <CodeMirror
      value={code}
      height="100%"
      theme="dark"
      extensions={[
        python(),
        autocompletion({ override: [customCompletions] })
      ]}
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
