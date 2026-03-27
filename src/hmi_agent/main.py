from __future__ import annotations

import argparse


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Automotive HMI test agent")
    parser.add_argument(
        "--requirement-file",
        default="requirements/sample_requirement.md",
        help="Path to requirement markdown input",
    )
    parser.add_argument(
        "--config-file",
        default="configs/AI_Config.md",
        help="Path to AI config markdown",
    )
    parser.add_argument(
        "--output-root",
        default="runs",
        help="Directory to store run artifacts",
    )
    parser.add_argument(
        "--offline-demo",
        action="store_true",
        help="Run full pipeline without external model call",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    from .orchestrator import run_test_flow

    run_dir = run_test_flow(
        requirement_file=args.requirement_file,
        config_file=args.config_file,
        output_root=args.output_root,
        offline_demo=args.offline_demo,
    )
    print(f"Run completed: {run_dir}")


if __name__ == "__main__":
    main()
