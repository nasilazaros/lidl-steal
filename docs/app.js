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

// --- 2. ΛΙΣΤΑ ΑΓΟΡΩΝ (Με καθορισμό ποσότητας και μονάδας για σωστό υπολογισμό) ---
// target: Η ποσότητα που θέλουμε. unit: 'kg', 'L' ή 'τεμ'
const shoppingListTemplate = [
    { name: "Γάλα", qty: "2 L", target: 2, unit: "L", search: ["γάλα"] },
    { name: "Δημητριακά (Κορνφλέικς)", qty: "1 πακέτο", target: 1, unit: "τεμ", search: ["δημητριακά", "κορνφλέικς", "corn flakes"] },
    { name: "Ψωμί για τοστ", qty: "1 πακέτο", target: 1, unit: "τεμ", search: ["ψωμί", "toast", "σάντουιτς"] },
    { name: "Τυρί", qty: "500g", target: 0.5, unit: "kg", search: ["τυρί", "κασέρι", "φέτα"] },
    { name: "Γαλοπούλα", qty: "300g", target: 0.3, unit: "kg", search: ["γαλοπούλα", "ζαμπόν"] },
    { name: "Λουκάνικα", qty: "600g", target: 0.6, unit: "kg", search: ["λουκάνικα"] },
    { name: "Πατάτες", qty: "1.2 kg", target: 1.2, unit: "kg", search: ["πατάτα", "πατάτες"] },
    { name: "Πιπεριές", qty: "400g", target: 0.4, unit: "kg", search: ["πιπεριά", "πιπεριές"] },
    { name: "Ρεβίθια", qty: "500g", target: 0.5, unit: "kg", search: ["ρεβίθια"] },
    { name: "Κρεμμύδια", qty: "500g", target: 0.5, unit: "kg", search: ["κρεμμύδι", "κρεμμύδια"] },
    { name: "Λεμόνια", qty: "4 τεμ", target: 4, unit: "τεμ", search: ["λεμόνι", "λεμόνια"] },
    { name: "Κοτόπουλο", qty: "1 kg", target: 1, unit: "kg", search: ["κοτόπουλο"] },
    { name: "Ρύζι", qty: "500g", target: 0.5, unit: "kg", search: ["ρύζι"] },
    { name: "Καρότα", qty: "500g", target: 0.5, unit: "kg", search: ["καρότο", "καρότα"] },
    { name: "Φακές", qty: "500g", target: 0.5, unit: "kg", search: ["φακές"] },
    { name: "Τομάτα τριμμένη", qty: "400g", target: 0.4, unit: "kg", search: ["τομάτα", "ντομάτα", "σάλτσα"] },
    { name: "Ελαιόλαδο", qty: "1 L", target: 1, unit: "L", search: ["ελαιόλαδο", "λάδι"] },
    { name: "Μπανάνες", qty: "1 kg", target: 1, unit: "kg", search: ["μπανάνα", "μπανάνες"] },
    { name: "Μήλα", qty: "1 kg", target: 1, unit: "kg", search: ["μήλο", "μήλα"] }
];

let availableStores = [];
let selectedStores = [];
let productsData = [];
let pricesData = {};

// --- 3. ΔΙΑΧΕΙΡΙΣΗ ΘΕΜΑΤΟΣ (DARK / LIGHT) ---
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

// --- 7. ΕΞΥΠΝΟΣ ΥΠΟΛΟΓΙΣΜΟΣ ΚΟΣΤΟΥΣ (Με βάση την ποσότητα) ---
function findCheapestPrice(item) {
    let bestOption = { total_price: Infinity, store: '', productName: '' };

    item.search.forEach(term => {
        const lowerTerm = term.toLowerCase();
        
        productsData.forEach(product => {
            if (product.name && product.name.toLowerCase().includes(lowerTerm)) {
                const pPrices = pricesData[product.id] || [];
                
                pPrices.forEach(pr => {
                    if (selectedStores.includes(pr.retailer_name)) {
                        let calculatedCost = pr.price;

                        // Αν ζητάμε κιλά ή λίτρα και το API έχει τιμή ανά μονάδα (price_per_unit)
                        if ((item.unit === 'kg' || item.unit === 'L') && pr.price_per_unit) {
                            const prodUnit = product.unit ? product.unit.toLowerCase() : '';
                            
                            // Ελέγχουμε αν η μονάδα του προϊόντος συμφωνεί με την αναζήτηση
                            if (prodUnit === item.unit || (item.unit === 'kg' && prodUnit === 'gr') || (item.unit === 'L' && prodUnit === 'ml')) {
                                calculatedCost = pr.price_per_unit * item.target;
                            }
                        } else if (item.unit === 'τεμ') {
                            // Για τεμάχια πολλαπλασιάζουμε την τιμή του προϊόντος επί την ποσότητα
                            calculatedCost = pr.price * item.target;
                        }

                        // Αν το υπολογισμένο κόστος είναι το φθηνότερο, το κρατάμε
                        if (calculatedCost < bestOption.total_price) {
                            bestOption = {
                                total_price: calculatedCost,
                                store: pr.retailer_name,
                                productName: product.name
                            };
                        }
                    }
                });
            }
        });
    });
    
    return bestOption;
}

function calculateCosts() {
    let total = 0;
    const listContainer = document.getElementById('shopping-list-items');
    if (!listContainer) return;
    
    listContainer.innerHTML = shoppingListTemplate.map(item => {
        const best = findCheapestPrice(item);
        
        if (best.total_price !== Infinity) {
            total += best.total_price;
            return `
                <div class="shopping-item">
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <small>${item.qty}</small>
                    </div>
                    <div class="item-price">
                        <span class="price-tag">${best.total_price.toFixed(2)}€</span>
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

    const totalElement = document.getElementById('total-cost');
    const perDayElement = document.getElementById('cost-per-day');
    
    if (totalElement) totalElement.innerText = total.toFixed(2) + "€";
    if (perDayElement) perDayElement.innerText = (total / 2 / 7).toFixed(2) + "€";
}
