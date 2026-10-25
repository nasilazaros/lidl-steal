let allProducts = [];

// Όταν φορτώσει η σελίδα, ξεκινάμε
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

async function loadData() {
    try {
        // Ψάχνουμε τα αρχεία ακριβώς στον φάκελο docs
        const [prodRes, priceRes] = await Promise.all([
            fetch('products.json'),
            fetch('prices.json')
        ]);
        
        if (!prodRes.ok || !priceRes.ok) {
            throw new Error("Τα αρχεία JSON δεν βρέθηκαν");
        }

        const products = await prodRes.json();
        const prices = await priceRes.json();
        
        allProducts = products.map(p => ({ ...p, prices: prices[p.id] || [] }));
        
        populateDropdown();
        renderResults(allProducts);
        
    } catch (error) {
        document.getElementById('results').innerHTML = '<div class="loading">Σφάλμα φόρτωσης δεδομένων. Ελέγξτε αν τα JSON είναι στον φάκελο docs.</div>';
        console.error(error);
    }
}

function populateDropdown() {
    const select = document.getElementById('storeFilter');
    const uniqueStores = new Set();
    
    allProducts.forEach(product => {
        if (product.prices) {
            product.prices.forEach(price => {
                if (price.retailer_name) uniqueStores.add(price.retailer_name);
            });
        }
    });

    const sortedStores = Array.from(uniqueStores).sort();
    select.innerHTML = '<option value="all">Όλα τα καταστήματα</option>';
    
    sortedStores.forEach(storeName => {
        const option = document.createElement('option');
        option.value = storeName;
        option.textContent = storeName;
        select.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const selectedStore = document.getElementById('storeFilter').value;
    
    const filtered = allProducts.map(p => {
        let filteredPrices = p.prices;
        if (selectedStore !== 'all') {
            filteredPrices = p.prices.filter(pr => pr.retailer_name === selectedStore);
        }
        return { ...p, prices: filteredPrices };
    }).filter(p => {
        const matchesSearch = 
            (p.name && p.name.toLowerCase().includes(searchTerm)) || 
            (p.brand && p.brand.toLowerCase().includes(searchTerm)) ||
            (p.category && p.category.toLowerCase().includes(searchTerm));
            
        const hasPrice = selectedStore === 'all' || p.prices.length > 0;
        
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
        let storesHtml = '<div style="color:#999; font-size:0.9em;">Δεν υπάρχουν τιμές.</div>';
        
        if (p.prices && p.prices.length > 0) {
            const sortedPrices = p.prices.sort((a, b) => a.price - b.price);
            storesHtml = `<div class="stores">` + sortedPrices.map(pr => {
                const discountClass = pr.is_discount ? ' discount' : '';
                const unitStr = pr.price_per_unit ? ` <span class="unit-price">(${pr.price_per_unit.toFixed(2)} / ${p.unit || 'τεμ'})</span>` : '';
                return `<div class="store-badge${discountClass}">${pr.retailer_name}: <span class="price">${pr.price.toFixed(2)}€</span>${unitStr}</div>`;
            }).join('') + `</div>`;
        }
        
        const privateLabel = p.private_label ? '<span style="color: #28a745; font-size:0.8em;">(Ιδιωτική Ετικέτα)</span>' : '';
        
        return `<div class="product-card">
                    <div class="product-title">${p.name} ${privateLabel}</div>
                    <div class="product-meta">${p.brand || ''} | Κατηγορία: ${p.category || ''} ${p.unit_quantity ? `| Συσκευασία: ${p.unit_quantity} ${p.unit}` : ''}</div>
                    ${storesHtml}
                </div>`;
    }).join('');
    
    container.innerHTML = html;
}

// Συνδέουμε τα γεγονότα
document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('storeFilter').addEventListener('change', applyFilters);
