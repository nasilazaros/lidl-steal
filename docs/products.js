let allProducts = [];

// Περιμένουμε να φορτώσει η σελίδα
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

async function loadData() {
    try {
        // Ψάχνουμε τα αρχεία στον ίδιο φάκελο (docs)
        const [prodRes, priceRes] = await Promise.all([
            fetch('products.json'),
            fetch('prices.json')
        ]);
        
        if (!prodRes.ok || !priceRes.ok) {
            throw new Error("Τα αρχεία JSON δεν βρέθηκαν");
        }

        const products = await prodRes.json();
        const prices = await priceRes.json();
        
        // Ενώνουμε τα προϊόντα με τις τιμές τους
        allProducts = products.map(p => ({ 
            ...p, 
            allPrices: prices[p.id] || [] 
        }));
        
        populateDropdown();
        applyFilters(); // Εμφάνιση όλων αρχικά
        
    } catch (error) {
        document.getElementById('results').innerHTML = '<div class="loading">Σφάλμα φόρτωσης δεδομένων. Ελέγξτε αν τα JSON είναι στον φάκελο docs.</div>';
        console.error(error);
    }
}

function populateDropdown() {
    const select = document.getElementById('storeFilter');
    const uniqueStores = new Set();
    
    // Βρίσκουμε όλα τα μοναδικά καταστήματα
    allProducts.forEach(product => {
        product.allPrices.forEach(price => {
            if (price.retailer_name) uniqueStores.add(price.retailer_name.trim());
        });
    });

    // Τα ταξινομούμε αλφαβητικά
    const sortedStores = Array.from(uniqueStores).sort();
    
    // Καθαρίζουμε το μενού
    select.innerHTML = '<option value="all">Όλα τα καταστήματα</option>';
    
    // Προσθέτουμε τα καταστήματα
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
    
    // Φιλτράρουμε τα προϊόντα με βάση την αναζήτηση και το κατάστημα
    const filtered = allProducts.map(p => {
        let filteredPrices = p.allPrices;
        
        // Αν έχει επιλεγεί συγκεκριμένο κατάστημα, κρατάμε μόνο τις τιμές του
        if (selectedStore !== 'all') {
            filteredPrices = p.allPrices.filter(pr => pr.retailer_name === selectedStore);
        }
        
        return { ...p, currentPrices: filteredPrices };
    }).filter(p => {
        // Έλεγχος αν ταιριάζει με την αναζήτηση
        const matchesSearch = 
            (p.name && p.name.toLowerCase().includes(searchTerm)) || 
            (p.brand && p.brand.toLowerCase().includes(searchTerm)) ||
            (p.category && p.category.toLowerCase().includes(searchTerm));
            
        // Έλεγχος αν έχει έστω και μια τιμή (αν έχουμε διαλέξει κατάστημα)
        const hasPrice = selectedStore === 'all' || p.currentPrices.length > 0;
        
        return matchesSearch && hasPrice;
    });
    
    renderResults(filtered);
}

function renderResults(items) {
    const container = document.getElementById('results');
    if (items.length === 0) {
        container.innerHTML = '<div class="loading">Δεν βρέθηκαν προϊόντα για αυτή την αναζήτηση/κατάστημα.</div>';
        return;
    }
    
    const html = items.map(p => {
        // Ταξινομούμε τις τιμές από το φθηνότερο στο ακριβότερο
        const sortedPrices = p.currentPrices.sort((a, b) => a.price - b.price);
        
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

// Όταν αλλάζει το μενού ή η αναζήτηση, τρέχουμε το φίλτρο
function setupEventListeners() {
    document.getElementById('search').addEventListener('input', applyFilters);
    document.getElementById('storeFilter').addEventListener('change', applyFilters);
}
