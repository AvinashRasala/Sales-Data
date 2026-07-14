from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime, timezone
from app.config import settings

_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    # Supabase Auth user id (UUID, as a string) — null allowed so the app
    # still works in fully local/no-auth dev mode.
    user_id = Column(String, nullable=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    cleaning_report = Column(Text)  # JSON string
    storage_path = Column(String)  # path to cleaned parquet/csv

    rows = relationship("SalesRecord", back_populates="dataset", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="dataset", cascade="all, delete-orphan")


class SalesRecord(Base):
    """Normalized row storage so we can query with SQL regardless of original column names."""
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    date = Column(DateTime, nullable=True)
    region = Column(String, nullable=True)
    product = Column(String, nullable=True)
    category = Column(String, nullable=True)
    customer = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    revenue = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    is_anomaly = Column(Integer, default=0)  # 0/1 flag

    dataset = relationship("Dataset", back_populates="rows")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    category = Column(String)  # e.g. 'risk', 'opportunity', 'forecast'
    text = Column(Text)
    severity = Column(String, default="info")  # info | warning | critical | positive
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="insights")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
