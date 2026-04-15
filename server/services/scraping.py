from scrapling import Fetcher, StealthyFetcher, PlayWrightFetcher


def get_fetcher(fetcher_type: str):
    if fetcher_type == "stealthy":
        return StealthyFetcher()
    elif fetcher_type == "playwright":
        return PlayWrightFetcher()
    return Fetcher()


def fetch_page(url: str, fetcher_type: str = "normal"):
    fetcher = get_fetcher(fetcher_type)
    page = fetcher.fetch(url)
    return page


def test_selector(url: str, selector: str, selector_type: str = "css", attribute: str | None = None):
    fetcher = Fetcher()
    page = fetcher.fetch(url)

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
    fetcher = Fetcher()
    page = fetcher.fetch(url)
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
