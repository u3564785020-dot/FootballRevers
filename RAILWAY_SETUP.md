# Railway Setup Instructions

## 🚀 Настройки для оптимальной работы на Railway

### 1. **Переменные окружения (Environment Variables)**
Добавьте в разделе Variables следующие переменные:

```
NODE_ENV=production
PORT=8080
NODE_OPTIONS=--max-old-space-size=1024
```

### 2. **Настройки Deploy (Развертывание)**
- **Healthcheck Timeout:** 300 секунд (уже настроено в railway.json)
- **Teardown:** Включить (Enable Teardown)
- **Restart Policy:** ON_FAILURE с 5 попытками

### 3. **Настройки Networking (Сеть)**
- **Public Domain:** `footballrevers-production.up.railway.app` (уже настроено)
- **Port:** 8080 (уже настроено)

### 4. **Настройки Build (Сборка)**
- **Builder:** Nixpacks (уже настроено)
- **Providers:** Node.js (уже настроено)

### 5. **Рекомендуемые изменения в Railway Dashboard:**

#### В разделе Deploy:
- ✅ **Healthcheck Timeout:** 300 секунд
- ✅ **Teardown:** Включить
- ✅ **Restart Policy:** ON_FAILURE
- ✅ **Max Retries:** 5

#### В разделе Variables:
- ✅ **NODE_ENV:** production
- ✅ **PORT:** 8080
- ✅ **NODE_OPTIONS:** --max-old-space-size=1024

### 6. **Проверка работы:**
1. Откройте ваш Railway URL
2. Проверьте, что цены изменяются (в 2 раза меньше)
3. Проверьте, что корзина работает
4. Проверьте, что checkout перехватывается

### 7. **Мониторинг:**
- Используйте раздел "Logs" для отслеживания ошибок
- Используйте раздел "Metrics" для мониторинга производительности

## 🔧 Troubleshooting

### Если сайт загружается медленно:
- Увеличьте Healthcheck Timeout до 600 секунд
- Проверьте логи на наличие ошибок CORS

### Если цены не изменяются:
- Проверьте логи на наличие сообщений `💰 Price changed`
- Убедитесь, что сервер запустился без ошибок

### Если корзина не работает:
- Проверьте логи на наличие ошибок JSON
- Убедитесь, что CORS заголовки установлены правильно
