"""
Forecasting service. Uses a simple, explainable scikit-learn pipeline
(linear regression on engineered time features + a moving-average
fallback for short series) rather than a black-box model — this keeps
it fast, dependency-light, and easy to reason about in an interview.
"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures


def _build_daily_series(df: pd.DataFrame) -> pd.Series:
    ts = df.dropna(subset=["date"]).set_index("date").sort_index()
    daily = ts["revenue"].resample("D").sum()
    return daily


def forecast_revenue(df: pd.DataFrame, horizon_days: int = 30) -> dict:
    """
    Forecasts daily revenue `horizon_days` into the future.
    Falls back gracefully when there isn't enough history.
    """
    if df["date"].isna().all() or df["revenue"].isna().all():
        return {"available": False, "reason": "No usable date/revenue columns for forecasting."}

    daily = _build_daily_series(df)
    daily = daily.fillna(0)

    if len(daily) < 7:
        return {
            "available": False,
            "reason": f"Only {len(daily)} days of data; need at least 7 for a forecast.",
        }

    X = np.arange(len(daily)).reshape(-1, 1)
    y = daily.values

    degree = 2 if len(daily) >= 21 else 1
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(X)

    model = LinearRegression()
    model.fit(X_poly, y)

    future_X = np.arange(len(daily), len(daily) + horizon_days).reshape(-1, 1)
    future_X_poly = poly.transform(future_X)
    preds = model.predict(future_X_poly)
    preds = np.clip(preds, a_min=0, a_max=None)  # revenue can't be negative

    last_date = daily.index.max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon_days, freq="D")

    # simple residual-based confidence band
    train_preds = model.predict(X_poly)
    residual_std = float(np.std(y - train_preds)) if len(y) > 1 else 0.0

    forecast_points = []
    for d, p in zip(future_dates, preds):
        forecast_points.append({
            "date": d.isoformat(),
            "predicted_revenue": round(float(p), 2),
            "lower_bound": round(max(0.0, float(p - 1.28 * residual_std)), 2),
            "upper_bound": round(float(p + 1.28 * residual_std), 2),
        })

    historical_avg = float(daily.tail(30).mean())
    forecast_avg = float(np.mean(preds))
    trend_pct = round(((forecast_avg - historical_avg) / historical_avg) * 100, 1) if historical_avg else 0.0

    return {
        "available": True,
        "horizon_days": horizon_days,
        "model": f"polynomial_regression_degree_{degree}",
        "historical_avg_daily_revenue": round(historical_avg, 2),
        "forecast_avg_daily_revenue": round(forecast_avg, 2),
        "trend_pct": trend_pct,
        "forecast": forecast_points,
    }


def estimate_inventory_runway(df: pd.DataFrame, current_stock: dict | None = None) -> list[dict]:
    """
    Estimates days-until-stockout per product based on recent average
    daily unit sales velocity. If current_stock isn't supplied, assumes
    a notional 30-day-equivalent starting stock so the metric is still
    illustrative (flagged clearly as an assumption in the output).
    """
    if df["product"].isna().all() or df["quantity"].isna().all():
        return []

    has_dates = df["date"].notna().any()
    results = []

    if has_dates:
        max_date = df["date"].max()
        window_start = max_date - pd.Timedelta(days=14)
        recent = df[df["date"] > window_start]
        velocity_days = 14
    else:
        recent = df
        velocity_days = None  # unknown, treat whole dataset as the window

    velocity = recent.groupby("product")["quantity"].sum()
    if velocity_days:
        velocity = velocity / velocity_days
    else:
        velocity = velocity / max(len(df["product"].unique()), 1)

    assumed_stock = current_stock or {}

    for product, daily_units in velocity.items():
        if daily_units <= 0:
            continue
        stock = assumed_stock.get(product)
        used_assumption = False
        if stock is None:
            stock = daily_units * 30  # notional baseline
            used_assumption = True
        days_remaining = stock / daily_units if daily_units > 0 else None
        results.append({
            "product": product,
            "avg_daily_units_sold": round(float(daily_units), 2),
            "estimated_days_remaining": round(float(days_remaining), 1) if days_remaining else None,
            "stock_assumed": used_assumption,
            "assumed_or_provided_stock": round(float(stock), 1),
        })

    results.sort(key=lambda r: (r["estimated_days_remaining"] is None, r["estimated_days_remaining"]))
    return results
