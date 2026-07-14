import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.db import get_db, Dataset
from app.services.supabase_auth import get_current_user_optional, CurrentUser

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("")
def list_datasets(
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
):
    query = db.query(Dataset)
    if current_user:
        # Logged-in users only see their own datasets.
        query = query.filter(Dataset.user_id == current_user.id)
    else:
        # No auth configured / not logged in: local-dev behavior, show
        # datasets that were uploaded without a user (user_id is null) only.
        query = query.filter(Dataset.user_id.is_(None))

    datasets = query.order_by(Dataset.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "uploaded_at": d.uploaded_at.isoformat(),
            "row_count": d.row_count,
            "column_count": d.column_count,
        }
        for d in datasets
    ]


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
):
    """Full details for a single dataset — same shape as the upload response,
    so the frontend can jump straight to the dashboard when picking a
    previously-uploaded dataset from the list."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(404, detail="Dataset not found.")
    if current_user and dataset.user_id != current_user.id:
        raise HTTPException(404, detail="Dataset not found.")
    if not current_user and dataset.user_id is not None:
        raise HTTPException(404, detail="Dataset not found.")

    return {
        "dataset_id": dataset.id,
        "filename": dataset.filename,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "cleaning_report": json.loads(dataset.cleaning_report) if dataset.cleaning_report else {},
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(404, detail="Dataset not found.")
    if current_user and dataset.user_id != current_user.id:
        raise HTTPException(404, detail="Dataset not found.")  # don't reveal it exists
    db.delete(dataset)
    db.commit()
    return {"deleted": dataset_id}
