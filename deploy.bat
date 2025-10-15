@echo off
echo 🚀 Развертывание GoalTickets Proxy на Railway...
echo.

echo 📦 Установка Railway CLI...
npm install -g @railway/cli

echo.
echo 🔐 Вход в Railway...
railway login

echo.
echo 🏗️ Инициализация проекта...
railway init

echo.
echo 🚀 Развертывание...
railway up

echo.
echo 🌐 Получение URL...
railway domain

echo.
echo ✅ Развертывание завершено!
echo 📋 Проверьте логи: railway logs
echo 🔄 Перезапуск: railway redeploy
echo.
pause
