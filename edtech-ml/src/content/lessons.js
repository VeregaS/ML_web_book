export const lessons = [
  {
    id: "lesson-1",
    module: "Математика в ML",
    title: "Урок 1: Оптимизация и Потери",
    difficulty: "Легко",
    description: "Изучаем среднеквадратичную ошибку и основы оптимизации.",
    steps: [
      {
        id: "step-1",
        theory: "**MSE (Mean Squared Error)**\n\nФункция потерь измеряет разрыв между предсказанием и реальностью.\n\n$$MSE = \\frac{1}{n} \\sum_{i=1}^{n} (Y_i - \\hat{Y}_i)^2$$",
        task: "Реализуйте функцию `calculate_mse`.",
        hint: "Используйте `np.mean` для нахождения среднего квадрата разности.",
        initialCode: "import numpy as np\n\ndef calculate_mse(y_true, y_pred):\n    # НАПИШИТЕ ВАШ КОД ЗДЕСЬ\n    pass",
        testCode: `
import unittest
import numpy as np
import student_code

class TestLesson1(unittest.TestCase):
    def test_mse_value(self):
        y_t = np.array([1.0, 2.0])
        y_p = np.array([1.1, 1.9])
        res = student_code.calculate_mse(y_t, y_p)
        expected = np.mean((y_t - y_p)**2)
        self.assertAlmostEqual(res, expected, places=5, msg="MSE рассчитан неверно")
`
      },
      {
        id: "step-2",
        type: "gradient_descent",
        theory: "**Градиентный спуск**",
        task: "Подвигайте точку старта.",
        initialCode: "# Взаимодействуйте с графиком",
        testCode: null
      }
    ]
  },
  {
    id: "lesson-3",
    module: "Инструменты",
    title: "Урок 3: Переобучение и Валидация",
    difficulty: "Сложно",
    description: "Учимся строить модели, которые работают на новых данных.",
    steps: [
      {
        id: "step-1",
        theory: "**Валидация модели**\n\nМодель может 'зазубрить' тренировочные данные. Мы проверим её на скрытой тестовой выборке.",
        task: "Используйте `sklearn.linear_model.LinearRegression`, чтобы обучить модель на `X_train`, `y_train`.",
        hint: "Вызовите .fit(X_train, y_train) и верните объект модели.",
        initialCode: `
import numpy as np
from sklearn.linear_model import LinearRegression

X_train = np.linspace(0, 10, 20).reshape(-1, 1)
y_train = 2 * X_train.flatten() + np.random.normal(0, 1, 20)

def train_model(X, y):
    model = LinearRegression()
    model.fit(X, y)
    return model

model = train_model(X_train, y_train)
`,
        testCode: `
import unittest
import numpy as np
import student_code

class TestLesson3(unittest.TestCase):
    def test_model_performance(self):
        # Скрытая выборка
        X_test = np.array([[12.0], [15.0]])
        y_test = np.array([24.0, 30.0])
        
        # Берем модель из кода студента
        model = student_code.model
        preds = model.predict(X_test)
        mse = np.mean((preds - y_test)**2)
        
        self.assertLess(mse, 10.0, f"Слишком высокая ошибка на тесте: {mse}")
`
      }
    ]
  }
];
