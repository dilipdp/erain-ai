from dataclasses import dataclass

from fastapi import Header, HTTPException


VALID_ROLES = {"FOUNDER", "ENGAGEMENT_LEAD", "OPS_LEAD", "DOMAIN_LEAD", "CLIENT_CXO"}


@dataclass(frozen=True)
class ActorContext:
    actor_id: str
    actor_role: str


def get_actor_context(
    x_actor_id: str | None = Header(default=None, alias="X-Actor-Id"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
) -> ActorContext:
    if x_actor_id is None or x_actor_role is None:
        raise HTTPException(status_code=401, detail="missing X-Actor-Id or X-Actor-Role header")

    actor_id = x_actor_id.strip()
    actor_role = x_actor_role.strip().upper()
    if not actor_id:
        raise HTTPException(status_code=401, detail="invalid actor id")
    if actor_role not in VALID_ROLES:
        raise HTTPException(status_code=403, detail=f"unsupported actor role: {actor_role}")

    return ActorContext(actor_id=actor_id, actor_role=actor_role)
