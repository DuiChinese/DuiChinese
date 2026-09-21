import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.auth import get_current_user_id, get_optional_user_id
from app.models.character import Character
from app.models.srs import CardSRS
from app.models.user_srs import UserCardSRS
from app.data.seed_hsk1 import INITIAL_15_CHARACTERS

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

# In-memory SQLite for superfast, isolated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed initial test data
    now = datetime.now(timezone.utc)
    for idx, item in enumerate(INITIAL_15_CHARACTERS, 1):
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

        srs = CardSRS(
            character_id=char.id,
            state="new",
            reps=0,
            lapses=0,
            ease_factor=2.5,
            interval_days=0,
            is_unlocked=1 if idx <= 7 else 0,
            due_date=now if idx <= 7 else None,
        )
        db.add(srs)

        user_srs = UserCardSRS(
            user_id=TEST_USER_ID,
            character_id=char.id,
            state="new",
            reps=0,
            lapses=0,
            ease_factor=2.50,
            interval_days=0,
            is_unlocked=True if idx <= 7 else False,
            due_date=now if idx <= 7 else None,
        )
        db.add(user_srs)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    app.dependency_overrides[get_optional_user_id] = lambda: TEST_USER_ID

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
