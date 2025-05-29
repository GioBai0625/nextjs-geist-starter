// Data structures
let products = [];
let transactions = [];
let inventory = {};

// DOM Elements
let productForm;
let transactionForm;
let productSelect;
let inventoryStatus;
let transactionHistory;
let fifoReport;

// Initialize DOM elements when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    productForm = document.getElementById('productForm');
    transactionForm = document.getElementById('transactionForm');
    productSelect = document.getElementById('transactionProduct');
    inventoryStatus = document.getElementById('inventoryStatus');
    transactionHistory = document.getElementById('transactionHistory');
    fifoReport = document.getElementById('fifoReport');

    // Add event listeners
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {

// Product Form Handler
function handleProductSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value;

    // Check if product already exists
    if (products.some(p => p.id === productId)) {
        alert('Product ID already exists!');
        return;
    }

    // Add new product
    products.push({ id: productId, name: productName });
    inventory[productId] = [];
    
    // Update product select options
    updateProductSelect();
    
    // Clear form
    productForm.reset();
    
    // Update display
    updateInventoryStatus();
});

}

// Transaction Form Handler
function handleTransactionSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('transactionProduct').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);

    // Create transaction
    const transaction = {
        id: Date.now(),
        date: new Date(),
        productId,
        type,
        quantity,
        unitCost
    };

    // Process transaction
    if (type === 'purchase') {
        processPurchase(transaction);
    } else {
        processSale(transaction);
    }

    // Add to transactions
    transactions.push(transaction);
    
    // Clear form
    transactionForm.reset();
    
    // Update displays
    updateInventoryStatus();
    updateTransactionHistory();
    updateFifoReport();
});

// Process Purchase
function processPurchase(transaction) {
    inventory[transaction.productId].push({
        date: transaction.date,
        quantity: transaction.quantity,
        unitCost: transaction.unitCost
    });
}

// Process Sale using FIFO
function processSale(transaction) {
    const productInventory = inventory[transaction.productId];
    let remainingQuantity = transaction.quantity;
    let totalCost = 0;
    
    // Check if enough inventory
    const totalAvailable = productInventory.reduce((sum, item) => sum + item.quantity, 0);
    if (totalAvailable < remainingQuantity) {
        alert('Insufficient inventory!');
        return false;
    }

    // Process FIFO
    while (remainingQuantity > 0) {
        const oldestLot = productInventory[0];
        if (oldestLot.quantity <= remainingQuantity) {
            // Use entire lot
            totalCost += oldestLot.quantity * oldestLot.unitCost;
            remainingQuantity -= oldestLot.quantity;
            productInventory.shift();
        } else {
            // Use partial lot
            totalCost += remainingQuantity * oldestLot.unitCost;
            oldestLot.quantity -= remainingQuantity;
            remainingQuantity = 0;
        }
    }

    transaction.totalCost = totalCost;
    transaction.averageCost = totalCost / transaction.quantity;
    return true;
}

// Update Product Select
function updateProductSelect() {
    productSelect.innerHTML = '<option value="">Select a product</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.id} - ${product.name}`;
        productSelect.appendChild(option);
    });
}

// Update Inventory Status Display
function updateInventoryStatus() {
    inventoryStatus.innerHTML = '';
    products.forEach(product => {
        const productInventory = inventory[product.id];
        const totalQuantity = productInventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = productInventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        
        const div = document.createElement('div');
        div.className = 'py-4';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-medium">${product.name}</h3>
                    <p class="text-sm text-gray-500">ID: ${product.id}</p>
                </div>
                <div class="text-right">
                    <p class="font-medium">${totalQuantity} units</p>
                    <p class="text-sm text-gray-500">Value: $${totalValue.toFixed(2)}</p>
                </div>
            </div>
        `;
        inventoryStatus.appendChild(div);
    });
}

// Update Transaction History Display
function updateTransactionHistory() {
    transactionHistory.innerHTML = '';
    [...transactions].reverse().slice(0, 10).forEach(transaction => {
        const product = products.find(p => p.id === transaction.productId);
        const div = document.createElement('div');
        div.className = 'py-4';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-medium">${product.name}</h3>
                    <p class="text-sm text-gray-500">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} - 
                        ${transaction.quantity} units
                    </p>
                </div>
                <div class="text-right">
                    <p class="font-medium">$${transaction.unitCost.toFixed(2)}/unit</p>
                    <p class="text-sm text-gray-500">
                        ${transaction.date.toLocaleDateString()}
                    </p>
                </div>
            </div>
        `;
        transactionHistory.appendChild(div);
    });
}

// Update FIFO Report Display
function updateFifoReport() {
    fifoReport.innerHTML = '';
    const salesTransactions = transactions.filter(t => t.type === 'sale');
    
    [...salesTransactions].reverse().slice(0, 10).forEach(transaction => {
        const product = products.find(p => p.id === transaction.productId);
        const div = document.createElement('div');
        div.className = 'py-4';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-medium">${product.name}</h3>
                    <p class="text-sm text-gray-500">
                        Sold ${transaction.quantity} units
                    </p>
                </div>
                <div class="text-right">
                    <p class="font-medium">Total Cost: $${transaction.totalCost.toFixed(2)}</p>
                    <p class="text-sm text-gray-500">
                        Avg. Cost: $${transaction.averageCost.toFixed(2)}/unit
                    </p>
                </div>
            </div>
        `;
        fifoReport.appendChild(div);
    });
}
