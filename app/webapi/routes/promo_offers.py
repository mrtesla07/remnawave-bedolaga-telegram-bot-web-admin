from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.crud.discount_offer import (
    count_discount_offers,
    get_offer_by_id,
    list_discount_offers,
    upsert_discount_offer,
)
from app.database.crud.promo_offer_log import list_promo_offer_logs
from app.database.crud.promo_offer_template import (
    get_promo_offer_template_by_id,
    list_promo_offer_templates,
    update_promo_offer_template,
)
from app.database.models import PromoOfferTemplate
from app.database.crud.promo_offer_log import log_promo_offer_action
from app.database.models import DiscountOffer, PromoOfferLog, PromoOfferTemplate, Subscription, User
from app.database.crud.user import get_user_by_id as crud_get_user_by_id, get_user_by_telegram_id as crud_get_user_by_telegram_id

from ..dependencies import get_db_session, require_api_token
from ..schemas.promo_offers import (
    PromoOfferCreateRequest,
    PromoOfferListResponse,
    PromoOfferLogListResponse,
    PromoOfferLogOfferInfo,
    PromoOfferLogResponse,
    PromoOfferResponse,
    PromoOfferSubscriptionInfo,
    PromoOfferTemplateListResponse,
    PromoOfferTemplateResponse,
    PromoOfferTemplateUpdateRequest,
    PromoOfferTemplateCreateRequest,
    PromoOfferUserInfo,
)

router = APIRouter()


def _serialize_user(user: Optional[User]) -> Optional[PromoOfferUserInfo]:
    if not user:
        return None

    return PromoOfferUserInfo(
        id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=getattr(user, "full_name", None),
    )


def _serialize_subscription(subscription: Optional[Subscription]) -> Optional[PromoOfferSubscriptionInfo]:
    if not subscription:
        return None

    return PromoOfferSubscriptionInfo(
        id=subscription.id,
        status=subscription.status,
        is_trial=subscription.is_trial,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        autopay_enabled=subscription.autopay_enabled,
    )


def _serialize_offer(offer: DiscountOffer) -> PromoOfferResponse:
    return PromoOfferResponse(
        id=offer.id,
        user_id=offer.user_id,
        subscription_id=offer.subscription_id,
        notification_type=offer.notification_type,
        discount_percent=offer.discount_percent,
        bonus_amount_kopeks=offer.bonus_amount_kopeks,
        expires_at=offer.expires_at,
        claimed_at=offer.claimed_at,
        is_active=offer.is_active,
        effect_type=offer.effect_type,
        extra_data=offer.extra_data or {},
        created_at=offer.created_at,
        updated_at=offer.updated_at,
        user=_serialize_user(getattr(offer, "user", None)),
        subscription=_serialize_subscription(getattr(offer, "subscription", None)),
    )


def _serialize_template(template: PromoOfferTemplate) -> PromoOfferTemplateResponse:
    return PromoOfferTemplateResponse(
        id=template.id,
        name=template.name,
        offer_type=template.offer_type,
        message_text=template.message_text,
        button_text=template.button_text,
        valid_hours=template.valid_hours,
        discount_percent=template.discount_percent,
        bonus_amount_kopeks=template.bonus_amount_kopeks,
        active_discount_hours=template.active_discount_hours,
        test_duration_hours=template.test_duration_hours,
        test_squad_uuids=[str(uuid) for uuid in (template.test_squad_uuids or [])],
        is_active=template.is_active,
        created_by=template.created_by,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


def _build_log_response(entry: PromoOfferLog) -> PromoOfferLogResponse:
    user_info = _serialize_user(getattr(entry, "user", None))

    offer = getattr(entry, "offer", None)
    offer_info: Optional[PromoOfferLogOfferInfo] = None
    if offer:
        offer_info = PromoOfferLogOfferInfo(
            id=offer.id,
            notification_type=offer.notification_type,
            discount_percent=offer.discount_percent,
            bonus_amount_kopeks=offer.bonus_amount_kopeks,
            effect_type=offer.effect_type,
            expires_at=offer.expires_at,
            claimed_at=offer.claimed_at,
            is_active=offer.is_active,
        )

    return PromoOfferLogResponse(
        id=entry.id,
        user_id=entry.user_id,
        offer_id=entry.offer_id,
        action=entry.action,
        source=entry.source,
        percent=entry.percent,
        effect_type=entry.effect_type,
        details=entry.details or {},
        created_at=entry.created_at,
        user=user_info,
        offer=offer_info,
    )


@router.get("", response_model=PromoOfferListResponse)
async def list_promo_offers(
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = Query(None, ge=1),
    notification_type: Optional[str] = Query(None, min_length=1),
    is_active: Optional[bool] = Query(None),
) -> PromoOfferListResponse:
    offers = await list_discount_offers(
        db,
        offset=offset,
        limit=limit,
        user_id=user_id,
        notification_type=notification_type,
        is_active=is_active,
    )
    total = await count_discount_offers(
        db,
        user_id=user_id,
        notification_type=notification_type,
        is_active=is_active,
    )

    return PromoOfferListResponse(
        items=[_serialize_offer(offer) for offer in offers],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=PromoOfferResponse, status_code=status.HTTP_201_CREATED)
async def create_promo_offer(
    payload: PromoOfferCreateRequest,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferResponse:
    if payload.discount_percent < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "discount_percent must be non-negative")
    if payload.bonus_amount_kopeks < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bonus_amount_kopeks must be non-negative")
    if payload.valid_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "valid_hours must be positive")
    if not payload.notification_type.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "notification_type must not be empty")
    if not payload.effect_type.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "effect_type must not be empty")

    # Accept either internal user_id or Telegram ID in user_id field for convenience
    # Support passing either internal user.id or Telegram ID in user_id field
    user = await crud_get_user_by_id(db, payload.user_id)
    if not user:
        user = await crud_get_user_by_telegram_id(db, payload.user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    actual_user_id = int(user.id)

    if payload.subscription_id is not None:
        subscription = await db.get(Subscription, payload.subscription_id)
        if not subscription:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Subscription not found")
        if subscription.user_id != actual_user_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Subscription does not belong to the user")

    offer = await upsert_discount_offer(
        db,
        user_id=actual_user_id,
        subscription_id=payload.subscription_id,
        notification_type=payload.notification_type.strip(),
        discount_percent=payload.discount_percent,
        bonus_amount_kopeks=payload.bonus_amount_kopeks,
        valid_hours=payload.valid_hours,
        effect_type=payload.effect_type,
        extra_data=payload.extra_data,
    )

    await db.refresh(offer, attribute_names=["user", "subscription"])

    # Optional immediate notification to user
    if payload.send_notification:
        try:
            from app.bot import bot as running_bot  # type: ignore
        except Exception:
            running_bot = None

        if running_bot is not None and offer.user and offer.user.telegram_id:
            try:
                # If template id is present in extra data, render button accordingly
                template_id = None
                try:
                    template_id = int((offer.extra_data or {}).get("template_id"))
                except Exception:
                    template_id = None

                if template_id is not None:
                    template = await get_promo_offer_template_by_id(db, template_id)
                else:
                    template = None

                if template:
                    from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup  # type: ignore
                    from app.localization.loader import get_texts  # type: ignore
                    from app.handlers.admin.promo_offers import _render_template_text  # type: ignore

                    user_lang = getattr(offer.user, "language", "ru") or "ru"
                    message_text = _render_template_text(template, user_lang)
                    keyboard = InlineKeyboardMarkup(
                        inline_keyboard=[[InlineKeyboardButton(text=template.button_text, callback_data=f"claim_discount_{offer.id}")]]
                    )
                    try:
                        await running_bot.send_message(offer.user.telegram_id, message_text, reply_markup=keyboard, parse_mode="HTML")
                    except Exception:
                        pass
                else:
                    # Fallback: simple text notification in Russian
                    try:
                        await running_bot.send_message(
                            offer.user.telegram_id,
                            f"🎁 Новое промо‑предложение: скидка {offer.discount_percent}% действует до {offer.expires_at:%d.%m.%Y %H:%M}",
                        )
                    except Exception:
                        pass
            except Exception:
                pass

    return _serialize_offer(offer)


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_promo_offer(
    offer_id: int,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    offer = await get_offer_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Promo offer not found")

    # Soft-delete: deactivate and log
    offer.is_active = False
    await db.commit()
    try:
        await log_promo_offer_action(
            db,
            user_id=offer.user_id,
            offer_id=offer.id,
            action="disabled",
            source=offer.notification_type,
            percent=offer.discount_percent,
            effect_type=offer.effect_type,
            details={"reason": "offer_deleted"},
        )
    except Exception:
        try:
            await db.rollback()
        except Exception:
            pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/logs", response_model=PromoOfferLogListResponse)
async def get_promo_offer_logs(
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = Query(None, ge=1),
    offer_id: Optional[int] = Query(None, ge=1),
    action: Optional[str] = Query(None, min_length=1),
    source: Optional[str] = Query(None, min_length=1),
) -> PromoOfferLogListResponse:
    logs, total = await list_promo_offer_logs(
        db,
        offset=offset,
        limit=limit,
        user_id=user_id,
        offer_id=offer_id,
        action=action,
        source=source,
    )

    return PromoOfferLogListResponse(
        items=[_build_log_response(entry) for entry in logs],
        total=int(total),
        limit=limit,
        offset=offset,
    )


@router.get("/templates", response_model=PromoOfferTemplateListResponse)
async def list_promo_offer_templates_endpoint(
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferTemplateListResponse:
    templates = await list_promo_offer_templates(db)
    return PromoOfferTemplateListResponse(items=[_serialize_template(template) for template in templates])


@router.get("/templates/{template_id}", response_model=PromoOfferTemplateResponse)
async def get_promo_offer_template_endpoint(
    template_id: int,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferTemplateResponse:
    template = await get_promo_offer_template_by_id(db, template_id)
    if not template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Promo offer template not found")
    return _serialize_template(template)


@router.patch("/templates/{template_id}", response_model=PromoOfferTemplateResponse)
async def update_promo_offer_template_endpoint(
    template_id: int,
    payload: PromoOfferTemplateUpdateRequest,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferTemplateResponse:
    template = await get_promo_offer_template_by_id(db, template_id)
    if not template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Promo offer template not found")

    if payload.valid_hours is not None and payload.valid_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "valid_hours must be positive")
    if payload.active_discount_hours is not None and payload.active_discount_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "active_discount_hours must be positive")
    if payload.test_duration_hours is not None and payload.test_duration_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "test_duration_hours must be positive")
    if payload.discount_percent is not None and payload.discount_percent < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "discount_percent must be non-negative")
    if payload.bonus_amount_kopeks is not None and payload.bonus_amount_kopeks < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bonus_amount_kopeks must be non-negative")

    if payload.test_squad_uuids is not None:
        normalized_squads = [str(uuid).strip() for uuid in payload.test_squad_uuids if str(uuid).strip()]
    else:
        normalized_squads = None

    updated_template = await update_promo_offer_template(
        db,
        template,
        name=payload.name,
        message_text=payload.message_text,
        button_text=payload.button_text,
        valid_hours=payload.valid_hours,
        discount_percent=payload.discount_percent,
        bonus_amount_kopeks=payload.bonus_amount_kopeks,
        active_discount_hours=payload.active_discount_hours,
        test_duration_hours=payload.test_duration_hours,
        test_squad_uuids=normalized_squads,
        is_active=payload.is_active,
    )

    return _serialize_template(updated_template)


@router.post("/templates", response_model=PromoOfferTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_promo_offer_template_endpoint(
    payload: PromoOfferTemplateCreateRequest,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferTemplateResponse:
    if payload.valid_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "valid_hours must be positive")
    if payload.active_discount_hours is not None and payload.active_discount_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "active_discount_hours must be positive")
    if payload.test_duration_hours is not None and payload.test_duration_hours <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "test_duration_hours must be positive")
    if payload.discount_percent < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "discount_percent must be non-negative")
    if payload.bonus_amount_kopeks < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bonus_amount_kopeks must be non-negative")

    template = PromoOfferTemplate(
        name=payload.name,
        offer_type=payload.offer_type,
        message_text=payload.message_text,
        button_text=payload.button_text,
        valid_hours=payload.valid_hours,
        discount_percent=payload.discount_percent,
        bonus_amount_kopeks=payload.bonus_amount_kopeks,
        active_discount_hours=payload.active_discount_hours,
        test_duration_hours=payload.test_duration_hours,
        test_squad_uuids=list(payload.test_squad_uuids or []),
        is_active=payload.is_active if payload.is_active is not None else True,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)
    return _serialize_template(template)


@router.get("/{offer_id}", response_model=PromoOfferResponse)
async def get_promo_offer_endpoint(
    offer_id: int,
    _: Any = Security(require_api_token),
    db: AsyncSession = Depends(get_db_session),
) -> PromoOfferResponse:
    offer = await get_offer_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Promo offer not found")

    return _serialize_offer(offer)
