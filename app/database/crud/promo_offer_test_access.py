from __future__ import annotations

from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import (
    DiscountOffer,
    ServerSquad,
    Subscription,
    SubscriptionTemporaryAccess,
)


async def list_test_accesses(
    db: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None,
    user_id: Optional[int] = None,
    offer_id: Optional[int] = None,
    squad_uuid: Optional[str] = None,
) -> Tuple[List[SubscriptionTemporaryAccess], int]:
    query = (
        select(SubscriptionTemporaryAccess)
        .options(
            selectinload(SubscriptionTemporaryAccess.subscription).selectinload(Subscription.user),
            selectinload(SubscriptionTemporaryAccess.offer).selectinload(DiscountOffer.user),
        )
        .order_by(SubscriptionTemporaryAccess.created_at.desc())
    )
    count_query = select(func.count(SubscriptionTemporaryAccess.id))

    conditions = []
    if is_active is not None:
        conditions.append(SubscriptionTemporaryAccess.is_active.is_(is_active))
    if user_id is not None:
        conditions.append(SubscriptionTemporaryAccess.offer.has(DiscountOffer.user_id == user_id))
    if offer_id is not None:
        conditions.append(SubscriptionTemporaryAccess.offer_id == offer_id)
    if squad_uuid:
        conditions.append(SubscriptionTemporaryAccess.squad_uuid == squad_uuid)

    if conditions:
        query = query.where(*conditions)
        count_query = count_query.where(*conditions)

    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    accesses = result.scalars().all()

    total_result = await db.execute(count_query)
    total = int(total_result.scalar() or 0)

    return accesses, total


async def get_test_access_by_id(
    db: AsyncSession,
    access_id: int,
) -> Optional[SubscriptionTemporaryAccess]:
    stmt = (
        select(SubscriptionTemporaryAccess)
        .options(
            selectinload(SubscriptionTemporaryAccess.subscription).selectinload(Subscription.user),
            selectinload(SubscriptionTemporaryAccess.offer).selectinload(DiscountOffer.user),
        )
        .where(SubscriptionTemporaryAccess.id == access_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def load_server_squads_by_uuid(
    db: AsyncSession,
    squad_uuids: Sequence[str],
) -> Dict[str, ServerSquad]:
    clean_uuids = [uuid for uuid in {*(squad_uuids or [])} if uuid]
    if not clean_uuids:
        return {}
    stmt = select(ServerSquad).where(ServerSquad.squad_uuid.in_(clean_uuids))
    result = await db.execute(stmt)
    squads = result.scalars().all()
    return {s.squad_uuid: s for s in squads}
