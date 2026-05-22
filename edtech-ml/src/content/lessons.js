export const lessons = [
  {
    id: "lesson-1",
    module: "Математика в ML",
    title: "Урок 1: Среднеквадратичная ошибка (MSE)",
    difficulty: "Легко",
    description: "Поймем, как измерять точность предсказаний модели с помощью функции потерь MSE.",
    hasGeometry: true,
    theory: `
**Функция потерь** — это мера того, насколько хорошо наша модель предсказывает ожидаемый результат. 
Одной из самых популярных метрик в задачах регрессии является **Среднеквадратичная ошибка** ($MSE$).

$$
MSE = \\frac{1}{n} \\sum_{i=1}^{n} (Y_i - \\hat{Y}_i)^2
$$

Где $Y_i$ — это истинные значения, а $\\hat{Y}_i$ — предсказанные значения на линии регрессии.
`,
    practice: {
      description: "Напишите функцию для вычисления MSE на чистом Python, используя массивы `y_true` и `y_pred`.",
      initialCode: `import numpy as np\nimport js\n\ny_true = np.array([3, -0.5, 2, 7])\ny_pred = np.array([2.5, 0.0, 2, 8])\n\ndef calculate_mse(true_values, pred_values):\n    # НАПИШИТЕ ВАШ КОД ЗДЕСЬ\n    pass\n\nif hasattr(js, 'updateLine'):\n    js.updateLine(y_pred[0], y_pred[-1])`,
      testCode: `
try:
    student_mse = calculate_mse(y_true, y_pred)
except Exception as e:
    raise AssertionError(f"Ваша функция вызвала ошибку: {e}")

assert student_mse is not None, "Функция calculate_mse вернула None."
assert isinstance(student_mse, (int, float, np.number)), f"Ожидалось число, получено: {type(student_mse)}"

expected_mse = np.mean((y_true - y_pred) ** 2)
assert np.isclose(student_mse, expected_mse), f"Неверный результат. Ожидалось {expected_mse}, получено {student_mse}"
print("Тесты пройдены! Функция работает корректно.")`
    }
  },
  {
    id: "lesson-2",
    module: "Инструменты",
    title: "Урок 2: Основы NumPy",
    difficulty: "Легко",
    description: "Изучим векторные операции в NumPy, которые ускоряют вычисления в ML в десятки раз.",
    hasGeometry: false,
    theory: `
Библиотека **NumPy** — это фундамент для любых вычислений в машинном обучении. 
Она позволяет векторизовать операции, избавляя нас от медленных циклов \`for\` в Python.

Вместо того чтобы умножать каждый элемент списка по отдельности, мы можем умножить весь вектор:
$$
\\vec{v} \\times c = [v_1 \\cdot c, v_2 \\cdot c, ..., v_n \\cdot c]
$$
`,
    practice: {
      description: "Используя библиотеку `numpy`, умножьте каждый элемент массива `X` на 10 и сохраните результат в переменную `result`.",
      initialCode: `import numpy as np\n\nX = np.array([1, 2, 3, 4, 5])\n\n# Умножьте массив X на 10\nresult = None\n\nprint(result)`,
      testCode: `
assert result is not None, "Переменная result не определена или равна None"
assert isinstance(result, np.ndarray), "Результат должен быть массивом numpy"
assert np.array_equal(result, np.array([10, 20, 30, 40, 50])), "Неверные значения в массиве"
print("Тесты пройдены! Отличная работа.")`
    }
  },
  {
    id: "lesson-3",
    module: "Инструменты",
    title: "Урок 3: Визуализация данных",
    difficulty: "Средне",
    description: "Научимся строить графики функций и данных с помощью библиотеки Matplotlib.",
    hasGeometry: false,
    theory: `
Для анализа данных в ML необходимо визуально оценивать распределения и зависимости. Стандарт индустрии для визуализации на Python — библиотека **Matplotlib**.
В этом уроке мы построим график квадратичной функции $y = x^2$.
`,
    practice: {
      description: "Напишите код для построения графика зависимости `y` от `x`. Не забудьте вызвать `plt.show()`.",
      initialCode: `import matplotlib.pyplot as plt\nimport numpy as np\n\nx = np.linspace(-10, 10, 100)\ny = x ** 2\n\nplt.figure(figsize=(6, 4))\nplt.plot(x, y)\nplt.title("Парабола")\nplt.grid(True)\nplt.show()`,
      testCode: null
    }
  }
];