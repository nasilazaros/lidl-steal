let allProducts = [];

async function loadData() {
    try {
        const [prodRes, priceRes] = await Promise.all([
            fetch('data/products.json'),
            fetch('data/prices.json')
        ]);
        
        if (!prodRes.ok || !priceRes.ok) {
            throw new Error("Δεν βρέθηκαν τα αρχεία JSON");
        }

        const products = await prodRes.json();
        const prices = await priceRes.json();
        
        console.log("Φορτώθηκαν προϊόντα:", products.length);
        
        allProducts = products.map(p => ({ ...p, prices: prices[p.id] || [] }));
        
        // Καλούμε τη συνάρτηση για να γεμίσει το μενού
        populateStores();
        
        // Εμφανίζουμε όλα τα προϊόντα αρχικά
        applyFilters();
        
    } catch (error) {
        console.error(error);
        document.getElementById('results').innerHTML = '<div class="loading">Σφάλμα φόρτωσης δεδομένων. Ελέγξτε αν τα JSON είναι στον φάκελο data.</div>';
    }
}

function populateStores() {
    const storeFilter = document.getElementById('storeFilter');
    const storesSet = new Set();
    
    // Συλλογή όλων των μοναδικών ονομάτων καταστημάτων
    allProducts.forEach(p => {
        if (p.prices && Array.isArray(p.prices)) {
            p.prices.forEach(pr => {
                if (pr.retailer_name) {
                    storesSet.add(pr.retailer_name.trim());
                }
            });
        }
    });

    const sortedStores = Array.from(storesSet).sort();
    console.log("Βρέθηκαν καταστήματα:", sortedStores);

    // Καθαρισμός και επαναφορά της λίστας
    storeFilter.innerHTML = '<option value="all">Όλα τα καταστήματα</option>';
    
    sortedStores.forEach(storeName => {
        const option = document.createElement('option');
        option.value = storeName;
        option.textContent = storeName;
        storeFilter.appendChild(option);
    });
}

function applyFilters() {
    const term = document.getElementById('search').value.toLowerCase();
    const selectedStore = document.getElementById('storeFilter').value;

    const filtered = allProducts.map(p => {
        let filteredPrices = p.prices;
        if (selectedStore !== 'all') {
            filteredPrices = p.prices.filter(pr => pr.retailer_name === selectedStore);
        }
        return { ...p, filteredPrices: filteredPrices };
    }).filter(p => {
        const matchesSearch = 
            (p.name && p.name.toLowerCase().includes(term)) || 
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term));
            
        const hasPrice = p.filteredPrices.length > 0;
        return matchesSearch && hasPrice;
    });

    renderResults(filtered);
}

function renderResults(items) {
    const container = document.getElementById('results');
    if (items.length === 0) {
        container.innerHTML = '<div class="loading">Δεν βρέθηκαν προϊόντα.</div>';
        return;
    }
    
    const html = items.map(p => {
        const sortedPrices = p.filteredPrices.sort((a, b) => a.price - b.price);
        
        const storesHtml = `<div class="stores">` + sortedPrices.map(pr => {
            const discountClass = pr.is_discount ? ' discount' : '';
            const unitStr = pr.price_per_unit ? ` <span class="unit-price">(${pr.price_per_unit.toFixed(2)} / ${p.unit || 'τεμ'})</span>` : '';
            return `<div class="store-badge${discountClass}">${pr.retailer_name}: <span class="price">${pr.price.toFixed(2)}€</span>${unitStr}</div>`;
        }).join('') + `</div>`;
        
        const privateLabel = p.private_label ? '<span style="color: #28a745; font-size:0.8em;">(Ιδιωτική Ετικέτα)</span>' : '';
        
        return `<div class="product-card">
                    <div class="product-title">${p.name} ${privateLabel}</div>
                    <div class="product-meta">${p.brand || ''} | Κατηγορία: ${p.category || ''} ${p.unit_quantity ? `| Συσκευασία: ${p.unit_quantity} ${p.unit}` : ''}</div>
                    ${storesHtml}
                </div>`;
    }).join('');
    
    container.innerHTML = html;
}

document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('storeFilter').addEventListener('change', applyFilters);

loadData();
