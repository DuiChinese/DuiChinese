import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.models.character import Character
from app.data.seed_hsk1 import INITIAL_15_CHARACTERS

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
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

