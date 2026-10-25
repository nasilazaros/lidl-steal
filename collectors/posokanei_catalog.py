import requests
import json
import os
import time

URL = "https://api.posokanei.gov.gr/products/search"
HEADERS = {'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}

def fetch_all_products(search_term, max_pages=5):
    all_products = []
    page = 1
    while page <= max_pages:
        payload = {
            "title": search_term,
            "page": page,
            "page_size": 100,
            "sort_by": "name",
            "sort_order": "asc"
        }
        print(f"Λήψη σελίδας {page} για '{search_term}'...")
        try:
            r = requests.post(URL, json=payload, headers=HEADERS, timeout=30)
            if r.status_code != 200:
                print(f"Σφάλμα στο API: {r.status_code}")
                break
            data = r.json()
            products = data.get("products", [])
            if not products:
                break
            all_products.extend(products)
            if len(products) < 100:
                break
            page += 1
            time.sleep(2)
        except Exception as e:
            print(f"Σφάλμα σύνδεσης: {e}")
            break
    return all_products

def main():
    # Η διευρυμένη λίστα με όλες τις λέξεις-κλειδιά
    search_terms = [
        "γάλα", "ψωμί", "αυγά", "κοτόπουλο", "τυρί", "μακαρόνια", "ρύζι", "ελαιόλαδο",
        "νερό", "αναψυκτικά", "καφές", "μπύρα", "κρασί", "χυμός", "τσάι",
        "αλεύρι", "ζάχαρη", "αλάτι", "πιπέρι", "μέλι", "μαρμελάδα", "βούτυρο", "γιαούρτι",
        "κρέας", "χοιρινό", "μοσχάρι", "ψάρι", "γαρίδες", "καλαμάρι", "τόνος",
        "σαλάτα", "ντομάτα", "αγγούρι", "πατάτα", "κρεμμύδι", "καρότο", "πιπεριά",
        "μήλο", "μπανάνα", "πορτοκάλι", "λεμόνι", "φράουλα", "σταφύλι",
        "σαπούνι", "απορρυπαντικό", "χαρτί υγείας", "οδοντόκρεμα", "σαμπουάν",
        "μαγιονέζα", "κέτσαπ", "μουστάρδα", "ξίδι", "λάδι", "δημητριακά", "όσπρια", "φακές", "ρεβίθια"
    ]
    
    unified_products = {}
    unified_prices = {}
    
    for term in search_terms:
        print(f"\n--- Αναζήτηση για: {term} ---")
        products = fetch_all_products(term, max_pages=3)
        
        for p in products:
            pid = p["id"]
            unified_products[pid] = {
                "id": pid,
                "name": p.get("name", "").strip(),
                "brand": p.get("brand", "").strip() if p.get("brand") else None,
                "category": p.get("category"),
                "subcategory": p.get("subcategory"),
                "unit": p.get("unit"),
                "unit_quantity": p.get("unit_quantity"),
                "private_label": p.get("private_label", False),
                "image_url": p.get("image_url")
            }
            prices_list = []
            for rp in p.get("retailer_prices", []):
                if rp.get("country") == "GR":
                    prices_list.append({
                        "retailer_id": rp.get("retailer"),
                        "retailer_name": rp.get("retailer_display_name"),
                        "price": rp.get("price"),
                        "price_per_unit": rp.get("price_normalized"),
                        "is_discount": rp.get("is_discount"),
                        "last_updated": rp.get("last_updated")
                    })
            unified_prices[pid] = prices_list

    os.makedirs("docs/data", exist_ok=True)
    final_products = list(unified_products.values())
    
    with open("docs/data/products.json", "w", encoding="utf-8") as f:
        json.dump(final_products, f, ensure_ascii=False, indent=2)
    with open("docs/data/prices.json", "w", encoding="utf-8") as f:
        json.dump(unified_prices, f, ensure_ascii=False, indent=2)
        
    print(f"\nΟλοκληρώθηκε! Αποθηκεύτηκαν {len(final_products)} μοναδικά προϊόντα.")

if __name__ == "__main__":
    main()
