from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.scraping import fetch_page, test_selector, find_similar

router = APIRouter()


class FetchRequest(BaseModel):
    url: str
    fetcher_type: str = "normal"  # normal / stealthy / playwright


class TestSelectorRequest(BaseModel):
    url: str
    selector: str
    selector_type: str = "css"
    attribute: Optional[str] = None


class SimilarRequest(BaseModel):
    url: str
    selector: str


@router.post("/fetch")
def preview_fetch(req: FetchRequest):
    try:
        page = fetch_page(req.url, req.fetcher_type)
        html = str(page.prettify()) if hasattr(page, "prettify") else str(page)
        return {"success": True, "html": html}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/test")
def preview_test(req: TestSelectorRequest):
    try:
        results = test_selector(req.url, req.selector, req.selector_type, req.attribute)
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/similar")
def preview_similar(req: SimilarRequest):
    try:
        results = find_similar(req.url, req.selector)
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}
