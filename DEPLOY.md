# 🚀 Развертывание на Railway

## Пошаговая инструкция

### 1. Установка Railway CLI

```bash
# Windows (PowerShell)
npm install -g @railway/cli

# Или через winget
winget install Railway.Railway
```

### 2. Вход в Railway

```bash
railway login
```

### 3. Создание проекта

```bash
# В папке с проектом
railway init

# Выберите:
# - Create new project
# - Назовите проект: goaltickets-proxy
```

### 4. Развертывание

```bash
# Загрузить и развернуть
railway up

# Получить URL
railway domain
```

### 5. Настройка домена (опционально)

```bash
# Добавить кастомный домен
railway domain add your-domain.com
```

## 🔧 Альтернативный способ через GitHub

1. **Создайте репозиторий на GitHub**
2. **Загрузите код:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/goaltickets-proxy.git
   git push -u origin main
   ```

3. **Подключите к Railway:**
   - Зайдите на [railway.app](https://railway.app)
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий

## 📋 Проверка работы

После развертывания ваш сайт будет доступен по адресу:
```
https://goaltickets-proxy-production.up.railway.app
```

## 🛠️ Управление

```bash
# Посмотреть логи
railway logs

# Перезапустить сервис
railway redeploy

# Посмотреть переменные окружения
railway variables

# Подключиться к сервису
railway shell
```

## ⚠️ Важные настройки

1. **Переменные окружения:**
   - `PORT` - автоматически устанавливается Railway
   - `NODE_ENV=production` - для продакшена

2. **Мониторинг:**
   - Railway автоматически мониторит здоровье приложения
   - Healthcheck endpoint: `/`

3. **Масштабирование:**
   - Railway автоматически масштабирует приложение
   - Можно настроить в панели управления

## 🔒 Безопасность

- Все запросы логируются
- CORS настроен для всех доменов
- Заголовки безопасности отключены для корректной работы прокси

## 📊 Мониторинг

Railway предоставляет:
- Логи в реальном времени
- Метрики производительности
- Уведомления об ошибках
- Автоматические перезапуски при сбоях
