from pathlib import Path

from service.benchmark_service import BenchmarkService


def test_get_metric_returns_value():
    repo_root = Path(__file__).resolve().parents[4]
    service = BenchmarkService(str(repo_root))

    result = service.get_metric(
        sector="Logistics",
        region="EU",
        metric_name="ransomware_event_rate"
    )

    assert result["value"] == 0.12
    assert result["metric_name"] == "ransomware_event_rate"


def test_unknown_metric_raises():
    repo_root = Path(__file__).resolve().parents[4]
    service = BenchmarkService(str(repo_root))

    try:
        service.get_metric(
            sector="Logistics",
            region="EU",
            metric_name="unknown_metric"
        )
        assert False, "Expected ValueError"
    except ValueError:
        assert True
