# ML Academy: Interactive Learning Platform

Локальная образовательная платформа для изучения Machine Learning. Построена на React, работает полностью в браузере (без необходимости серверного бэкенда) благодаря Pyodide (Python в WebAssembly).

## 🛠 Технологический стек
- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion
- **Python Runtime:** Pyodide (исполняется в отдельном Web Worker)
- **Редактор кода:** CodeMirror 6 (с автодополнением ML-сниппетов)
- **Визуализация:** JSXGraph (живая интерактивная математика), Matplotlib (интеграция с Pyodide), кастомные SVG-графики.

## 🏗 Архитектура
- **`src/components/LessonModule.jsx`**: Главный контейнер урока (строгий Split-screen: Теория/Задание слева, IDE справа).
- **`src/workers/pyodideWorker.js`**: Изолированный Web Worker для выполнения Python-кода. Очищает `globals()` перед каждым запуском (защита от утечек состояния), перехватывает `sys.stdout` для стриминга в реальном времени, запускает `unittest` и рендерит `pandas.DataFrame` и графики.
- **`src/hooks/usePyodide.js`**: Хук-мост между React и Worker. Поддерживает отмену выполнения (через `SharedArrayBuffer` + Timeout 10s) для защиты от бесконечных циклов.
- **`src/context/ProgressContext.jsx`**: Глобальный стейт геймификации (XP, купленные подсказки, уведомления).

---

## 🤖 ИНСТРУКЦИЯ ДЛЯ ИИ / РАЗРАБОТЧИКОВ: Как создавать уроки

Вся структура уроков хранится в файле `src/content/lessons.js`. Чтобы добавить новый курс или урок, добавьте объект в массив `lessons`.

### Базовая структура объекта урока:
```javascript
{
  id: "unique-lesson-id",       // Уникальный строковый ID
  module: "Название модуля",    // Например: 'Линейная Алгебра' или 'Основы ML'
  title: "Урок X: Название",
  difficulty: "Легко" | "Средне" | "Сложно",
  description: "Краткое описание урока для карты курса.",
  steps: [
    // ... массив шагов (см. ниже)
  ]
}
```

### Структура шага (Step)
Шаг может быть текстовым/кодовым, либо содержать дополнительный интерактивный блок "живой математики".

```javascript
{
  id: "step-1",
  
  // Тип интерактивного блока (необязательно). 
  // Поддерживаемые: 'regression', 'svm', 'gradient_descent', 'jupyter'
  // Если не указан, будет отрендерена только теория.
  type: "regression", 
  
  // Теория (Markdown, поддерживает LaTeX через $$)
  theory: "**Текст**\n\nФормула: $$y = mx + b$$",
  
  // Практическое задание (Markdown) - отрендерится в отдельном блоке
  task: "Реализуйте функцию `fit(X, y)`",
  
  // Подсказка, которую пользователь может купить за 20 XP
  hint: "Используйте метод `.reshape(-1, 1)` для массива X.",
  
  // Начальный код, который появится в редакторе CodeMirror
  initialCode: "import numpy as np\n\ndef fit(X, y):\n    pass",
  
  // Код для проверки (unittest) - скрыт от пользователя
  testCode: `...` 
}
```

### 🧪 Как писать `testCode` (Спецификация ML-Грейдера)
Платформа использует встроенный модуль `unittest` Python внутри Pyodide. Код пользователя сохраняется в виртуальную файловую систему как `student_code.py` перед выполнением тестов.

**Критические правила для `testCode`:**
1. Вы **ОБЯЗАТЕЛЬНО** должны импортировать `unittest` и модуль `student_code`.
2. Код должен быть оформлен как класс, наследуемый от `unittest.TestCase`.
3. Для проверки ML-метрик и чисел с плавающей точкой используйте методы вроде `self.assertAlmostEqual()` или `np.testing.assert_allclose()`. Не используйте строгое равенство `==`.
4. Для проверок на переобучение (overfitting) создавайте внутри теста скрытую валидационную выборку (`X_test`, `y_test`), импортируйте обученную модель студента (`student_code.model`) и тестируйте её predict.
5. В сообщениях об ошибках (`msg="..."`) пишите понятные подсказки на русском языке, так как именно они выводятся в консоль студента при провале тестов.

**Шаблон идеального `testCode`:**
```python
import unittest
import numpy as np
import student_code # Код, написанный пользователем в редакторе

class TestUserSolution(unittest.TestCase):
    def test_function_output(self):
        # 1. Готовим скрытые данные
        X_test = np.array([1.0, 2.0, 3.0])
        y_test = np.array([2.0, 4.0, 6.0])
        
        # 2. Вызываем функцию студента
        try:
            res = student_code.my_ml_function(X_test)
        except Exception as e:
            self.fail(f"Ваша функция упала с ошибкой: {e}")
            
        # 3. Проверяем типы и базовые контракты
        self.assertIsNotNone(res, "Функция вернула None. Вы забыли return?")
        self.assertTrue(isinstance(res, np.ndarray), "Ожидался numpy array.")
        
        # 4. Математическая проверка с допуском (tolerance)
        expected = np.array([2.1, 4.1, 6.1]) # Допустим, мы ожидали смещение
        try:
            np.testing.assert_allclose(res, expected, atol=1e-2)
        except AssertionError:
            self.fail("Значения предсказаний слишком сильно отклоняются от ожидаемых.")
```

### 🐼 Поддержка Pandas DataFrame (Data Viewer)
Если последняя выполняемая строка кода пользователя или функция возвращает `pandas.DataFrame`, грейдер автоматически перехватит его, конвертирует в JSON и отрендерит под терминалом интерактивную HTML-таблицу (компонент `DataViewer.jsx`). Никаких дополнительных настроек от ИИ при создании урока не требуется, просто попросите студента вернуть DataFrame.

### 📈 Графики Loss в реальном времени (Live Metrics)
Если в `initialCode` подразумевается цикл обучения нейросети или градиентного спуска, студент может визуализировать график Loss в реальном времени. В глобальное пространство имен `globals()` проброшена JS-функция `sendMetricToMain(epoch, loss)`.
Пример интеграции в `initialCode` для урока:
```python
for epoch in range(100):
    loss = model.train_step(X, y)
    print(f"Epoch {epoch}: Loss = {loss}")
    
    # Эта функция отправит данные в React и нарисует точку на SVG-графике:
    sendMetricToMain(epoch, loss) 
```