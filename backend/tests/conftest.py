import pytest


@pytest.fixture(autouse=True)
def isolate_dormitory_database(tmp_path, monkeypatch):
    monkeypatch.setenv(
        "DORMITORY_DATABASE_PATH",
        str(tmp_path / "dormitory.sqlite3"),
    )
