#!/usr/bin/env python3
"""
Διαβάζει τις τρέχουσες προσφορές τροφίμων από το lidl-hellas.gr
και τις γράφει στο docs/offers.json για την εφαρμογή.

Τρέχει αυτόματα κάθε πρωί από το GitHub Actions (.github/workflows/update-offers.yml).
Χρειάζεται μόνο Python 3.8+ (καμία επιπλέον βιβλιοθήκη).
"""

import html
import json
import re
import sys
import unicodedata
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://www.lidl-hellas.gr"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept-Language": "el-GR,el;q=0.9",
}
OUT = Path(__file__).resolve().parent / "docs" / "offers.json"


def norm(text):
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn").replace("ς", "σ")


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def package_grams(text):
    """'700 g + 210 g δώρο' -> 910, '1 Κg' -> 1000, '6 x 1 l' -> 6000."""
    if not text:
        return None
    t = text.lower().replace(",", ".").replace("κ", "k")
    total = 0.0
    for m in re.finditer(r"(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b", t):
        mult = int(m.group(1)) if m.group(1) else 1
        val = float(m.group(2))
        if m.group(3) in ("kg", "l"):
            val *= 1000
        total += mult * val
    return total or None


def price_per_kg(price, packaging, base_price, loose):
    if price is None:
        return None
    base = norm(base_price)
    if re.search(r"1\s*[kκ]g|1\s*l\b", base):
        nums = re.findall(r"(\d+(?:,\d+)?)\s*€", base)
        if nums:
            return float(nums[-1].replace(",", "."))  # 'Από 0,90€ σε 0,63€' -> 0,63
    if loose:
        return price
    grams = package_grams(packaging)
    return round(price / grams * 1000, 3) if grams else None


def get_offers():
    home = fetch(BASE + "/")
    # Σελίδες εβδομαδιαίων προσφορών, π.χ. /c/evdomadiaies-epiloges-26kw43/a10105463
    pages = sorted(set(re.findall(r'href="(/c/[a-z0-9\-]+-\d{2}kw\d{2}/a\d+)"', home)))
    offers = {}
    for path in pages:
        try:
            page = fetch(BASE + path)
        except Exception as exc:
            print(f"  ! Δεν άνοιξε η {path}: {exc}")
            continue
        for raw in re.findall(r'data-grid-data="([^"]+)"', page):
            try:
                item = json.loads(html.unescape(raw))
            except ValueError:
                continue
            category = (item.get("keyfacts") or {}).get("wonCategoryPrimary", "")
            if "Τρόφιμα" not in category or "κατοικίδια" in category:
                continue  # μόνο τρόφιμα για ανθρώπους
            pid = item.get("productId")
            if pid in offers:
                continue
            price_info = item.get("price") or {}
            price = price_info.get("price")
            if price is None:  # μερικά έχουν τιμή μόνο ανά περιοχή / Lidl Plus
                for reg in (item.get("regionsPrices") or {}).values():
                    price = (reg.get("currentPrice") or {}).get("price")
                    if price is not None:
                        break
            badges = ((item.get("stockAvailability") or {}).get("badgeInfo") or {}).get("badges") or []
            packaging = (price_info.get("packaging") or {}).get("text", "")
            base_price = (price_info.get("basePrice") or {}).get("text", "")
            loose = "κιλο" in norm(packaging)
            offers[pid] = {
                "title": (item.get("fullTitle") or item.get("title") or "").strip(),
                "price": price,
                "packaging": packaging,
                "when": badges[0]["text"] if badges else "",
                "loose": loose,
                "pack_g": package_grams(packaging),
                "price_kg": price_per_kg(price, packaging, base_price, loose),
                "url": BASE + item.get("canonicalUrl", ""),
            }
    return list(offers.values())


def main():
    offers = get_offers()
    if not offers:
        print("Δεν βρέθηκαν προσφορές - κρατάω το παλιό offers.json.")
        sys.exit(1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {"updated": datetime.now(timezone.utc).isoformat(timespec="minutes"), "offers": offers}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Γράφτηκαν {len(offers)} προσφορές στο {OUT}")


if __name__ == "__main__":
    main()
