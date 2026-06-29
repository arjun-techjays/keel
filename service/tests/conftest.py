"""Make ``app.render`` importable when pytest runs from anywhere.

The render module is standalone (stdlib + lazy python-docx), so the tests only need
the service root on sys.path — no Supabase env, no service config.
"""

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent  # .../service
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))
