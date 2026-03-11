import json
from pathlib import Path

from unified_assessment_pipeline import UnifiedAssessmentPipeline


def main():
    repo_root = Path(__file__).resolve().parents[4]
    pipeline = UnifiedAssessmentPipeline(str(repo_root))

    result = pipeline.run("small-business-low-maturity.json")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
