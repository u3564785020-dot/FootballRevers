# GoalTickets Proxy

Реверс-прокси для сайта goaltickets.com, развернутый на Railway.

## 📁 GitHub Repository
**Репозиторий**: [u3564785020-dot/FootballRevers](https://github.com/u3564785020-dot/FootballRevers.git)

## 🚀 Быстрое развертывание
1. Перейдите на [Railway.app](https://railway.app)
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите репозиторий: `u3564785020-dot/FootballRevers`
4. Нажмите "Deploy Now"
5. Получите ваш URL!

## 🚀 Развертывание на Railway

1. **Установите Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Войдите в Railway:**
   ```bash
   railway login
   ```

3. **Инициализируйте проект:**
   ```bash
   railway init
   ```

4. **Разверните проект:**
   ```bash
   railway up
   ```

5. **Получите URL:**
   ```bash
   railway domain
   ```

## 🔧 Локальная разработка

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Запустите сервер:**
   ```bash
   npm start
   # или для разработки
   npm run dev
   ```

3. **Откройте браузер:**
   ```
   http://localhost:3000
   ```

## 📋 Функции

- ✅ Полный прокси всех запросов к goaltickets.com
- ✅ Автоматическая замена ссылок в HTML
- ✅ CORS поддержка
- ✅ Обход защиты от прокси
- ✅ Логирование запросов
- ✅ Graceful shutdown

## 🌐 Использование

После развертывания ваш сайт будет доступен по URL Railway:
```
https://your-project-name.railway.app
```

Все запросы будут проксироваться к goaltickets.com, но пользователи будут видеть ваш домен.

## ⚠️ Важные замечания

- Убедитесь, что у вас есть права на проксирование контента
- Соблюдайте robots.txt и условия использования сайта
- Используйте только для легальных целей
