#!/bin/bash
# Simple script to check PostgreSQL data

DB_URL="${DATABASE_URL:-postgres://seanslinder@localhost:5432/trello_dev}"

echo "=== Database Overview ==="
psql "$DB_URL" -c "
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM boards) as boards,
  (SELECT COUNT(*) FROM lists) as lists,
  (SELECT COUNT(*) FROM cards) as cards;
"

echo ""
echo "=== Recent Boards ==="
psql "$DB_URL" -c "SELECT id, title, \"createdAt\" FROM boards ORDER BY \"createdAt\" DESC LIMIT 5;"

echo ""
echo "=== Recent Lists ==="
psql "$DB_URL" -c "SELECT id, title, \"boardId\" FROM lists ORDER BY \"createdAt\" DESC LIMIT 5;"

echo ""
echo "=== Recent Cards ==="
psql "$DB_URL" -c "SELECT id, title, \"listId\" FROM cards ORDER BY \"createdAt\" DESC LIMIT 5;"
