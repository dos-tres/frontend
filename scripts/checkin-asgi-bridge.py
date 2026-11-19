"""Run the real sibling FastAPI app without opening a TCP port (verification only)."""
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app

request = json.load(sys.stdin)
with TestClient(create_app(Settings(_env_file=None, database_url="")), raise_server_exceptions=False) as client:
    response = client.request(request["method"], request["path"], content=request.get("body"), headers=request.get("headers", {}))
    print(json.dumps({"status": response.status_code, "body": response.json()}, ensure_ascii=False))
