from pydantic import BaseModel
from typing import Optional, Any


class UploadResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int
    column_count: int
    cleaning_report: dict


class DatasetSummary(BaseModel):
    id: int
    filename: str
    uploaded_at: str
    row_count: int
    column_count: int


class InsightOut(BaseModel):
    category: str
    severity: str
    text: str
