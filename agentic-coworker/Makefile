SHELL := /bin/bash

PYTHONPATH_ALL=support_services/cyber-risk/unified-assessment-api/app:integrator/cyber-risk/pipeline:integrator/cyber-risk/orchestrators:integrator/cyber-risk:integrator/cyber-risk/engine_client:mcp_services/cyber-risk/breach-stats:agents/cyber-risk/threat-actor-agent/service:agents/cyber-risk/scenario-selection-agent/service:agents/cyber-risk/explanation-agent/service:agents/cyber-risk/narrative-agent/service:agents/cyber-risk/risk-advisor-agent/service

.PHONY: help venv install cyber-risk-test cyber-risk-api cyber-risk-health kill-8020 cyber-risk-up

help:
	@echo "Available targets:"
	@echo "  make venv              - create local virtual environment if missing"
	@echo "  make install           - install runtime/test dependencies"
	@echo "  make cyber-risk-test   - run unified assessment API tests"
	@echo "  make cyber-risk-api    - start unified assessment API on port 8020"
	@echo "  make cyber-risk-health - test the API health endpoint"
	@echo "  make kill-8020         - free port 8020 if blocked"
	@echo "  make cyber-risk-up     - kill port 8020 and start the API"

venv:
	@test -d .venv || python3 -m venv .venv
	@echo "Virtual environment ready."

install: venv
	@source .venv/bin/activate && pip install --upgrade pip && pip install fastapi uvicorn httpx pytest pydantic
	@echo "Dependencies installed."

cyber-risk-test:
	@source .venv/bin/activate && PYTHONPATH="$(PYTHONPATH_ALL)" pytest -q support_services/cyber-risk/unified-assessment-api/tests

kill-8020:
	@PIDS=$$(lsof -ti :8020); \
	if [ -n "$$PIDS" ]; then \
		echo "Killing processes on port 8020: $$PIDS"; \
		kill -9 $$PIDS; \
	else \
		echo "Port 8020 is already free."; \
	fi

cyber-risk-api:
	@source .venv/bin/activate && PYTHONPATH="$(PYTHONPATH_ALL)" uvicorn main:app --reload --app-dir support_services/cyber-risk/unified-assessment-api/app --port 8020

cyber-risk-health:
	@curl -s http://127.0.0.1:8020/health | python3 -m json.tool

cyber-risk-up: kill-8020
	@source .venv/bin/activate && PYTHONPATH="$(PYTHONPATH_ALL)" uvicorn main:app --reload --app-dir support_services/cyber-risk/unified-assessment-api/app --port 8020

.PHONY: cyber-risk-run-smb

cyber-risk-run-smb:
	@curl -s -X POST \
	http://127.0.0.1:8020/cyber-risk/run-assessment \
	-H "Content-Type: application/json" \
	--data @support_services/cyber-risk/unified-assessment-api/examples/run-assessment.request.json | python3 -m json.tool
