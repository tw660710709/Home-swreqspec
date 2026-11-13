from fastapi import FastAPI

from .approval import router as approval_router
from .details import router as details_router
from .owner_dormitories import router as owner_dormitories_router
from .search_api import router as search_router
from .statistics import router as statistics_router


app = FastAPI()
app.include_router(approval_router)
app.include_router(search_router)
app.include_router(details_router)
app.include_router(statistics_router)
app.include_router(owner_dormitories_router)
