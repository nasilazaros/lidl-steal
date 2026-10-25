let allProducts = [];

async function loadData() {
    try {
        const [prodRes, priceRes] = await Promise.all([
            fetch('data/products.json'),
            fetch('data/prices.json')
        ]);
        const products = await prodRes.json();
        const prices = await priceRes.json();
        allProducts = products.map(p => ({ ...p, prices: prices[p.id] || [] }));
        renderResults(allProducts);
    } catch (error) {
        document.getElementById('results').innerHTML = '<div class="loading">Σφάλμα φόρτωσης δεδομένων. Βεβαιωθείτε ότι τα JSON υπάρχουν.</div>';
        console.error(error);
    }
}

function renderResults(items) {
    const container = document.getElementById('results');
    if (items.length === 0) {
        container.innerHTML = '<div class="loading">Δεν βρέθηκαν προϊόντα.</div>';
        return;
    }
    const html = items.map(p => {
        let storesHtml = '<div style="color:#999; font-size:0.9em;">Δεν βρέθηκαν τιμές.</div>';
        if (p.prices && p.prices.length > 0) {
            const sortedPrices = p.prices.sort((a, b) => a.price - b.price);
            storesHtml = `<div class="stores">` + sortedPrices.map(pr => {
                const discountClass = pr.is_discount ? ' discount' : '';
                const unitStr = pr.price_per_unit ? ` <span class="unit-price">(${pr.price_per_unit.toFixed(2)} / ${p.unit || 'τεμ'})</span>` : '';
                return `<div class="store-badge${discountClass}">${pr.retailer_name}: <span class="price">${pr.price.toFixed(2)}€</span>${unitStr}</div>`;
            }).join('') + `</div>`;
        }
        const privateLabel = p.private_label ? '<span style="color: #28a745; font-size:0.8em;">(Ιδιωτική Ετικέτα)</span>' : '';
        return `<div class="product-card"><div class="product-title">${p.name} ${privateLabel}</div><div class="product-meta">${p.brand || ''} | Κατηγορία: ${p.category || ''} ${p.unit_quantity ? `| Συσκευασία: ${p.unit_quantity} ${p.unit}` : ''}</div>${storesHtml}</div>`;
    }).join('');
    container.innerHTML = html;
}

document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) || 
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
    );
    renderResults(filtered);
});

loadData();
