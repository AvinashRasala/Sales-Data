import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.db import get_db, Dataset, SalesRecord
from app.services import analytics
from app.services.supabase_auth import get_current_user_optional, CurrentUser

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _get_owned_dataset(dataset_id: int, db: Session, current_user: CurrentUser | None) -> Dataset:
    """Fetches a dataset and checks ownership. Raises 404 either way if not
    found or not owned, so we don't leak which dataset IDs exist."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(404, detail="Dataset not found.")
    if current_user and dataset.user_id != current_user.id:
        raise HTTPException(404, detail="Dataset not found.")
    if not current_user and dataset.user_id is not None:
        # Not logged in, but this dataset belongs to someone — don't serve it.
        raise HTTPException(404, detail="Dataset not found.")
    return dataset


def _load_dataframe(dataset_id: int, db: Session, current_user: CurrentUser | None = None) -> pd.DataFrame:
    _get_owned_dataset(dataset_id, db, current_user)

    records = db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id).all()
    if not records:
        raise HTTPException(404, detail="Dataset has no rows.")

    df = pd.DataFrame([{
        "date": r.date,
        "region": r.region,
        "product": r.product,
        "category": r.category,
        "customer": r.customer,
        "quantity": r.quantity,
        "revenue": r.revenue,
        "cost": r.cost,
        "profit": r.profit,
        "is_anomaly": r.is_anomaly,
    } for r in records])
    df["date"] = pd.to_datetime(df["date"])
    return df


@router.get("/{dataset_id}/summary")
def get_summary(dataset_id: int, db: Session = Depends(get_db),
                 current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.compute_kpis(df)


@router.get("/{dataset_id}/trend")
def get_trend(dataset_id: int, freq: str = Query("D", regex="^[DWM]$"), db: Session = Depends(get_db),
              current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.revenue_trend(df, freq=freq)


@router.get("/{dataset_id}/regions")
def get_regions(dataset_id: int, db: Session = Depends(get_db),
                 current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.regional_performance(df)


@router.get("/{dataset_id}/products")
def get_products(dataset_id: int, top_n: int = 10, db: Session = Depends(get_db),
                  current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.product_performance(df, top_n=top_n)


@router.get("/{dataset_id}/categories")
def get_categories(dataset_id: int, db: Session = Depends(get_db),
                    current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.category_breakdown(df)


@router.get("/{dataset_id}/customers")
def get_customers(dataset_id: int, top_n: int = 10, db: Session = Depends(get_db),
                   current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.top_customers(df, top_n=top_n)


@router.get("/{dataset_id}/anomalies")
def get_anomalies(dataset_id: int, db: Session = Depends(get_db),
                   current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return analytics.anomalies(df)


@router.get("/{dataset_id}/drilldown")
def get_drilldown(
    dataset_id: int,
    region: str | None = Query(None),
    product: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_current_user_optional),
):
    """Filtered KPIs + trend for a single region or product, for the
    dashboard's click-to-drill-down interaction. Exactly one of region/product
    should be passed; if both are given, region takes precedence."""
    if not region and not product:
        raise HTTPException(400, detail="Provide a region or product to drill into.")

    df = _load_dataframe(dataset_id, db, current_user)
    if region:
        filtered = df[df["region"] == region]
        label = region
    else:
        filtered = df[df["product"] == product]
        label = product

    if filtered.empty:
        raise HTTPException(404, detail="No rows match that filter.")

    return {
        "label": label,
        "kpis": analytics.compute_kpis(filtered),
        "trend": analytics.revenue_trend(filtered, freq="D"),
        "products": analytics.product_performance(filtered, top_n=5) if region else None,
        "regions": analytics.regional_performance(filtered) if product else None,
    }


@router.get("/{dataset_id}/full")
def get_full_dashboard(dataset_id: int, db: Session = Depends(get_db),
                        current_user: CurrentUser | None = Depends(get_current_user_optional)):
    """Single call that returns everything the dashboard needs — reduces round-trips."""
    df = _load_dataframe(dataset_id, db, current_user)
    return {
        "kpis": analytics.compute_kpis(df),
        "trend": analytics.revenue_trend(df, freq="D"),
        "regions": analytics.regional_performance(df),
        "products": analytics.product_performance(df),
        "categories": analytics.category_breakdown(df),
        "customers": analytics.top_customers(df),
        "anomalies": analytics.anomalies(df),
    }
