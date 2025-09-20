/**
 * PRICING CALCULATOR
 * Calculates and displays order costs for tote storage service
 * Formula: $20 trip fee + ($10 × number of totes) for first order
 * 
 * @version 2.0.0 - Removed unused Node.js exports, browser-optimized
 */

/**
 * Calculate the setup cost for the first order
 * @param {number} numTotes - Number of totes being ordered
 * @returns {number} Total setup cost
 */
function calculateSetupCost(numTotes) {
    const TRIP_FEE = 20;
    const COST_PER_TOTE = 10;
    
    if (!numTotes || numTotes < 2 || numTotes > 10) {
        return 0; // Don't show cost for invalid input
    }
    
    return TRIP_FEE + (COST_PER_TOTE * numTotes);
}

/**
 * Format the setup cost display message
 * @param {number} totalCost - Total calculated cost
 * @param {number} numTotes - Number of totes
 * @returns {string} Formatted cost message
 */
function formatCostMessage(totalCost, numTotes) {
    const monthlyFee = numTotes * 10;
    return `Setup Cost: $${totalCost} ($20 trip fee + $${monthlyFee} first monthly fee)`;
}

/**
 * Update the pricing display for a form
 * @param {HTMLElement} toteInput - The tote number input element
 * @param {HTMLElement} costDisplay - The cost display element
 */
function updatePricingDisplay(toteInput, costDisplay) {
    const numTotes = parseInt(toteInput.value) || 0;
    
    // Check if user entered 0 or 1 totes
    if (numTotes === 1 || (numTotes === 0 && toteInput.value !== '')) {
        costDisplay.innerHTML = 'Minimum of two totes';
        costDisplay.style.display = 'block';
        costDisplay.setAttribute('data-cost', '0');
        return;
    }
    
    // Check if user entered more than 10 totes
    if (numTotes > 10) {
        costDisplay.innerHTML = 'Maximum of ten totes';
        costDisplay.style.display = 'block';
        costDisplay.setAttribute('data-cost', '0');
        return;
    }
    
    const setupCost = calculateSetupCost(numTotes);
    
    if (setupCost > 0) {
        const message = formatCostMessage(setupCost, numTotes);
        costDisplay.innerHTML = message;
        costDisplay.style.display = 'block';
        
        // Store the cost for form submission
        costDisplay.setAttribute('data-cost', setupCost);
    } else {
        costDisplay.style.display = 'none';
        costDisplay.setAttribute('data-cost', '0');
    }
}

/**
 * Create and insert a cost display element after the tote input
 * @param {HTMLElement} toteInput - The tote number input element
 * @returns {HTMLElement} The created cost display element
 */
function createCostDisplay(toteInput) {
    // Check if cost display already exists
    const existingDisplay = toteInput.parentNode.querySelector('.cost-display');
    if (existingDisplay) {
        return existingDisplay;
    }
    
    // Create cost display element
    const costDisplay = document.createElement('div');
    costDisplay.className = 'cost-display';
    costDisplay.style.cssText = `
        font-size: 1rem;
        color: #FFF;
        font-style: italic;
        display: none;
        text-align: center;
        margin-bottom: 1rem;
    `;
    
    // Insert after the tote input's parent form-group
    const formGroup = toteInput.closest('.form-group');
    if (formGroup && formGroup.parentNode) {
        formGroup.parentNode.insertBefore(costDisplay, formGroup.nextSibling);
    }
    
    return costDisplay;
}

/**
 * Initialize pricing calculator for a specific form
 * @param {string} toteInputSelector - CSS selector for the tote input field
 */
function initPricingForForm(toteInputSelector) {
    const toteInput = document.querySelector(toteInputSelector);
    
    if (!toteInput) {
        console.log(`Pricing: Tote input not found with selector: ${toteInputSelector}`);
        return;
    }
    
    // Create cost display element
    const costDisplay = createCostDisplay(toteInput);
    
    // Add event listeners for real-time updates
    ['input', 'change', 'keyup'].forEach(eventType => {
        toteInput.addEventListener(eventType, function() {
            updatePricingDisplay(toteInput, costDisplay);
        });
    });
    
    // Initial calculation if there's already a value
    if (toteInput.value) {
        updatePricingDisplay(toteInput, costDisplay);
    }
    
    console.log(`Pricing calculator initialized for: ${toteInputSelector}`);
}

/**
 * Get the current order cost from a form's cost display
 * @param {HTMLElement} form - The form element
 * @returns {number} Current order cost or 0
 */
function getOrderCost(form) {
    const costDisplay = form.querySelector('.cost-display');
    if (costDisplay) {
        return parseInt(costDisplay.getAttribute('data-cost')) || 0;
    }
    return 0;
}

/**
 * Initialize pricing calculators for all forms on the page
 */
function initPricingCalculators() {
    // Initialize for hero form (index page)
    initPricingForForm('#hero-tote_number');
    
    // Initialize for contact form (contact page)  
    initPricingForForm('#tote_number');
    
    console.log('Pricing calculators initialized for all forms');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure forms are fully initialized
    setTimeout(initPricingCalculators, 100);
});

// Export functions to global scope for browser compatibility
window.getOrderCost = getOrderCost;
window.calculateSetupCost = calculateSetupCost;
