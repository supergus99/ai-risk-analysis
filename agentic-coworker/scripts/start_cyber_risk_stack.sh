#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/5] Activating virtual environment"
source "$ROOT_DIR/.venv/bin/activate"

echo "[2/5] Freeing ports 8010, 8020, 5173"
lsof -ti :8010 | xargs kill -9 2>/dev/null || true
lsof -ti :8020 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

echo "[3/5] Starting risk engine on 8010"
(
  cd "$ROOT_DIR/support_services/cyber-risk/risk-engine-service"
  PYTHONPATH=. uvicorn api.main:app --host 127.0.0.1 --port 8010 > "$ROOT_DIR/risk-engine.log" 2>&1
) &
RISK_ENGINE_PID=$!

echo "[4/5] Starting unified API on 8020"
(
  cd "$ROOT_DIR"
  export PYTHONPATH="support_services/cyber-risk/unified-assessment-api/app:integrator/cyber-risk/pipeline:integrator/cyber-risk/orchestrators:integrator/cyber-risk:integrator/cyber-risk/engine_client:mcp_services/cyber-risk/breach-stats:agents/cyber-risk/threat-actor-agent/service:agents/cyber-risk/scenario-selection-agent/service:agents/cyber-risk/explanation-agent/service:agents/cyber-risk/narrative-agent/service:agents/cyber-risk/risk-advisor-agent/service"
  uvicorn main:app --app-dir support_services/cyber-risk/unified-assessment-api/app --host 127.0.0.1 --port 8020 > "$ROOT_DIR/unified-api.log" 2>&1
) &
UNIFIED_API_PID=$!

echo "[5/5] Starting frontend on 5173"
(
  cd "$ROOT_DIR/cyber-risk-frontend"
  npm run dev -- --host 127.0.0.1 > "$ROOT_DIR/cyber-risk-frontend.log" 2>&1
) &
FRONTEND_PID=$!

sleep 5

echo
echo "Stack started:"
echo "  Risk engine:   http://127.0.0.1:8010"
echo "  Unified API:   http://127.0.0.1:8020"
echo "  Frontend:      http://127.0.0.1:5173"
echo
echo "PIDs:"
echo "  risk-engine    $RISK_ENGINE_PID"
echo "  unified-api    $UNIFIED_API_PID"
echo "  frontend       $FRONTEND_PID"
echo
echo "Logs:"
echo "  risk-engine.log"
echo "  unified-api.log"
echo "  cyber-risk-frontend.log"
