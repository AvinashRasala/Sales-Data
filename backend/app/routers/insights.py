import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.routers.dashboard import _load_dataframe
from app.models.db import get_db, Insight
from app.services import analytics, forecasting, llm_insights
from app.services.supabase_auth import get_current_user_optional, CurrentUser

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/{dataset_id}")
def get_insights(dataset_id: int, db: Session = Depends(get_db),
                  current_user: CurrentUser | None = Depends(get_current_user_optional)):
    df = _load_dataframe(dataset_id, db, current_user)

    payload = {
        "kpis": analytics.compute_kpis(df),
        "regional_performance": analytics.regional_performance(df),
        "product_performance": analytics.product_performance(df),
        "forecast": forecasting.forecast_revenue(df),
        "inventory": forecasting.estimate_inventory_runway(df),
    }

    insights = llm_insights.generate_insights(payload)

    # cache them so we're not re-billing the LLM on every dashboard refresh
    db.query(Insight).filter(Insight.dataset_id == dataset_id).delete()
    for ins in insights:
        db.add(Insight(
            dataset_id=dataset_id,
            category=ins.get("category", "info"),
            severity=ins.get("severity", "info"),
            text=ins.get("text", ""),
        ))
    db.commit()

    return {"dataset_id": dataset_id, "insights": insights}
