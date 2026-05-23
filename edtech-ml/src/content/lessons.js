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
        theory: "**MSE (Mean Squared Error)**\n\nФункция потерь измеряет разрыв между предсказанием и реальностью. Чем она ниже, тем лучше модель.\n\n$$MSE = \\frac{1}{n} \\sum_{i=1}^{n} (Y_i - \\hat{Y}_i)^2$$",
        task: "Реализуйте функцию `calculate_mse`. Проверьте работу на массивах.",
        hint: "Вычтите массивы, возведите в квадрат и найдите среднее значение.",
        initialCode: "import numpy as np\n\ndef calculate_mse(y_true, y_pred):\n    # НАПИШИТЕ ВАШ КОД ЗДЕСЬ\n    pass",
        testCode: `
import numpy as np
y_t = np.array([1.0, 2.0, 3.0])
y_p = np.array([1.1, 1.9, 3.2])
res = calculate_mse(y_t, y_p)
expected = np.mean((y_t - y_p)**2)
# Проверка с допуском 1e-5
assert abs(res - expected) < 1e-5, f"Ожидалось {expected}, получено {res}"
`
      },
      {
        id: "step-2",
        type: "gradient_descent",
        theory: "**Градиентный спуск**\n\nЭто алгоритм поиска минимума функции. Мы двигаемся в сторону, противоположную градиенту.\n\nПопробуйте менять **Learning Rate** (LR). \n* Слишком маленький LR — спуск будет очень долгим.\n* Слишком большой LR — алгоритм может 'пролететь' минимум или начать расходиться.",
        task: "Подвигайте точку старта и посмотрите, как алгоритм находит центр 'чаши' (минимум).",
        hint: "Попробуйте LR=0.1 и LR=0.4. Заметьте разницу в траектории.",
        initialCode: "# Взаимодействуйте с графиком слева",
        testCode: null
      }
    ]
  },
  {
    id: "lesson-2",
    module: "Алгоритмы",
    title: "Урок 2: Линейная классификация",
    difficulty: "Средне",
    description: "Разделение данных с помощью гиперплоскостей.",
    steps: [
      {
        id: "step-1",
        type: "svm",
        theory: "**SVM и разделяющая прямая**\n\nЗадача классификации — провести линию так, чтобы точки разных классов оказались по разные стороны.\n\n**Hinge Loss** штрафует за точки, которые находятся слишком близко к линии или на 'чужой' территории.",
        task: "Двигайте точки линии так, чтобы минимизировать Hinge Loss до значения ниже 0.1.",
        hint: "Постарайтесь провести линию ровно посередине между красными и синими точками.",
        initialCode: "# Следите за метрикой Hinge Loss в реальном времени",
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
        theory: "**Валидация модели**\n\nМодель может 'зазубрить' тренировочные данные (переобучиться). Чтобы это проверить, мы используем скрытую **тестовую выборку**.",
        task: "Используйте `sklearn.linear_model.LinearRegression`, чтобы обучить модель на `X_train`, `y_train`.",
        hint: "Создайте экземпляр LinearRegression(), вызовите .fit(X_train, y_train) и верните объект модели.",
        initialCode: `
import numpy as np
from sklearn.linear_model import LinearRegression

# Генерация данных
X_train = np.linspace(0, 10, 20).reshape(-1, 1)
y_train = 2 * X_train.flatten() + np.random.normal(0, 1, 20)

def train_model(X, y):
    # Обучите и верните модель
    pass

model = train_model(X_train, y_train)
`,
        testCode: `
# СКРЫТЫЙ ТЕСТ НА ВАЛИДАЦИОННОЙ ВЫБОРКЕ
X_test = np.array([[12.0], [15.0]])
y_test = np.array([24.0, 30.0])

preds = model.predict(X_test)
mse = np.mean((preds - y_test)**2)

print(f"MSE на новых данных: {round(mse, 4)}")
assert mse < 5.0, "Модель плохо работает на новых данных. Проверьте обучение."
`
      }
    ]
  }
];
