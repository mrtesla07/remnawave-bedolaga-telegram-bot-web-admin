from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.webapi.dependencies import get_db_session, require_api_token
from app.services.admin_notification_service import AdminNotificationService


router = APIRouter()


@router.post("/test", status_code=status.HTTP_202_ACCEPTED)
async def send_test_notification(
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    try:
        from app.bot import dp
        bot = dp.bot
    except Exception:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Bot is not ready")

    service = AdminNotificationService(bot)
    ok = await service._send_message("🧪 Тестовое уведомление из веб‑админки")
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Отправка не настроена (чат/права)")
    return {"detail": "Отправлено"}


