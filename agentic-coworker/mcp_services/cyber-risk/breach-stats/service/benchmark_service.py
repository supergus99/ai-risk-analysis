import json
from pathlib import Path


class BenchmarkService:
    def __init__(self, repo_root: str) -> None:
        self.repo_root = Path(repo_root)
        self.dataset = self._load_dataset()

    def _load_dataset(self) -> dict:
        path = self.repo_root / "mcp_services/cyber-risk/breach-stats/benchmarks/default-benchmarks.json"
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_metric(self, sector: str, region: str, metric_name: str) -> dict:
        for item in self.dataset["benchmarks"]:
            if (
                item["sector"] == sector
                and item["region"] == region
                and item["metric_name"] == metric_name
            ):
                return item

        raise ValueError(
            f"No benchmark found for sector={sector}, region={region}, metric_name={metric_name}"
        )
