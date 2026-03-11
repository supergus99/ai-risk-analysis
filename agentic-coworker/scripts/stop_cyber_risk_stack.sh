#!/usr/bin/env bash
set -e

lsof -ti :8010 | xargs kill -9 2>/dev/null || true
lsof -ti :8020 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

echo "Stopped services on ports 8010, 8020, and 5173."
