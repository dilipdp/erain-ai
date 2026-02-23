"""initial e2i schema

Revision ID: 20260223_0001
Revises:
Create Date: 2026-02-23 11:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260223_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names() -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return set(inspector.get_table_names())


def _create_index_if_missing(name: str, table_name: str, columns: list[str], unique: bool = False) -> None:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return
    existing = {idx["name"] for idx in inspector.get_indexes(table_name)}
    if name in existing:
        return
    op.create_index(name, table_name, columns, unique=unique)


def upgrade() -> None:
    bind = op.get_bind()
    existing = _table_names()

    if "organizations" not in existing:
        op.create_table(
            "organizations",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("legal_name", sa.String(length=300), nullable=True),
            sa.Column("domain", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_organizations_name", "organizations", ["name"])
    _create_index_if_missing("ix_organizations_domain", "organizations", ["domain"])

    existing = _table_names()
    if "dataset_snapshots" not in existing:
        op.create_table(
            "dataset_snapshots",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("source_system", sa.String(length=100), nullable=True),
            sa.Column("scope_summary", sa.String(length=500), nullable=True),
            sa.Column("hash_sha256", sa.String(length=64), nullable=False),
            sa.Column("data_reliability_score", sa.Float(), nullable=True),
            sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "hash_sha256", name="uq_snapshot_org_hash"),
        )
    _create_index_if_missing("ix_dataset_snapshots_organization_id", "dataset_snapshots", ["organization_id"])
    _create_index_if_missing("ix_dataset_snapshots_hash_sha256", "dataset_snapshots", ["hash_sha256"])

    existing = _table_names()
    if "decision_records" not in existing:
        op.create_table(
            "decision_records",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("snapshot_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("title", sa.String(length=240), nullable=False),
            sa.Column("reasoning_summary", sa.Text(), nullable=False),
            sa.Column("evidence_reference", sa.String(length=500), nullable=True),
            sa.Column("authority_tier", sa.String(length=60), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False),
            sa.Column("approved_by", sa.String(length=120), nullable=True),
            sa.Column("approver_role", sa.String(length=60), nullable=True),
            sa.Column("approval_note", sa.Text(), nullable=True),
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["snapshot_id"], ["dataset_snapshots.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_decision_records_organization_id", "decision_records", ["organization_id"])
    _create_index_if_missing("ix_decision_records_snapshot_id", "decision_records", ["snapshot_id"])
    _create_index_if_missing("ix_decision_records_status", "decision_records", ["status"])

    existing = _table_names()
    if "roi_attributions" not in existing:
        op.create_table(
            "roi_attributions",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("snapshot_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("category", sa.String(length=60), nullable=False),
            sa.Column("attribution_level", sa.String(length=30), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False),
            sa.Column("currency", sa.String(length=10), nullable=False),
            sa.Column("baseline_value", sa.Float(), nullable=False),
            sa.Column("current_value", sa.Float(), nullable=False),
            sa.Column("volume", sa.Float(), nullable=False),
            sa.Column("period_days", sa.Integer(), nullable=False),
            sa.Column("confidence_score", sa.Float(), nullable=False),
            sa.Column("raw_impact_value", sa.Float(), nullable=False),
            sa.Column("confidence_adjusted_impact_value", sa.Float(), nullable=False),
            sa.Column("assumptions", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["decision_id"], ["decision_records.id"], ondelete="RESTRICT"),
            sa.ForeignKeyConstraint(["snapshot_id"], ["dataset_snapshots.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("ix_roi_attributions_organization_id", "roi_attributions", ["organization_id"])
    _create_index_if_missing("ix_roi_attributions_decision_id", "roi_attributions", ["decision_id"])
    _create_index_if_missing("ix_roi_attributions_snapshot_id", "roi_attributions", ["snapshot_id"])
    _create_index_if_missing("ix_roi_attributions_category", "roi_attributions", ["category"])
    _create_index_if_missing("ix_roi_attributions_attribution_level", "roi_attributions", ["attribution_level"])
    _create_index_if_missing("ix_roi_attributions_status", "roi_attributions", ["status"])

    existing = _table_names()
    if "audit_events" not in existing:
        op.create_table(
            "audit_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("event_type", sa.String(length=120), nullable=False),
            sa.Column("actor_id", sa.String(length=120), nullable=False),
            sa.Column("correlation_id", sa.String(length=120), nullable=False),
            sa.Column("causation_id", sa.String(length=120), nullable=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("snapshot_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("entity_type", sa.String(length=60), nullable=True),
            sa.Column("entity_id", sa.String(length=120), nullable=True),
            sa.Column("payload", sa.JSON(), nullable=False),
            sa.Column("validation_error_code", sa.String(length=80), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("event_hash", sa.String(length=64), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.CheckConstraint("char_length(event_hash) = 64", name="ck_audit_event_hash_len"),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["decision_id"], ["decision_records.id"], ondelete="RESTRICT"),
            sa.ForeignKeyConstraint(["snapshot_id"], ["dataset_snapshots.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("event_hash", name="uq_audit_event_hash"),
        )
    _create_index_if_missing("ix_audit_events_organization_id", "audit_events", ["organization_id"])
    _create_index_if_missing("ix_audit_events_event_type", "audit_events", ["event_type"])
    _create_index_if_missing("ix_audit_events_correlation_id", "audit_events", ["correlation_id"])
    _create_index_if_missing("ix_audit_events_decision_id", "audit_events", ["decision_id"])
    _create_index_if_missing("ix_audit_events_snapshot_id", "audit_events", ["snapshot_id"])
    _create_index_if_missing("ix_audit_events_event_hash", "audit_events", ["event_hash"])

    if bind.dialect.name == "postgresql":
        op.execute(
            """
            CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'audit_events are immutable and append-only';
            END;
            $$ LANGUAGE plpgsql;
            """
        )
        op.execute("DROP TRIGGER IF EXISTS trg_audit_events_no_update ON audit_events;")
        op.execute("DROP TRIGGER IF EXISTS trg_audit_events_no_delete ON audit_events;")
        op.execute(
            """
            CREATE TRIGGER trg_audit_events_no_update
            BEFORE UPDATE ON audit_events
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_event_mutation();
            """
        )
        op.execute(
            """
            CREATE TRIGGER trg_audit_events_no_delete
            BEFORE DELETE ON audit_events
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_event_mutation();
            """
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TRIGGER IF EXISTS trg_audit_events_no_update ON audit_events;")
        op.execute("DROP TRIGGER IF EXISTS trg_audit_events_no_delete ON audit_events;")
        op.execute("DROP FUNCTION IF EXISTS prevent_audit_event_mutation();")

    existing = _table_names()
    for table_name in ["audit_events", "roi_attributions", "decision_records", "dataset_snapshots", "organizations"]:
        if table_name in existing:
            op.drop_table(table_name)
            existing.remove(table_name)
