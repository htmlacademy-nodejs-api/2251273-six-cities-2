#!/bin/bash
# ============================================================================
# 🧪 Автоматическое тестирование REST API «Шесть городов»
# Полностью соответствует specification.yml + тест загрузки аватара
# ============================================================================
BASE_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="auto-test-$(date +%s)@example.com"
TEST_PASSWORD="securePassword123"
TEST_NAME="Auto Tester"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
PASSED=0
FAILED=0
TOTAL=0

# ✅ НАДЕЖНАЯ ФУНКЦИЯ ИЗВЛЕЧЕНИЯ (работает в Git Bash / Linux / macOS)
extract_value() {
  local json="$1"
  local key="$2"
  echo "$json" | tr -d '\r\n' | awk -v key="\"$key\":" '
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

check_status() {
  local response="$1"
  local expected="$2"
  local test_name="$3"
  TOTAL=$((TOTAL + 1))
  local actual=$(echo "$response" | tail -n1)
  if [ "$actual" == "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC} [$actual] $test_name"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} [expected $expected, got $actual] $test_name"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

do_request() {
  curl -s -w "\n%{http_code}" "$@"
}

# =========================================================================
# НАЧАЛО ТЕСТИРОВАНИЯ
# =========================================================================
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🧪 Автоматическое тестирование REST API                   ║${NC}"
echo -e "${CYAN}║   Base URL: ${BASE_URL}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. ПОЛЬЗОВАТЕЛИ ────────────────────────────────────────────────────────
echo -e "${BLUE}📋 ТЕСТ 1: Регистрация нового пользователя${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
check_status "$RESPONSE" "201" "POST /users — регистрация"
USER_ID=$(extract_value "$RESPONSE" "id")
echo -e "   └─ User ID: ${YELLOW}$USER_ID${NC}"

echo -e "${BLUE}📋 ТЕСТ 2: Попытка зарегистрироваться с тем же email${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Another User\",\"email\":\"$TEST_EMAIL\",\"password\":\"anotherPass123\"}")
check_status "$RESPONSE" "409" "POST /users — дубликат email"

echo -e "${BLUE}📋 ТЕСТ 3: Ошибка валидации данных${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "email": "not-an-email", "password": "12"}')
check_status "$RESPONSE" "400" "POST /users — невалидные данные"

echo -e "${BLUE}📋 ТЕСТ 4: Получение пользователя по ID${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/users/$USER_ID")
check_status "$RESPONSE" "200" "GET /users/:userId — получение пользователя"

echo -e "${BLUE}📋 ТЕСТ 5: Получение несуществующего пользователя${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/users/00000000-0000-0000-0000-000000000000")
check_status "$RESPONSE" "404" "GET /users/:userId — пользователь не найден"

# ─── 2. АУТЕНТИФИКАЦИЯ ──────────────────────────────────────────────────────
echo -e "${BLUE}📋 ТЕСТ 6: Вход в систему (получение токена)${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
check_status "$RESPONSE" "200" "POST /auth/login — успешный вход"
TOKEN=$(extract_value "$RESPONSE" "token")
echo -e "   └─ Token: ${YELLOW}${TOKEN:0:40}...${NC}"

# ✅ ИСПРАВЛЕННЫЙ ТЕСТ: Загрузка аватара (убран $USER_ID из URL)
echo -e "${BLUE}📋 ТЕСТ 6.1: Загрузка аватара пользователя${NC}"
TEST_AVATAR=$(mktemp /tmp/avatar-XXXXXX.png)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TEST_AVATAR"

RESPONSE_AVATAR=$(do_request -X POST "$BASE_URL/users/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@$TEST_AVATAR")
check_status "$RESPONSE_AVATAR" "200" "POST /users/avatar — загрузка аватара"
AVATAR_URL=$(extract_value "$RESPONSE_AVATAR" "avatarUrl")
if [ -n "$AVATAR_URL" ]; then
  echo -e "   └─ Avatar URL: ${YELLOW}$AVATAR_URL${NC}"
else
  echo -e "${RED}   └─ Avatar URL не найден в ответе${NC}"
fi
rm -f "$TEST_AVATAR"

echo -e "${BLUE}📋 ТЕСТ 7: Вход с неверным паролем${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrong_password\"}")
check_status "$RESPONSE" "401" "POST /auth/login — неверный пароль"

# ─── 3. ПРЕДЛОЖЕНИЯ ─────────────────────────────────────────────────────────
echo -e "${BLUE}📋 ТЕСТ 8: Создание предложения (с авторизацией)${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/offers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
  "title": "Cozy apartment in Paris center",
  "type": "apartment",
  "price": 2500,
  "previewImage": "http://example.com/img.jpg",
  "cityName": "Paris",
  "cityLatitude": 48.8566,
  "cityLongitude": 2.3522,
  "cityZoom": 12,
  "offerLatitude": 48.8566,
  "offerLongitude": 2.3522,
  "offerZoom": 16,
  "rating": 4.5,
  "description": "A beautiful place to stay in the heart of the city.",
  "bedrooms": 2,
  "offerGoods": ["Wi-Fi", "Kitchen"],
  "images": ["http://example.com/img1.jpg"],
  "maxAdults": 4
}')
check_status "$RESPONSE" "201" "POST /offers — создание оффера"
OFFER_ID=$(extract_value "$RESPONSE" "id")
echo -e "   └─ Offer ID: ${YELLOW}$OFFER_ID${NC}"

echo -e "${BLUE}📋 ТЕСТ 9: Создание оффера БЕЗ токена${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/offers" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test apartment title","type":"apartment","price":100,"previewImage":"http://x.com","cityName":"Paris","cityLatitude":0,"cityLongitude":0,"cityZoom":0,"offerLatitude":0,"offerLongitude":0,"offerZoom":0,"rating":1,"description":"Test description for failure test","bedrooms":1,"offerGoods":["Wi-Fi"],"images":["http://x.com"],"maxAdults":1}')
check_status "$RESPONSE" "401" "POST /offers — без авторизации"

echo -e "${BLUE}📋 ТЕСТ 10: Получение списка офферов${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/offers?limit=5")
check_status "$RESPONSE" "200" "GET /offers?limit=5 — список офферов"

echo -e "${BLUE}📋 ТЕСТ 11: Фильтрация офферов по городу${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/offers?city=Paris&limit=10")
check_status "$RESPONSE" "200" "GET /offers?city=Paris — фильтрация по городу"

echo -e "${BLUE}📋 ТЕСТ 12: Получение оффера по ID${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/offers/$OFFER_ID")
check_status "$RESPONSE" "200" "GET /offers/:offerId — получение оффера"

echo -e "${BLUE}📋 ТЕСТ 13: Офферы конкретного пользователя${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/users/$USER_ID/offers?limit=10")
check_status "$RESPONSE" "200" "GET /users/:userId/offers — офферы пользователя"

# ─── 4. КОММЕНТАРИИ ─────────────────────────────────────────────────────────
echo -e "${BLUE}📋 ТЕСТ 14: Создание комментария к офферу${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/offers/$OFFER_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "Отличное место, очень рекомендую!", "rating": 5}')
check_status "$RESPONSE" "201" "POST /offers/:offerId/comments — создание комментария"
COMMENT_ID=$(extract_value "$RESPONSE" "id")
echo -e "   └─ Comment ID: ${YELLOW}$COMMENT_ID${NC}"

echo -e "${BLUE}📋 ТЕСТ 15: Ошибка валидации комментария${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/offers/$OFFER_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "Ок", "rating": 10}')
check_status "$RESPONSE" "400" "POST /offers/:offerId/comments — невалидные данные"

echo -e "${BLUE}📋 ТЕСТ 16: Получение комментариев к офферу${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/offers/$OFFER_ID/comments?limit=10")
check_status "$RESPONSE" "200" "GET /offers/:offerId/comments — список комментариев"

echo -e "${BLUE}📋 ТЕСТ 17: Комментарии несуществующего оффера${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/offers/00000000-0000-0000-0000-000000000000/comments")
check_status "$RESPONSE" "404" "GET /offers/:offerId/comments — оффер не найден"

echo -e "${BLUE}📋 ТЕСТ 18: Удаление своего комментария${NC}"
RESPONSE=$(do_request -X DELETE "$BASE_URL/offers/$OFFER_ID/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN")
check_status "$RESPONSE" "204" "DELETE /offers/:offerId/comments/:commentId — удаление комментария"

echo -e "${BLUE}📋 ТЕСТ 19: Удаление несуществующего комментария${NC}"
RESPONSE=$(do_request -X DELETE "$BASE_URL/offers/$OFFER_ID/comments/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN")
check_status "$RESPONSE" "404" "DELETE /offers/:offerId/comments/:commentId — комментарий не найден"

# ─── 5. ОЧИСТКА ─────────────────────────────────────────────────────────────
echo -e "${BLUE}📋 ТЕСТ 20: Удаление своего оффера${NC}"
RESPONSE=$(do_request -X DELETE "$BASE_URL/offers/$OFFER_ID" \
  -H "Authorization: Bearer $TOKEN")
check_status "$RESPONSE" "204" "DELETE /offers/:offerId — удаление оффера"

echo -e "${BLUE}📋 ТЕСТ 21: Выход из системы${NC}"
RESPONSE=$(do_request -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN")
check_status "$RESPONSE" "200" "POST /auth/logout — выход из системы"

echo -e "${BLUE}📋 ТЕСТ 22: Несуществующий маршрут${NC}"
RESPONSE=$(do_request -X GET "$BASE_URL/unknown-route")
check_status "$RESPONSE" "404" "GET /unknown-route — маршрут не найден"

# =========================================================================
# ИТОГОВЫЙ ОТЧЁТ
# =========================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    📊 ИТОГОВЫЙ ОТЧЁТ                        ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Всего тестов:  ${YELLOW}$TOTAL${NC}                                       ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Пройдено:      ${GREEN}$PASSED${NC}                                       ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Провалено:     ${RED}$FAILED${NC}                                       ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Все тесты пройдены! API работает корректно.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Некоторые тесты провалились. Проверьте логи выше.${NC}"
  exit 1
fi
