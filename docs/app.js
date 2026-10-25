// --- 1. ΔΕΔΟΜΕΝΑ ΣΥΝΤΑΓΩΝ ---
const mealPlan = [
    { day: "Δευτέρα", breakfast: "Κορνφλέικς με γάλα", snack: "1 μπανάνα", lunch: "Λουκάνικα με πιπεριές και πατάτες", dinner: "Τοστ με τυρί και γαλοπούλα" },
    { day: "Τρίτη", breakfast: "Τοστ με τυρί και γαλοπούλα", snack: "1 μήλο", lunch: "Ρεβίθια λεμονάτα", dinner: "Κορνφλέικς με γάλα" },
    { day: "Τετάρτη", breakfast: "Κορνφλέικς με γάλα", snack: "1 μπανάνα", lunch: "Λουκάνικα με πιπεριές και πατάτες", dinner: "Τοστ με τυρί και γαλοπούλα" },
    { day: "Πέμπτη", breakfast: "Τοστ με τυρί και γαλοπούλα", snack: "1 μήλο", lunch: "Κοτόσουπα αυγολέμονο", dinner: "Κορνφλέικς με γάλα" },
    { day: "Παρασκευή", breakfast: "Κορνφλέικς με γάλα", snack: "1 μπανάνα", lunch: "Φακές σούπα", dinner: "Τοστ με τυρί και γαλοπούλα" },
    { day: "Σάββατο", breakfast: "Τοστ με τυρί και γαλοπούλα", snack: "1 μήλο", lunch: "Κοτόσουπα αυγολέμονο", dinner: "Κορνφλέικς με γάλα" },
    { day: "Κυριακή", breakfast: "Κορνφλέικς με γάλα", snack: "1 μπανάνα", lunch: "Φακές σούπα", dinner: "Τοστ με τυρί και γαλοπούλα" }
];

// --- 2. ΛΙΣΤΑ ΑΓΟΡΩΝ (Τι ψάχνουμε στο API) ---
const shoppingListTemplate = [
    { name: "Γάλα", qty: "2 L", search: "γάλα" },
    { name: "Κορνφλέικς", qty: "1 πακέτο", search: "κορνφλέικς" },
    { name: "Ψωμί του τοστ", qty: "1 πακέτο", search: "ψωμί του τοστ" },
    { name: "Τυρί", qty: "500g", search: "τυρί" },
    { name: "Γαλοπούλα", qty: "300g", search: "γαλοπούλα" },
    { name: "Λουκάνικα", qty: "600g", search: "λουκάνικα" },
    { name: "Πατάτες", qty: "1.2 kg", search: "πατάτες" },
    { name: "Πιπεριές", qty: "400g", search: "πιπεριές" },
    { name: "Ρεβίθια", qty: "500g", search: "ρεβίθια" },
    { name: "Κρεμμύδια", qty: "500g", search: "κρεμμύδια" },
    { name: "Λεμόνια", qty: "4 τεμ", search: "λεμόνια" },
    { name: "Κοτόπουλο", qty: "1 kg", search: "κοτόπουλο" },
    { name: "Ρύζι", qty: "500g", search: "ρύζι" },
    { name: "Καρότα", qty: "500g", search: "καρότα" },
    { name: "Φακές", qty: "500g", search: "φακές" },
    { name: "Τομάτα τριμμένη", qty: "400g", search: "τομάτα" },
    { name: "Ελαιόλαδο", qty: "1 L", search: "ελαιόλαδο" },
    { name: "Μπανάνες", qty: "5 τεμ", search: "μπανάνα" },
    { name: "Μήλα", qty: "5 τεμ", search: "μήλο" }
];

let availableStores = [];
let selectedStores = [];
let productsData = [];
let pricesData = {};

// --- 3. ΔΙΑΧΕΙΡΙΣΗ ΘΕΜΑΤΟΣ (DARK / LIGHT) ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        toggleBtn.innerText = '🌙 Σκούρο';
    } else {
        document.body.classList.remove('light-mode');
        toggleBtn.innerText = '☀️ Φωτεινό';
    }
}

window.toggleTheme = function() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.innerText = isLight ? '🌙 Σκούρο' : '☀️ Φωτεινό';
};

// --- 4. ΦΟΡΤΩΣΗ ΚΑΙ ΕΚΚΙΝΗΣΗ ---
document.addEventListener('DOMContentLoaded', async () => {
    initTheme(); // Ελέγχουμε το θέμα μόλις φορτώσει η σελίδα
    
    try {
        // ΕΔΩ ΕΙΝΑΙ Η ΔΙΟΡΘΩΣΗ: Βάλαμε το data/ μπροστά
        const [prodRes, priceRes] = await Promise.all([
            fetch('data/products.json'),
            fetch('data/prices.json')
        ]);
        
        if(!prodRes.ok || !priceRes.ok) throw new Error("JSON not found");
        
        productsData = await prodRes.json();
        pricesData = await priceRes.json();

        const storeSet = new Set();
        productsData.forEach(p => {
            const pPrices = pricesData[p.id] || [];
            pPrices.forEach(pr => {
                if (pr.retailer_name) storeSet.add(pr.retailer_name);
            });
        });
        availableStores = Array.from(storeSet).sort();
        selectedStores = [...availableStores];

        renderStoreFilters();
        renderMealPlan();
        calculateCosts();

    } catch (e) {
        console.error("Σφάλμα:", e);
        document.getElementById('total-cost').innerText = "Σφάλμα";
    }
});

// --- 5. ΜΕΝΟΥ ΚΑΤΑΣΤΗΜΑΤΩΝ ---
function renderStoreFilters() {
    const grid = document.getElementById('stores-grid');
    grid.innerHTML = availableStores.map(store => `
        <label class="store-checkbox">
            <input type="checkbox" value="${store}" checked onchange="toggleStore(this)">
            ${store}
        </label>
    `).join('');
}

window.toggleStore = function(checkbox) {
    const store = checkbox.value;
    if (checkbox.checked) {
        if (!selectedStores.includes(store)) selectedStores.push(store);
    } else {
        selectedStores = selectedStores.filter(s => s !== store);
    }
    calculateCosts();
};

// --- 6. ΕΜΦΑΝΙΣΗ ΠΛΑΝΟΥ ---
function renderMealPlan() {
    const container = document.getElementById('meal-plan');
    container.innerHTML = mealPlan.map(day => `
        <div class="day-card">
            <div class="day-title">${day.day}</div>
            <div class="meal"><span class="meal-type">Πρωινό:</span> ${day.breakfast}</div>
            <div class="meal"><span class="meal-type">Δεκατιανό:</span> ${day.snack}</div>
            <div class="meal"><span class="meal-type">Μεσημεριανό:</span> ${day.lunch}</div>
            <div class="meal"><span class="meal-type">Βραδινό:</span> ${day.dinner}</div>
        </div>
    `).join('');
}

// --- 7. ΕΞΥΠΝΟΣ ΥΠΟΛΟΓΙΣΜΟΣ ΚΟΣΤΟΥΣ ---
function findCheapestPrice(searchTerm) {
    let cheapest = { price: Infinity, store: '', productName: '' };
    const term = searchTerm.toLowerCase();

    productsData.forEach(product => {
        if (product.name && product.name.toLowerCase().includes(term)) {
            const pPrices = pricesData[product.id] || [];
            pPrices.forEach(pr => {
                if (selectedStores.includes(pr.retailer_name)) {
                    if (pr.price < cheapest.price) {
                        cheapest = { price: pr.price, store: pr.retailer_name, productName: product.name };
                    }
                }
            });
        }
    });
    return cheapest;
}

function calculateCosts() {
    let total = 0;
    const listContainer = document.getElementById('shopping-list-items');
    
    listContainer.innerHTML = shoppingListTemplate.map(item => {
        const best = findCheapestPrice(item.search);
        
        if (best.price !== Infinity) {
            total += best.price;
            return `
                <div class="shopping-item">
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <small>${item.qty}</small>
                    </div>
                    <div class="item-price">
                        <span class="price-tag">${best.price.toFixed(2)}€</span>
                        <span class="store-tag">${best.store}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="shopping-item">
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <small>${item.qty}</small>
                    </div>
                    <div class="item-price">
                        <span style="color:#ff5252; font-size:0.8em;">Μη διαθέσιμο</span>
                    </div>
                </div>
            `;
        }
    }).join('');

    document.getElementById('total-cost').innerText = total.toFixed(2) + "€";
    document.getElementById('cost-per-day').innerText = (total / 2 / 7).toFixed(2) + "€";
}
