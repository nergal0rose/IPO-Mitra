import os
from sqlmodel import SQLModel, create_engine, Session

data_dir = os.environ.get("IPO_MITRA_DATA_DIR", ".")
sqlite_file_name = os.path.join(data_dir, "meroshare.db")
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
