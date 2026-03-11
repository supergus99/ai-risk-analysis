#!/usr/bin/env bash
set -e

export PYTHONPATH="support_services/cyber-risk/unified-assessment-api/app:integrator/cyber-risk/pipeline:integrator/cyber-risk/orchestrators:integrator/cyber-risk:integrator/cyber-risk/engine_client:mcp_services/cyber-risk/breach-stats:agents/cyber-risk/threat-actor-agent/service:agents/cyber-risk/scenario-selection-agent/service:agents/cyber-risk/explanation-agent/service:agents/cyber-risk/narrative-agent/service:agents/cyber-risk/risk-advisor-agent/service"

exec "$@"
