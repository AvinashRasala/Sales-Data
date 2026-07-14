from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.routers.dashboard import _load_dataframe
from app.models.db import get_db
from app.services import forecasting
from app.services.supabase_auth import get_current_user_optional, CurrentUser

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/{dataset_id}/revenue")
def get_revenue_forecast(dataset_id: int, horizon_days: int = Query(30, ge=7, le=180), db: Session = Depends(get_db),
                          current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return forecasting.forecast_revenue(df, horizon_days=horizon_days)


@router.get("/{dataset_id}/inventory")
def get_inventory_runway(dataset_id: int, db: Session = Depends(get_db),
                          current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)
    return forecasting.estimate_inventory_runway(df)
