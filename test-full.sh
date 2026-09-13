#!/bin/bash
# ============================================================================
# 🧪 ПОЛНАЯ ПРОВЕРКА REST API «Шесть городов» (Финальная версия + Загрузка файлов)
# ============================================================================
BASE_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="ivan-$(date +%s)@test.com"
TEST_PASSWORD="pass12345"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# --- НАДЕЖНАЯ ФУНКЦИЯ ИЗВЛЕЧЕНИЯ ID (через awk) ---
extract_id() {
  local json="$1"
  echo "$json" | tr -d '\r\n' | awk -v key='"id":' '
  {
    idx = index($0, key)
    if (idx > 0) {
      rest = substr($0, idx + length(key))
      gsub(/^[ \t]+/, "", rest)
      if (substr(rest, 1, 1) == "\"") {
        rest = substr(rest, 2)
        end_idx = index(rest, "\"")
        if (end_idx > 0) {
          print substr(rest, 1, end_idx - 1)
          exit
        }
      }
    }
  }'
}

check() {
  local response="$1"
  local expected="$2"
  local description="$3"
  local actual=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  if [ "$actual" == "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC} [$actual] $description"
  else
    echo -e "${RED}❌ FAIL${NC} [Ожидалось: $expected, Получено: $actual] $description"
    echo -e "${YELLOW}Ответ сервера:${NC} $body"
  fi
}

do_req() {
  curl -s -w "\n%{http_code}" "$@"
}

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🧪 ПОЛНАЯ ПРОВЕРКА REST API                                 ║${NC}"
echo -e "${CYAN}║   URL: ${BASE_URL}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =========================================================================
# 1. ПОЛЬЗОВАТЕЛИ (Users)
# =========================================================================
echo -e "${BLUE}📌 1. ПОЛЬЗОВАТЕЛИ${NC}"
RESP=$(do_req -X POST "$BASE_URL/users" -H "Content-Type: application/json" \
  -d "{\"name\":\"Ivan\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
check "$RESP" "201" "POST /users — Регистрация"
USER_ID=$(extract_id "$RESP")
echo -e "   └─ Сохранен USER_ID: ${YELLOW}$USER_ID${NC}"

RESP=$(do_req -X POST "$BASE_URL/users" -H "Content-Type: application/json" \
  -d "{\"name\":\"Ivan2\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
check "$RESP" "409" "POST /users — Дубликат email"

RESP=$(do_req -X POST "$BASE_URL/users" -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad-email","password":"12"}')
check "$RESP" "400" "POST /users — Ошибка валидации"

RESP=$(do_req -X GET "$BASE_URL/users/$USER_ID")
check "$RESP" "200" "GET /users/:userId — Успешное получение"

RESP=$(do_req -X GET "$BASE_URL/users/00000000-0000-0000-0000-000000000000")
check "$RESP" "404" "GET /users/:userId — Пользователь не найден"

RESP=$(do_req -X GET "$BASE_URL/users/not-a-valid-uuid")
check "$RESP" "400" "GET /users/:userId — Невалидный формат ID (Middleware)"

# =========================================================================
# 2. АУТЕНТИФИКАЦИЯ (Auth)
# =========================================================================
echo -e "\n${BLUE}📌 2. АУТЕНТИФИКАЦИЯ${NC}"
RESP=$(do_req -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
check "$RESP" "200" "POST /auth/login — Успешный вход"
TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "   └─ Сохранен TOKEN: ${YELLOW}${TOKEN:0:30}...${NC}"

# ✅ ИСПРАВЛЕННЫЙ ТЕСТ: Загрузка аватара (убран $USER_ID из URL)
echo -e "${BLUE}📋 ТЕСТ 6.1: Загрузка аватара пользователя${NC}"
TEST_AVATAR=$(mktemp /tmp/avatar-XXXXXX.png)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TEST_AVATAR"

RESP_AVATAR=$(do_req -X POST "$BASE_URL/users/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@$TEST_AVATAR")
check "$RESP_AVATAR" "200" "POST /users/avatar — Загрузка аватара"
AVATAR_URL=$(echo "$RESP_AVATAR" | sed '$d' | grep -o '"avatarUrl":"[^"]*"' | cut -d'"' -f4)
if [ -n "$AVATAR_URL" ]; then
  echo -e "   └─ Avatar URL: ${YELLOW}$AVATAR_URL${NC}"
else
  echo -e "${RED}   └─ Avatar URL не найден в ответе${NC}"
fi
rm -f "$TEST_AVATAR"

RESP=$(do_req -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrong_password\"}")
check "$RESP" "401" "POST /auth/login — Неверный пароль"

# =========================================================================
# 3. ПРЕДЛОЖЕНИЯ (Offers)
# =========================================================================
echo -e "\n${BLUE}📌 3. ПРЕДЛОЖЕНИЯ${NC}"
OFFER_PAYLOAD='{
  "title":"Paris apartment",
  "type":"apartment",
  "price":1500,
  "previewImage":"http://x.com/img.jpg",
  "cityName":"Paris",
  "cityLatitude":48.8,
  "cityLongitude":2.3,
  "cityZoom":12,
  "offerLatitude":48.8,
  "offerLongitude":2.3,
  "offerZoom":16,
  "rating":4.5,
  "description":"Nice place in Paris center",
  "bedrooms":2,
  "offerGoods":["Wi-Fi"],
  "images":["http://x.com/img1.jpg"],
  "maxAdults":4
}'

RESP=$(do_req -X POST "$BASE_URL/offers" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d "$OFFER_PAYLOAD")
check "$RESP" "201" "POST /offers — Создание оффера"
OFFER_ID=$(extract_id "$RESP")
echo -e "   └─ Сохранен OFFER_ID: ${YELLOW}$OFFER_ID${NC}"

RESP=$(do_req -X POST "$BASE_URL/offers" -H "Content-Type: application/json" -d "$OFFER_PAYLOAD")
check "$RESP" "401" "POST /offers — Без авторизации"

RESP=$(do_req -X GET "$BASE_URL/offers?limit=5")
check "$RESP" "200" "GET /offers — Список офферов"

RESP=$(do_req -X GET "$BASE_URL/offers?city=Paris&limit=5")
check "$RESP" "200" "GET /offers?city=Paris — Фильтрация"

RESP=$(do_req -X GET "$BASE_URL/offers/$OFFER_ID")
check "$RESP" "200" "GET /offers/:offerId — Получение оффера"

RESP=$(do_req -X GET "$BASE_URL/users/$USER_ID/offers?limit=5")
check "$RESP" "200" "GET /users/:userId/offers — Офферы пользователя"

# =========================================================================
# 4. КОММЕНТАРИИ (Comments)
# =========================================================================
echo -e "\n${BLUE}📌 4. КОММЕНТАРИИ${NC}"
RESP=$(do_req -X POST "$BASE_URL/offers/$OFFER_ID/comments" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"Great place! Highly recommend.","rating":5}')
check "$RESP" "201" "POST /offers/:offerId/comments — Создание комментария"
COMMENT_ID=$(extract_id "$RESP")
echo -e "   └─ Сохранен COMMENT_ID: ${YELLOW}$COMMENT_ID${NC}"

RESP=$(do_req -X POST "$BASE_URL/offers/$OFFER_ID/comments" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"Ok","rating":10}')
check "$RESP" "400" "POST /offers/:offerId/comments — Ошибка валидации"

RESP=$(do_req -X GET "$BASE_URL/offers/$OFFER_ID/comments?limit=10")
check "$RESP" "200" "GET /offers/:offerId/comments — Список комментариев"

RESP=$(do_req -X GET "$BASE_URL/offers/00000000-0000-0000-0000-000000000000/comments")
check "$RESP" "404" "GET /offers/:offerId/comments — Оффер не найден"

RESP=$(do_req -X DELETE "$BASE_URL/offers/$OFFER_ID/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN")
check "$RESP" "204" "DELETE /offers/:offerId/comments/:commentId — Удаление комментария"

RESP=$(do_req -X DELETE "$BASE_URL/offers/$OFFER_ID/comments/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN")
check "$RESP" "404" "DELETE /offers/:offerId/comments/:commentId — Комментарий не найден"

# =========================================================================
# 5. ОЧИСТКА И ЗАВЕРШЕНИЕ
# =========================================================================
echo -e "\n${BLUE}📌 5. ОЧИСТКА И ЗАВЕРШЕНИЕ${NC}"
RESP=$(do_req -X DELETE "$BASE_URL/offers/$OFFER_ID" -H "Authorization: Bearer $TOKEN")
check "$RESP" "204" "DELETE /offers/:offerId — Удаление оффера"

RESP=$(do_req -X POST "$BASE_URL/auth/logout" -H "Authorization: Bearer $TOKEN")
check "$RESP" "200" "POST /auth/logout — Выход из системы"

RESP=$(do_req -X GET "$BASE_URL/unknown-route")
check "$RESP" "404" "GET /unknown-route — Маршрут не найден"

echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    ✅ ПРОВЕРКА ЗАВЕРШЕНА!                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
