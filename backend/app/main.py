from fastapi import FastAPI

from .details import router as details_router
from .search_api import router as search_router


app = FastAPI()
app.include_router(search_router)
app.include_router(details_router)
