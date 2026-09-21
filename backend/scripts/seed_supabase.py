"""
Seed script to populate Supabase PostgreSQL database with HSK1 characters.
Usage:
    python scripts/seed_supabase.py
"""
import sys
import os
import logging

# Ensure backend root directory is in sys.path so 'app' can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.models.character import Character
from app.data.seed_hsk1 import INITIAL_HSK1_CHARACTERS

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_supabase")


def main():
    logger.info("Connecting to database...")
    try:
        with engine.connect() as conn:
            # Check which database engine we are connected to
            is_postgres = "postgresql" in engine.url.drivername
            if is_postgres:
                res = conn.execute(text("SELECT current_database(), current_user, version();")).fetchone()
                logger.info(f"Connected to PostgreSQL on host '{engine.url.host}': DB={res[0]}, User={res[1]}")
            else:
                logger.warning(f"Connected to SQLite: {engine.url}. (Verify DATABASE_URL in .env if you intended to target Supabase).")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing_count = db.query(Character).count()
        logger.info(f"Current characters in database: {existing_count}")

        seeded = 0
        updated = 0
        for idx, item in enumerate(INITIAL_HSK1_CHARACTERS, 1):
            char = db.query(Character).filter(Character.hanzi == item["hanzi"]).first()
            if not char:
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
                    examples=item.get("examples", []),
                )
                db.add(char)
                seeded += 1
            else:
                char.pinyin = item["pinyin"]
                char.pinyin_clean = item["pinyin_clean"]
                char.tone = item["tone"]
                char.meaning = item["meaning"]
                char.order_index = item.get("order_index", idx)
                char.mnemonic = item.get("mnemonic")
                char.examples = item.get("examples", [])
                updated += 1

        db.commit()
        total_now = db.query(Character).count()
        logger.info(f"Done! Seeded: {seeded} new, Updated: {updated} existing. Total in database: {total_now} characters.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
