"""Run the canonical Keel gate engine (the stdlib-Python checks) as subprocesses.

This deliberately shells out to the SAME scripts that CI and the local skills
run, so the server enforces exactly what the agent checked — no reimplementation.
"""

import os
import subprocess
import sys

from .config import settings


def _run(script: str, *args: str) -> dict:
    cmd = [sys.executable, os.path.join(settings.checks_dir, script), *args]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    except subprocess.TimeoutExpired:
        return {"ok": False, "exit_code": -1, "output": "gate timed out after 180s"}
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "output": (proc.stdout or "") + (proc.stderr or ""),
    }


def run_constitution() -> dict:
    return _run("check_constitution.py", settings.constitution_path)


def run_generate(engagement_dir: str) -> dict:
    return _run("check_generate.py", engagement_dir, settings.constitution_path)


def run_review(engagement_dir: str) -> dict:
    return _run("check_review.py", engagement_dir, settings.constitution_path)
