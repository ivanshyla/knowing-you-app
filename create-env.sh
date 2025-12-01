#!/bin/bash

# 🎯 Скрипт для создания .env.local
# Запустите: bash create-env.sh

echo "🔧 Создание файла .env.local"
echo ""
echo "Введите ваш Project URL из Supabase:"
echo "(Пример: https://abcdefgh.supabase.co)"
read -p "URL: " SUPABASE_URL

echo ""
echo "Введите ваш anon/public key из Supabase:"
echo "(Длинная строка, начинается с eyJ...)"
read -p "Key: " SUPABASE_KEY

# Создаём файл .env.local
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF

echo ""
echo "✅ Файл .env.local создан!"
echo ""
echo "Теперь:"
echo "1. Перезапустите сервер (Ctrl+C и npm run dev)"
echo "2. Создайте таблицы в Supabase (запустите SUPABASE_SETUP.sql)"
echo "3. Обновите страницу в браузере"




