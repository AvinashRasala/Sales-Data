# Sample datasets

Two CSVs, same underlying year of synthetic sales data (2025), for demoing
different parts of the pipeline:

## `sample_sales_clean.csv`
6,100 rows, already tidy — good for showing off the dashboard, forecast, and
AI insights without the cleaning step doing anything dramatic. Realistic
seasonal pattern (Nov/Dec spike) and a steadily declining South region built
in, so the dashboard and insights have an actual story to tell.

## `sample_sales_messy.csv`
The same data, deliberately corrupted to look like a real-world export:
- Inconsistent region/product casing (`NORTH`, `north `, `North`)
- Mixed date formats (`2025-01-04`, `01/04/2025`, `April 17, 2025`)
- Currency strings with `$` and commas mixed with plain numbers
- ~550 missing values scattered across Region/Units Sold/Total Sales/Customer
- 40 duplicate rows (simulating double-submitted orders)
- 5 extreme outlier rows (data-entry-error-style revenue spikes)
- 3 fully blank rows (common in real Excel exports)

Upload this one to see the cleaning report actually do something — it
should report 40 duplicates removed, ~550 missing values filled, 5
anomalies detected, and the original 6,148 rows reduced to 6,105 clean ones.
