"""
LLM insight generation. We don't hand the model raw rows — we hand it
the already-computed KPIs/aggregations (much cheaper, more reliable,
and avoids leaking large datasets into the prompt). The LLM's job is
purely narrative: turn numbers into a prioritized list of plain-English
findings and recommendations.

Falls back to a deterministic rule-based generator if no API key is
configured, so the app is still fully demoable without OpenAI billing.
"""
import json
from openai import OpenAI
from app.config import settings

_client = None


def _get_client() -> OpenAI | None:
    global _client
    key = settings.OPENAI_API_KEY
    if not key or key.startswith("sk-your-key") or key == "sk-your-key-here":
        return None
    if _client is None:
        try:
            _client = OpenAI(api_key=key)
        except Exception:
            return None
    return _client


SYSTEM_PROMPT = """You are a senior business intelligence analyst. You will be given \
JSON-summarized sales analytics (KPIs, regional performance, product performance, \
a revenue forecast, and inventory runway estimates). Produce concise, decision-useful \
insights for a busy executive.

Rules:
- Return STRICT JSON only, an array of objects, no prose, no markdown fences.
- Each object: {"category": "risk"|"opportunity"|"forecast"|"inventory", \
"severity": "info"|"warning"|"critical"|"positive", "text": "one sentence, specific, with numbers"}
- Use the actual numbers given to you. Never invent figures not derivable from the data.
- Prioritize: declining regions/products, stockout risk, and notable forecast trends.
- Treat any region/product/category named "Unknown" as missing data, not a real business \
entity — never call it out as the best or worst performer.
- 4 to 7 insights total. No filler insights.
"""


def _rule_based_fallback(analytics_payload: dict) -> list[dict]:
    """Deterministic insight generation when no LLM is configured."""
    insights = []
    kpis = analytics_payload.get("kpis", {})
    regions = analytics_payload.get("regional_performance", [])
    products = analytics_payload.get("product_performance", [])
    forecast = analytics_payload.get("forecast", {})
    inventory = analytics_payload.get("inventory", [])

    if kpis.get("revenue_change_pct_30d") is not None:
        change = kpis["revenue_change_pct_30d"]
        if change < -5:
            insights.append({
                "category": "risk", "severity": "critical",
                "text": f"Revenue is down {abs(change)}% over the last 30 days compared to the prior period.",
            })
        elif change > 5:
            insights.append({
                "category": "opportunity", "severity": "positive",
                "text": f"Revenue grew {change}% over the last 30 days compared to the prior period.",
            })

    if regions:
        real_regions = [r for r in regions if r["region"] != "Unknown"]
        if len(real_regions) > 1:
            worst = real_regions[-1]
            best = real_regions[0]
            insights.append({
                "category": "risk", "severity": "warning",
                "text": f"{worst['region']} is the weakest region with ${worst['revenue']:,.0f} in revenue, "
                        f"versus ${best['revenue']:,.0f} in the top region, {best['region']}.",
            })

    if products:
        top = products[0]
        insights.append({
            "category": "opportunity", "severity": "positive",
            "text": f"{top['product']} is the top-selling product, generating ${top['revenue']:,.0f} in revenue.",
        })

    if forecast.get("available"):
        trend = forecast["trend_pct"]
        direction = "increase" if trend >= 0 else "decline"
        insights.append({
            "category": "forecast", "severity": "warning" if trend < 0 else "info",
            "text": f"Forecast model projects a {abs(trend)}% {direction} in average daily revenue "
                    f"over the next {forecast['horizon_days']} days.",
        })

    low_stock = [i for i in inventory if i.get("estimated_days_remaining") is not None and i["estimated_days_remaining"] < 14]
    if low_stock:
        item = low_stock[0]
        insights.append({
            "category": "inventory", "severity": "critical",
            "text": f"{item['product']} is projected to run out of stock in approximately "
                    f"{item['estimated_days_remaining']:.0f} days at current sales velocity.",
        })

    if kpis.get("anomaly_count", 0) > 0:
        insights.append({
            "category": "risk", "severity": "warning",
            "text": f"{kpis['anomaly_count']} unusual transactions were flagged as statistical anomalies and may warrant review.",
        })

    if not insights:
        insights.append({
            "category": "forecast", "severity": "info",
            "text": "Not enough structured data was detected to generate specific insights. "
                    "Check that your file has date, region, product, and revenue columns.",
        })

    return insights


def generate_insights(analytics_payload: dict) -> list[dict]:
    client = _get_client()
    if client is None:
        return _rule_based_fallback(analytics_payload)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(analytics_payload, default=str)},
            ],
            temperature=0.3,
            max_tokens=900,
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(raw)
        if isinstance(parsed, list) and all("text" in i for i in parsed):
            return parsed
        return _rule_based_fallback(analytics_payload)
    except Exception as e:
        fallback = _rule_based_fallback(analytics_payload)
        fallback.insert(0, {
            "category": "system", "severity": "info",
            "text": f"AI narrative generation unavailable ({type(e).__name__}); showing rule-based insights instead.",
        })
        return fallback
