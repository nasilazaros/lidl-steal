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
    { name: "Δημητριακά", qty: "1 πακέτο", search: ["δημητριακά", "κορνφλέικς"] },
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
let userSelections = {}; // Εδώ κρατάμε τι διάλεξε ο χρήστης

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
        generateShoppingList(); // Εδώ φτιάχνουμε τη λίστα

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
            <input type="checkbox" value="${store}" ${selectedStores.includes(store) ? 'checked' : ''} onchange="toggleStore(this)">
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
    generateShoppingList(); // Ξαναφτιάχνουμε τη λίστα με τα νέα καταστήματα
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

// --- 7. ΔΗΜΙΟΥΡΓΙΑ ΛΙΣΤΑΣ ΜΕ ΕΠΙΛΟΓΕΣ (DROPDOWN) ---
function getAllOptions(searchTerms) {
    let options = [];
    const blacklist = ["σκύλο", "γάτα", "ζώα", "ζώων", "κατοικίδι", "πουρέ", "πίτα", "πίτσα", "σάντουιτς", "σαλάτα", "σούπα", "έτοιμο", "μαγειρευτό", "τροφή"];
    const seen = new Set(); // Για να μην έχουμε διπλότυπα

    searchTerms.forEach(term => {
        const lowerTerm = term.toLowerCase();
        
        productsData.forEach(product => {
            const prodName = (product.name || "").toLowerCase();
            
            if (prodName.includes(lowerTerm)) {
                const isBad = blacklist.some(badWord => prodName.includes(badWord));
                if (isBad) return;

                const pPrices = pricesData[product.id] || [];
                
                pPrices.forEach(pr => {
                    if (selectedStores.includes(pr.retailer_name)) {
                        let comparePrice = pr.price;
                        if (pr.price_per_unit && pr.price_per_unit > 0.2) {
                            comparePrice = pr.price_per_unit;
                        }
                        
                        if (comparePrice < 0.2) return;

                        // Μοναδικό κλειδί για να μην εμφανίζεται το ίδιο προϊόν 2 φορές
                        const uniqueKey = product.name + "_" + pr.retailer_name;
                        if (!seen.has(uniqueKey)) {
                            seen.add(uniqueKey);
                            options.push({ 
                                displayName: `${product.name} - ${pr.price.toFixed(2)}€ (${pr.retailer_name})`,
                                price: pr.price, 
                                store: pr.retailer_name, 
                                productName: product.name,
                                comparePrice: comparePrice
                            });
                        }
                    }
                });
            }
        });
    });
    
    // Ταξινόμηση με βάση την τιμή (από το φθηνότερο)
    options.sort((a, b) => a.comparePrice - b.comparePrice);
    return options;
}

function generateShoppingList() {
    const listContainer = document.getElementById('shopping-list-items');
    if (!listContainer) return;

    // Διατηρούμε τις παλιές επιλογές του χρήστη αν υπάρχουν
    let html = shoppingListTemplate.map(item => {
        const options = getAllOptions(item.search);
        
        let selectHtml = "";
        if (options.length > 0) {
            // Ελέγχουμε αν ο χρήστης είχε διαλέξει κάτι προηγουμένως, αλλιώς παίρνουμε το φθηνότερο (index 0)
            let selectedIndex = 0; 
            if (userSelections[item.name]) {
                const foundIndex = options.findIndex(o => o.productName === userSelections[item.name].productName && o.store === userSelections[item.name].store);
                if (foundIndex !== -1) selectedIndex = foundIndex;
            } else {
                // Αν δεν έχει διαλέξει, αποθηκεύουμε την προεπιλογή (το φθηνότερο)
                userSelections[item.name] = options[0];
            }

            selectHtml = `<select class="product-select" onchange="handleSelection('${item.name}', this.value)">
                ${options.map((opt, index) => `
                    <option value="${index}" ${index === selectedIndex ? 'selected' : ''}>
                        ${opt.displayName}
                    </option>
                `).join('')}
            </select>`;
            
            // Αποθηκεύουμε τις επιλογές για να τις διαβάζει η handleSelection
            item.availableOptions = options;
        } else {
            selectHtml = `<div style="color:#ff5252; font-size:0.9em; margin-top:5px;">Μη διαθέσιμο στα επιλεγμένα καταστήματα.</div>`;
        }

        return `
            <div class="shopping-item">
                <div class="item-header">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">${item.qty}</span>
                </div>
                ${selectHtml}
            </div>
        `;
    }).join('');

    listContainer.innerHTML = html;
    updateTotals();
}

// --- 8. ΟΤΑΝ Ο ΧΡΗΣΤΗΣ ΑΛΛΑΖΕΙ ΕΠΙΛΟΓΗ ΑΠΟ ΤΟ DROPDOWN ---
window.handleSelection = function(itemName, index) {
    const itemTemplate = shoppingListTemplate.find(i => i.name === itemName);
    if (itemTemplate && itemTemplate.availableOptions && itemTemplate.availableOptions[index]) {
        userSelections[itemName] = itemTemplate.availableOptions[index];
        updateTotals();
    }
};

// --- 9. ΕΝΗΜΕΡΩΣΗ ΣΥΝΟΛΟΥ ---
function updateTotals() {
    let total = 0;
    
    // Προσθέτουμε όλες τις επιλογές του χρήστη
    for (let key in userSelections) {
        total += userSelections[key].price;
    }

    const totalElement = document.getElementById('total-cost');
    const perDayElement = document.getElementById('cost-per-day');
    
    if (totalElement) totalElement.innerText = total.toFixed(2) + "€";
    if (perDayElement) perDayElement.innerText = (total / 2 / 7).toFixed(2) + "€";
}
