# ML Web Book — Educational Platform for Machine Learning

An interactive web platform designed for learning machine learning, combining mathematical theory, interactive visualizations, and an in-browser Python execution environment.

## 🏗️ Project Overview

- **Type:** React Web Application (SPA)
- **Frontend Stack:** React 19, Vite 8, Tailwind CSS 4, Framer Motion.
- **ML/Math Stack:** Pyodide (Python in browser), NumPy, KaTeX (LaTeX math), React-Markdown.
- **Architecture:** 
    - **Data-Driven Content:** Lessons and glossary are defined as structured data in `src/content/lessons.js` and `src/utils/glossary.js`.
    - **Interactive Components:** Custom boards for Geometry, Gradient Descent, and SVM visualizations.
    - **Execution Engine:** Web Workers (`src/workers/pyodideWorker.js`) handle Python code execution via Pyodide to keep the UI responsive.
    - **State Management:** React Context (`src/context/ProgressContext.jsx`) for XP tracking and progress.

## 🚀 Building and Running

Commands should be run within the `edtech-ml` directory.

- **Development:** `npm run dev` (Starts Vite server on `http://127.0.0.1:5173`)
- **Build:** `npm run build` (Generates production assets in `dist/`)
- **Linting:** `npm run lint` (ESLint check)
- **Preview:** `npm run preview` (Preview production build)

## 📖 Development Conventions

### Content Hierarchy
- **Module:** High-level educational block (e.g., "Basics and Math").
- **Chapter:** Thematic section within a module.
- **Lesson:** Specific topic containing multiple steps.
- **Step:** Individual learning unit with theory (Markdown), an optional interactive visualization, and a task (Quiz or Python Code).

### Markdown and Interactive Charts
- Use standard Markdown with GFM support. Use `$...$` for inline math and `$$...$$` for block math. **Important: When writing LaTeX inside JS template literals, use double backslashes (e.g., `\\frac`).**
- **ChartBlocks in Theory:** To embed an interactive, multi-dataset chart in a theory block, use the `chart` code block language with a valid JSON configuration.

**JSON Schema for ChartBlock (Theory):**
\`\`\`javascript
// Inside a \`theory\` template literal:
theory: \`
Some text...
\\\`\\\`\\\`chart
{
  "type": "line", // Global type: "line" or "scatter"
  "title": "Chart Title",
  "xLabel": "X Axis",
  "yLabel": "Y Axis",
  "showOrigin": true, // Optional: Draws vectors from (0,0) to points
  "datasets": [
    {
      "label": "Dataset 1",
      "color": "#6366f1",
      "type": "scatter", // Overrides global type
      "data": [{"x": 1, "y": 2}, {"x": 3, "y": 4}]
    }
  ]
}
\\\`\\\`\\\`
\`
\`\`\`

- **ChartBlocks in Quizzes:** You can now attach a `chart` object directly to a quiz question to provide visual context before the multiple-choice options.

**JSON Schema for ChartBlock (Quizzes):**
\`\`\`javascript
// Inside a \`task.questions\` array:
{
  question: "What does this chart represent?",
  multipleChoice: false,
  chart: {
    type: "scatter",
    title: "Quiz Chart",
    datasets: [{ label: "Data", color: "#ec4899", data: [{"x": 1, "y": 1}] }]
  },
  options: [ ... ],
  correctAnswers: ["1"]
}
\`\`\`


### File Structure Guidelines
- `src/components/`: UI components and specialized ML boards.
- `src/content/`: Main educational content (JavaScript objects).
- `src/hooks/`: Custom React hooks (e.g., `usePyodide`).
- `src/workers/`: Background workers for heavy computation.
- `src/utils/`: Helper functions and global constants.

## 🛠️ Key Files

- `edtech-ml/src/content/lessons.js`: The "source of truth" for curriculum content.
- `edtech-ml/src/components/LessonModule.jsx`: The core orchestrator for the lesson experience.
- `edtech-ml/src/workers/pyodideWorker.js`: Manages the lifecycle and execution of the Python environment.
- `edtech-ml/src/context/ProgressContext.jsx`: Manages user XP and completed lesson state.
- `edtech-ml/src/utils/glossary.js`: Global term definitions for interactive tooltips.
