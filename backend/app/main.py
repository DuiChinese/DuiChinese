import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.models.character import Character
from app.data.seed_hsk1 import INITIAL_15_CHARACTERS
from app.api.endpoints import characters, practice, pronunciation, seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("duichinese")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed initial characters if empty
    logger.info("Initializing DuiChinese database tables...")
    Base.metadata.create_all(bind=engine)

    # Ensure FSRS columns exist if table pre-dated them
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            res = conn.execute(text("PRAGMA table_info(card_srs)")).fetchall()
            existing_cols = {row[1] for row in res}
            if existing_cols and "stability" not in existing_cols:
                conn.execute(text("ALTER TABLE card_srs ADD COLUMN stability FLOAT DEFAULT 0.0"))
            if existing_cols and "difficulty" not in existing_cols:
                conn.execute(text("ALTER TABLE card_srs ADD COLUMN difficulty FLOAT DEFAULT 0.0"))
    except Exception as e:
        logger.warning(f"Database schema check note: {e}")

    # Auto-seed if database is brand new
    db = SessionLocal()
    try:
        count = db.query(Character).count()
        if count == 0:
            logger.info("Seeding initial 15 HSK1 characters...")
            for item in INITIAL_15_CHARACTERS:
                char = Character(
                    hanzi=item["hanzi"],
                    pinyin=item["pinyin"],
                    pinyin_clean=item["pinyin_clean"],
                    tone=item["tone"],
                    meaning=item["meaning"],
                    radical=item["radical"],
                    stroke_count=item["stroke_count"],
                    hsk_level=item["hsk_level"],
                    mnemonic=item["mnemonic"],
                    examples=item["examples"]
                )
                db.add(char)
            db.commit()
            logger.info("Initial characters seeded successfully.")
    except Exception as e:
        logger.error(f"Error during auto-seed: {e}")
    finally:
        db.close()

    yield
    logger.info("DuiChinese API shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for DuiChinese - Master Hanzi and Mandarin Tones from Scratch",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(characters.router, prefix="/api")
app.include_router(practice.router, prefix="/api")
app.include_router(pronunciation.router, prefix="/api")
app.include_router(seed.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to DuiChinese API 🏮",
        "docs": "/docs",
        "health": "ok"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

