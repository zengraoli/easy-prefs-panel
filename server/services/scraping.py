from scrapling import Fetcher, StealthyFetcher
import time

# Simple in-memory cache: {url: (timestamp, page)}
_page_cache: dict[str, tuple[float, object]] = {}
_CACHE_TTL = 60  # seconds


def _get_cached_page(url: str, fetcher_type: str = "normal"):
    key = f"{fetcher_type}:{url}"
    now = time.time()
    if key in _page_cache:
        ts, page = _page_cache[key]
        if now - ts < _CACHE_TTL:
            return page
        del _page_cache[key]
    page = fetch_page(url, fetcher_type)
    _page_cache[key] = (now, page)
    return page


def fetch_page(url: str, fetcher_type: str = "normal"):
    if fetcher_type == "stealthy":
        return StealthyFetcher.fetch(url)
    elif fetcher_type == "playwright":
        try:
            from scrapling import PlayWrightFetcher
            return PlayWrightFetcher.fetch(url, headless=True, network_idle=True)
        except ImportError:
            raise RuntimeError("请先运行 scrapling install 安装浏览器依赖")
    else:
        return Fetcher.get(url)


def test_selector(url: str, selector: str, selector_type: str = "css", attribute: str | None = None):
    page = _get_cached_page(url)

    results = []
    if selector_type == "css":
        elements = page.css(selector)
        if not isinstance(elements, list):
            elements = [elements]
        for el in elements:
            if el is None:
                continue
            if attribute:
                results.append({"text": el.attrib.get(attribute, ""), "tag": el.tag})
            else:
                results.append({"text": el.text or "", "tag": el.tag})
    elif selector_type == "xpath":
        elements = page.xpath(selector)
        if not isinstance(elements, list):
            elements = [elements]
        for el in elements:
            if el is None:
                continue
            results.append({"text": el.text or "", "tag": getattr(el, "tag", "")})
    elif selector_type == "text":
        el = page.find_by_text(selector)
        if el:
            results.append({"text": el.text or "", "tag": el.tag})

    return results


def find_similar(url: str, selector: str):
    page = _get_cached_page(url)
    target = page.css(selector)
    if target is None:
        return []

    similar = page.find_similar(target)
    results = []
    if similar:
        if not isinstance(similar, list):
            similar = [similar]
        for el in similar:
            results.append({"text": el.text or "", "tag": el.tag, "html": str(el)[:200]})
    return results
