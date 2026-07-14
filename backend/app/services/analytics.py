"""
Computes the aggregations the dashboard needs: KPIs, trends, regional/product
breakdowns. Pure pandas, no DB dependency, so it's easy to unit test.
"""
import pandas as pd
import numpy as np


def compute_kpis(df: pd.DataFrame) -> dict:
    total_revenue = float(df["revenue"].sum())
    total_cost = float(df["cost"].sum()) if df["cost"].notna().any() else None
    total_profit = float(df["profit"].sum()) if df["profit"].notna().any() else None
    total_quantity = float(df["quantity"].sum()) if df["quantity"].notna().any() else None

    margin_pct = None
    if total_profit is not None and total_revenue:
        margin_pct = round((total_profit / total_revenue) * 100, 2)

    # period-over-period revenue change (last 30 days vs prior 30, if dates exist)
    revenue_change_pct = None
    if df["date"].notna().any():
        df_sorted = df.dropna(subset=["date"]).sort_values("date")
        max_date = df_sorted["date"].max()
        last_30 = df_sorted[df_sorted["date"] > max_date - pd.Timedelta(days=30)]
        prior_30 = df_sorted[
            (df_sorted["date"] <= max_date - pd.Timedelta(days=30))
            & (df_sorted["date"] > max_date - pd.Timedelta(days=60))
        ]
        if len(prior_30) > 0 and prior_30["revenue"].sum() > 0:
            revenue_change_pct = round(
                ((last_30["revenue"].sum() - prior_30["revenue"].sum()) / prior_30["revenue"].sum()) * 100, 2
            )

    return {
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2) if total_cost is not None else None,
        "total_profit": round(total_profit, 2) if total_profit is not None else None,
        "profit_margin_pct": margin_pct,
        "total_units_sold": total_quantity,
        "row_count": int(len(df)),
        "anomaly_count": int(df["is_anomaly"].sum()) if "is_anomaly" in df else 0,
        "revenue_change_pct_30d": revenue_change_pct,
        "date_range": {
            "start": df["date"].min().isoformat() if df["date"].notna().any() else None,
            "end": df["date"].max().isoformat() if df["date"].notna().any() else None,
        },
    }


def revenue_trend(df: pd.DataFrame, freq: str = "D") -> list[dict]:
    """Time series of revenue, resampled by day/week/month."""
    if df["date"].isna().all():
        return []
    ts = df.dropna(subset=["date"]).set_index("date").sort_index()
    grouped = ts["revenue"].resample(freq).sum().fillna(0)
    return [{"date": d.isoformat(), "revenue": round(float(v), 2)} for d, v in grouped.items()]


def regional_performance(df: pd.DataFrame) -> list[dict]:
    if df["region"].isna().all():
        return []
    g = df.groupby("region").agg(
        revenue=("revenue", "sum"),
        profit=("profit", "sum"),
        orders=("revenue", "count"),
    ).reset_index().sort_values("revenue", ascending=False)
    return [
        {
            "region": row["region"],
            "revenue": round(float(row["revenue"]), 2),
            "profit": round(float(row["profit"]), 2) if pd.notna(row["profit"]) else None,
            "orders": int(row["orders"]),
        }
        for _, row in g.iterrows()
    ]


def product_performance(df: pd.DataFrame, top_n: int = 10) -> list[dict]:
    if df["product"].isna().all():
        return []
    g = df.groupby("product").agg(
        revenue=("revenue", "sum"),
        quantity=("quantity", "sum"),
        profit=("profit", "sum"),
    ).reset_index().sort_values("revenue", ascending=False).head(top_n)
    return [
        {
            "product": row["product"],
            "revenue": round(float(row["revenue"]), 2),
            "quantity": float(row["quantity"]) if pd.notna(row["quantity"]) else None,
            "profit": round(float(row["profit"]), 2) if pd.notna(row["profit"]) else None,
        }
        for _, row in g.iterrows()
    ]


def category_breakdown(df: pd.DataFrame) -> list[dict]:
    if df["category"].isna().all():
        return []
    g = df.groupby("category")["revenue"].sum().reset_index().sort_values("revenue", ascending=False)
    total = g["revenue"].sum()
    return [
        {
            "category": row["category"],
            "revenue": round(float(row["revenue"]), 2),
            "share_pct": round(float(row["revenue"]) / total * 100, 1) if total else 0,
        }
        for _, row in g.iterrows()
    ]


def top_customers(df: pd.DataFrame, top_n: int = 10) -> list[dict]:
    if df["customer"].isna().all() or (df["customer"] == "Unknown").all():
        return []
    g = df.groupby("customer")["revenue"].sum().reset_index().sort_values("revenue", ascending=False).head(top_n)
    return [{"customer": row["customer"], "revenue": round(float(row["revenue"]), 2)} for _, row in g.iterrows()]


def anomalies(df: pd.DataFrame, limit: int = 25) -> list[dict]:
    flagged = df[df["is_anomaly"] == 1].copy()
    if flagged.empty:
        return []
    flagged = flagged.sort_values("revenue", ascending=False).head(limit)
    out = []
    for _, row in flagged.iterrows():
        out.append({
            "date": row["date"].isoformat() if pd.notna(row["date"]) else None,
            "region": row["region"],
            "product": row["product"],
            "revenue": round(float(row["revenue"]), 2) if pd.notna(row["revenue"]) else None,
        })
    return out
