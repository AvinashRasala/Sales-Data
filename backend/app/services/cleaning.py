"""
Data cleaning + normalization service.

Takes a raw uploaded CSV/Excel file and:
  1. Infers which columns map to our canonical schema (date, region, product, etc.)
  2. Handles missing values
  3. Removes duplicates
  4. Fixes inconsistent formatting (dates, currency strings, casing)
  5. Returns a cleaned DataFrame + a human-readable report of what was done
"""
import pandas as pd
import numpy as np
import re
from difflib import get_close_matches

# Canonical column names we try to map incoming headers onto
CANONICAL_COLUMNS = {
    "date": ["date", "order date", "sale date", "transaction date", "order_date", "day"],
    "region": ["region", "area", "territory", "zone", "location", "state", "country"],
    "product": ["product", "item", "product name", "sku", "product_name"],
    "category": ["category", "product category", "segment", "type"],
    "customer": ["customer", "customer name", "client", "buyer", "customer_name"],
    "quantity": ["quantity", "qty", "units", "units sold", "unit sold", "amount sold"],
    "revenue": ["revenue", "sales", "total sales", "amount", "total revenue", "sale amount", "price total"],
    "cost": ["cost", "total cost", "cogs", "unit cost total", "expense"],
    "profit": ["profit", "margin", "net profit", "gross profit"],
}


def _normalize_header(h: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", str(h).strip().lower()).strip()


def map_columns(df: pd.DataFrame) -> dict:
    """Best-effort fuzzy mapping of raw headers -> canonical fields."""
    normalized = {col: _normalize_header(col) for col in df.columns}
    mapping = {}

    for canonical, aliases in CANONICAL_COLUMNS.items():
        best_col = None
        for raw_col, norm in normalized.items():
            if norm in aliases:
                best_col = raw_col
                break
        if best_col is None:
            # fuzzy fallback
            candidates = list(normalized.values())
            match = get_close_matches(canonical, candidates, n=1, cutoff=0.6)
            if match:
                for raw_col, norm in normalized.items():
                    if norm == match[0]:
                        best_col = raw_col
                        break
        if best_col:
            mapping[canonical] = best_col

    return mapping


def _clean_currency(series: pd.Series) -> pd.Series:
    """Strip $, commas, parens-as-negative, stray whitespace from money-like columns."""
    def parse(v):
        if pd.isna(v):
            return np.nan
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip()
        neg = s.startswith("(") and s.endswith(")")
        s = re.sub(r"[^\d.\-]", "", s)
        if s in ("", "-", "."):
            return np.nan
        try:
            val = float(s)
            return -val if neg else val
        except ValueError:
            return np.nan
    return series.apply(parse)


def clean_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Main entry point. Returns (cleaned_df_in_canonical_schema, report_dict)
    """
    report = {
        "original_rows": int(len(df)),
        "original_columns": list(df.columns),
        "column_mapping": {},
        "duplicates_removed": 0,
        "missing_values_filled": {},
        "rows_dropped_unparseable_date": 0,
        "anomalies_detected": 0,
        "final_rows": 0,
        "warnings": [],
    }

    if df.empty:
        report["warnings"].append("Uploaded file contained no rows.")
        return df, report

    # 1. drop fully empty rows/cols
    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")

    # 2. map columns
    mapping = map_columns(df)
    report["column_mapping"] = mapping

    missing_required = [c for c in ("revenue",) if c not in mapping]
    if missing_required:
        report["warnings"].append(
            f"Could not confidently detect a revenue/sales column. "
            f"Detected mapping: {mapping}. Numeric KPIs may be incomplete."
        )

    canon = pd.DataFrame(index=df.index)
    for canonical, raw_col in mapping.items():
        canon[canonical] = df[raw_col]

    for col in CANONICAL_COLUMNS:
        if col not in canon.columns:
            canon[col] = np.nan

    # 3. remove duplicate rows
    before = len(canon)
    canon = canon.drop_duplicates()
    report["duplicates_removed"] = int(before - len(canon))

    # 4. parse + clean types
    if canon["date"].notna().any():
        parsed_dates = pd.to_datetime(canon["date"], errors="coerce", format="mixed")
        unparseable = parsed_dates.isna() & canon["date"].notna()
        report["rows_dropped_unparseable_date"] = int(unparseable.sum())
        canon["date"] = parsed_dates

    for money_col in ("revenue", "cost", "profit"):
        if canon[money_col].notna().any():
            canon[money_col] = _clean_currency(canon[money_col])

    if canon["quantity"].notna().any():
        canon["quantity"] = pd.to_numeric(canon["quantity"], errors="coerce")

    for text_col in ("region", "product", "category", "customer"):
        canon[text_col] = canon[text_col].astype(str).str.strip()
        canon[text_col] = canon[text_col].replace({"nan": np.nan, "": np.nan})
        # Title-case for consistency (Fixes "north", "NORTH", "North " inconsistencies)
        canon[text_col] = canon[text_col].apply(
            lambda v: v.strip().title() if isinstance(v, str) else v
        )

    # 5. handle missing values
    for col in ("revenue", "cost", "quantity"):
        n_missing = int(canon[col].isna().sum())
        if n_missing > 0 and canon[col].notna().any():
            median_val = canon[col].median()
            canon[col] = canon[col].fillna(median_val)
            report["missing_values_filled"][col] = {
                "count": n_missing,
                "strategy": "median",
                "value": round(float(median_val), 2),
            }

    for col in ("region", "product", "category", "customer"):
        n_missing = int(canon[col].isna().sum())
        if n_missing > 0:
            canon[col] = canon[col].fillna("Unknown")
            report["missing_values_filled"][col] = {
                "count": n_missing,
                "strategy": "fill_unknown",
            }

    # 6. derive profit if not present but revenue & cost are
    if canon["profit"].isna().all() and canon["revenue"].notna().any() and canon["cost"].notna().any():
        canon["profit"] = canon["revenue"] - canon["cost"]
        report["warnings"].append("Profit column was missing; derived as revenue - cost.")

    # 7. drop rows with no usable date AND no revenue (junk rows)
    junk_mask = canon["date"].isna() & canon["revenue"].isna()
    if junk_mask.any():
        canon = canon[~junk_mask]
        report["warnings"].append(f"Dropped {int(junk_mask.sum())} rows with no date and no revenue.")

    # 8. anomaly detection (IQR-based on revenue, computed per-product so a
    # normal large order for an expensive product isn't compared against
    # cheap products and flagged as extreme). Products with too few rows to
    # get a reliable IQR fall back to the global threshold.
    canon["is_anomaly"] = 0
    MIN_ROWS_FOR_PER_PRODUCT_IQR = 8

    def _iqr_bounds(series: pd.Series) -> tuple[float, float]:
        q1, q3 = series.quantile([0.25, 0.75])
        iqr = q3 - q1
        return q1 - 3 * iqr, q3 + 3 * iqr

    if canon["revenue"].notna().sum() > 4:
        global_lower, global_upper = _iqr_bounds(canon["revenue"].dropna())

        if canon["product"].notna().any():
            for product, group in canon.groupby("product"):
                revenue_vals = group["revenue"].dropna()
                if len(revenue_vals) >= MIN_ROWS_FOR_PER_PRODUCT_IQR:
                    lower, upper = _iqr_bounds(revenue_vals)
                else:
                    lower, upper = global_lower, global_upper
                mask = (canon["product"] == product) & (
                    (canon["revenue"] < lower) | (canon["revenue"] > upper)
                )
                canon.loc[mask, "is_anomaly"] = 1
        else:
            mask = (canon["revenue"] < global_lower) | (canon["revenue"] > global_upper)
            canon.loc[mask, "is_anomaly"] = 1

        report["anomalies_detected"] = int(canon["is_anomaly"].sum())

    canon = canon.reset_index(drop=True)
    report["final_rows"] = int(len(canon))

    return canon, report
