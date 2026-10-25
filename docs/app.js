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

// --- 2. ΛΙΣΤΑ ΑΓΟΡΩΝ ---
const shoppingListTemplate = [
    { name: "Γάλα", qty: "2 L", search: ["γάλα"] },
    { name: "Δημητριακά (Κορνφλέικς)", qty: "1 πακέτο", search: ["δημητριακά", "κορνφλέικς"] },
    { name: "Ψωμί για τοστ", qty: "1 πακέτο", search: ["ψωμί", "toast"] },
    { name: "Τυρί", qty: "500g", search: ["τυρί", "κασέρι", "φέτα"] },
    { name: "Γαλοπούλα", qty: "300g", search: ["γαλοπούλα", "ζαμπόν"] },
    { name: "Λουκάνικα", qty: "600g", search: ["λουκάνικα"] },
    { name: "Πατάτες", qty: "1.2 kg", search: ["πατάτα", "πατάτες"] },
    { name: "Πιπεριές", qty: "400g", search: ["πιπεριά", "πιπεριές"] },
    { name: "Ρεβίθια", qty: "500g", search: ["ρεβίθια"] },
    { name: "Κρεμμύδια", qty: "500g", search: ["κρεμμύδι", "κρεμμύδια"] },
    { name: "Λεμόνια", qty: "4 τεμ", search: ["λεμόνι", "λεμόνια"] },
    { name: "Κοτόπουλο", qty: "1 kg", search: ["κοτόπουλο"] },
    { name: "Ρύζι", qty: "500g", search: ["ρύζι"] },
    { name: "Καρότα", qty: "500g", search: ["καρότο", "καρότα"] },
    { name: "Φακές", qty: "500g", search: ["φακές"] },
    { name: "Τομάτα τριμμένη", qty: "400g", search: ["τομάτα", "ντομάτα"] },
    { name: "Ελαιόλαδο", qty: "1 L", search: ["ελαιόλαδο", "λάδι"] },
    { name: "Μπανάνες", qty: "1 kg", search: ["μπανάνα", "μπανάνες"] },
    { name: "Μήλα", qty: "1 kg", search: ["μήλο", "μήλα"] }
];

let availableStores = [];
let selectedStores = [];
let productsData = [];
let pricesData = {};

// --- 3. ΔΙΑΧΕΙΡΙΣΗ ΘΕΜΑΤΟΣ ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        toggleBtn.textContent = '🌙';
    } else {
        document.body.classList.remove('light-mode');
        toggleBtn.textContent = '☀️';
    }
}

window.toggleTheme = function() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = isLight ? '🌙' : '☀️';
    }
};

// --- 4. ΦΟΡΤΩΣΗ ΚΑΙ ΕΚΚΙΝΗΣΗ ---
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    
    try {
        const [prodRes, priceRes] = await Promise.all([
            fetch('products.json'),
            fetch('prices.json')
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
        const costElement = document.getElementById('total-cost');
        if (costElement) costElement.innerText = "Σφάλμα (Δεν βρέθηκαν τα JSON)";
    }
});

// --- 5. ΜΕΝΟΥ ΚΑΤΑΣΤΗΜΑΤΩΝ ---
function renderStoreFilters() {
    const grid = document.getElementById('stores-grid');
    if (!grid) return;
    
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
    if (!container) return;

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

// --- 7. ΕΞΥΠΝΟΣ ΥΠΟΛΟΓΙΣΜΟΣ (Χρησιμοποιεί την τιμή ανά κιλό/λίτρο) ---
function findCheapestPrice(searchTerms) {
    let cheapest = { price: Infinity, store: '', unit: '' };

    searchTerms.forEach(term => {
        const lowerTerm = term.toLowerCase();
        
        productsData.forEach(product => {
            if (product.name && product.name.toLowerCase().includes(lowerTerm)) {
                const pPrices = pricesData[product.id] || [];
                
                pPrices.forEach(pr => {
                    if (selectedStores.includes(pr.retailer_name)) {
                        // Χρησιμοποιούμε το price_per_unit (τιμή ανά κιλό/λίτρο) για σωστή σύγκριση
                        // Αν δεν υπάρχει, χρησιμοποιούμε την κανονική τιμή
                        const comparePrice = (pr.price_per_unit && pr.price_per_unit > 0) ? pr.price_per_unit : pr.price;
                        
                        if (comparePrice < cheapest.price) {
                            cheapest = { 
                                price: comparePrice, 
                                store: pr.retailer_name, 
                                unit: product.unit || 'τεμ'
                            };
                        }
                    }
                });
            }
        });
    });
    
    return cheapest;
}

function calculateCosts() {
    let total = 0;
    const listContainer = document.getElementById('shopping-list-items');
    if (!listContainer) return;
    
    listContainer.innerHTML = shoppingListTemplate.map(item => {
        const best = findCheapestPrice(item.search);
        
        if (best.price !== Infinity) {
            total += best.price;
            return `
                <div class="shopping-item">
                    <div class="shopping-text">
                        Πάρε <span class="shopping-highlight">${item.name}</span> από <span class="shopping-highlight">${best.store}</span> γιατί έχει την χαμηλότερη τιμή.
                    </div>
                    <span class="shopping-sub">
                        (Τιμή: ${best.price.toFixed(2)}€ / ${best.unit})
                    </span>
                </div>
            `;
        } else {
            return `
                <div class="shopping-item">
                    <div class="shopping-text">
                        <span style="color:#ff5252;">Μη διαθέσιμο στα επιλεγμένα καταστήματα.</span>
                    </div>
                    <span class="shopping-sub">${item.name}</span>
                </div>
            `;
        }
    }).join('');

    const totalElement = document.getElementById('total-cost');
    const perDayElement = document.getElementById('cost-per-day');
    
    if (totalElement) totalElement.innerText = total.toFixed(2) + "€";
    if (perDayElement) perDayElement.innerText = (total / 2 / 7).toFixed(2) + "€";
}
