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

    # Ensure FSRS columns & is_unlocked exist if table pre-dated them
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            res_srs = conn.execute(text("PRAGMA table_info(card_srs)")).fetchall()
            existing_srs = {row[1] for row in res_srs}
            if existing_srs and "stability" not in existing_srs:
                conn.execute(text("ALTER TABLE card_srs ADD COLUMN stability FLOAT DEFAULT 0.0"))
            if existing_srs and "difficulty" not in existing_srs:
                conn.execute(text("ALTER TABLE card_srs ADD COLUMN difficulty FLOAT DEFAULT 0.0"))
            if existing_srs and "is_unlocked" not in existing_srs:
                conn.execute(text("ALTER TABLE card_srs ADD COLUMN is_unlocked INTEGER DEFAULT 0"))

            res_char = conn.execute(text("PRAGMA table_info(characters)")).fetchall()
            existing_char = {row[1] for row in res_char}
            if existing_char and "order_index" not in existing_char:
                conn.execute(text("ALTER TABLE characters ADD COLUMN order_index INTEGER DEFAULT 0"))
    except Exception as e:
        logger.warning(f"Database schema check note: {e}")

    # Auto-seed all 150 HSK1 characters if database is brand new or incomplete
    from app.data.seed_hsk1 import INITIAL_HSK1_CHARACTERS
    from app.models.srs import CardSRS
    db = SessionLocal()
    try:
        count = db.query(Character).count()
        if count < len(INITIAL_HSK1_CHARACTERS):
            logger.info(f"Seeding full {len(INITIAL_HSK1_CHARACTERS)} HSK1 characters...")
            for idx, item in enumerate(INITIAL_HSK1_CHARACTERS, 1):
                existing = db.query(Character).filter(Character.hanzi == item["hanzi"]).first()
                if not existing:
                    char = Character(
                        hanzi=item["hanzi"],
                        pinyin=item["pinyin"],
                        pinyin_clean=item["pinyin_clean"],
                        tone=item["tone"],
                        meaning=item["meaning"],
                        radical=item.get("radical"),
                        stroke_count=item.get("stroke_count"),
                        hsk_level=item.get("hsk_level", 1),
                        order_index=item.get("order_index", idx),
                        mnemonic=item.get("mnemonic"),
                        examples=item.get("examples", [])
                    )
                    db.add(char)
                    db.flush()
                else:
                    char = existing
                    char.order_index = item.get("order_index", idx)
                    char.meaning = item["meaning"]
                    char.pinyin = item["pinyin"]
                    char.pinyin_clean = item["pinyin_clean"]
                    char.tone = item["tone"]
                    char.mnemonic = item.get("mnemonic")
                    char.examples = item.get("examples", [])

                # Ensure CardSRS exists and first 7 are unlocked
                srs = db.query(CardSRS).filter(CardSRS.character_id == char.id).first()
                if not srs:
                    srs = CardSRS(
                        character_id=char.id,
                        state="new",
                        reps=0,
                        lapses=0,
                        ease_factor=2.5,
                        interval_days=0,
                        stability=0.0,
                        difficulty=0.0,
                        is_unlocked=1 if idx <= 7 else 0
                    )
                    db.add(srs)
                elif idx <= 7 and not srs.is_unlocked:
                    srs.is_unlocked = 1
            db.commit()
            logger.info("HSK1 characters and CardSRS initialized successfully.")
    except Exception as e:
        logger.error(f"Error during auto-seed: {e}")
        db.rollback()
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

