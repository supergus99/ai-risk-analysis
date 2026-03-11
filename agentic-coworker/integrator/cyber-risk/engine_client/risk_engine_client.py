import json
from urllib import request


class RiskEngineClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8010") -> None:
        self.base_url = base_url.rstrip("/")

    def score_scenario(self, payload: dict) -> dict:
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url=f"{self.base_url}/cyber-risk/score-scenario",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
