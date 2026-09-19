import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("duichinese.db")

Base = declarative_base()

def get_engine():
    """
    Creates the SQLAlchemy engine. Tries PostgreSQL first.
    If unavailable and SQLITE_FALLBACK is enabled, falls back to SQLite.
    """
    database_url = settings.DATABASE_URL
    try:
        # Check if URL is PostgreSQL
        if "postgresql" in database_url:
            engine = create_engine(database_url, pool_pre_ping=True)
            # Test connectivity
            with engine.connect() as conn:
                pass
            logger.info("Connected to PostgreSQL successfully.")
            return engine
        else:
            return create_engine(database_url, connect_args={"check_same_thread": False})
    except Exception as e:
        if settings.SQLITE_FALLBACK:
            logger.warning(
                f"PostgreSQL connection to {database_url} failed ({e}). "
                f"Falling back to local SQLite at {settings.SQLITE_FALLBACK_URL} for local development."
            )
            return create_engine(
                settings.SQLITE_FALLBACK_URL,
                connect_args={"check_same_thread": False}
            )
        raise e


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

