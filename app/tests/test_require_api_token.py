import os
import asyncio
import unittest
from pathlib import Path
from uuid import uuid4

os.environ.setdefault("BOT_TOKEN", "test-token")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./tests/test_admin.db")
os.environ.setdefault("DATABASE_MODE", "sqlite")
os.environ.setdefault("ADMIN_IDS", "")

from fastapi import Depends, FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database.database import AsyncSessionLocal, close_db, init_db  # noqa: E402
from app.database.models import AdminUser  # noqa: E402
from app.webapi.dependencies import require_api_token  # noqa: E402
from app.webapi.routes.auth import _create_jwt, JWT_SECRET  # noqa: E402

DB_PATH = Path("./tests/test_admin.db")


async def _create_admin(username: str) -> tuple[int, str]:
    async with AsyncSessionLocal() as session:
        admin = AdminUser(username=username, password_hash="dummy-hash")
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        token = _create_jwt({"sub": admin.id, "username": admin.username}, JWT_SECRET, exp_minutes=10)
        return admin.id, token


async def _remove_admin(admin_id: int) -> None:
    async with AsyncSessionLocal() as session:
        admin = await session.get(AdminUser, admin_id)
        if admin is None:
            return
        await session.delete(admin)
        await session.commit()


class RequireApiTokenTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if DB_PATH.exists():
            DB_PATH.unlink()
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        asyncio.run(init_db())

        app = FastAPI()

        @app.get("/protected")
        async def protected(actor=Depends(require_api_token)):
            return {"user": actor.name}

        cls._client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        try:
            cls._client.close()
        except Exception:
            pass
        asyncio.run(close_db())
        if DB_PATH.exists():
            DB_PATH.unlink()

    def test_jwt_invalid_after_admin_deleted(self) -> None:
        username = f"tester_{uuid4().hex[:8]}"
        admin_id, token = asyncio.run(_create_admin(username))
        try:
            ok = self._client.get("/protected", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(ok.status_code, 200)

            asyncio.run(_remove_admin(admin_id))

            unauthorized = self._client.get("/protected", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(unauthorized.status_code, 401)
        finally:
            asyncio.run(_remove_admin(admin_id))


if __name__ == "__main__":
    unittest.main()
