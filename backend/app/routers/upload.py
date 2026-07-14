import io
import json
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.db import get_db, Dataset, SalesRecord
from app.services.cleaning import clean_dataset
from app.services.supabase_auth import get_current_user_optional, CurrentUser
from app.config import settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
):
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, detail=f"Unsupported file type '{ext}'. Upload a .csv or .xlsx file.")

    raw_bytes = await file.read()
    if len(raw_bytes) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit.")

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(raw_bytes))
        else:
            df = pd.read_excel(io.BytesIO(raw_bytes))
    except Exception as e:
        raise HTTPException(400, detail=f"Could not parse file: {e}")

    if df.empty:
        raise HTTPException(400, detail="The uploaded file has no rows.")

    cleaned_df, report = clean_dataset(df)

    if cleaned_df.empty:
        raise HTTPException(
            422,
            detail=f"After cleaning, no usable rows remained. Report: {json.dumps(report)}",
        )

    dataset = Dataset(
        user_id=current_user.id if current_user else None,
        filename=filename,
        row_count=len(cleaned_df),
        column_count=len(df.columns),
        cleaning_report=json.dumps(report, default=str),
    )
    db.add(dataset)
    db.flush()  # get dataset.id

    records = []
    for _, row in cleaned_df.iterrows():
        records.append(SalesRecord(
            dataset_id=dataset.id,
            date=row["date"] if pd.notna(row["date"]) else None,
            region=row["region"] if pd.notna(row["region"]) else None,
            product=row["product"] if pd.notna(row["product"]) else None,
            category=row["category"] if pd.notna(row["category"]) else None,
            customer=row["customer"] if pd.notna(row["customer"]) else None,
            quantity=float(row["quantity"]) if pd.notna(row["quantity"]) else None,
            revenue=float(row["revenue"]) if pd.notna(row["revenue"]) else None,
            cost=float(row["cost"]) if pd.notna(row["cost"]) else None,
            profit=float(row["profit"]) if pd.notna(row["profit"]) else None,
            is_anomaly=int(row["is_anomaly"]),
        ))
    db.bulk_save_objects(records)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "filename": filename,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "cleaning_report": report,
    }
