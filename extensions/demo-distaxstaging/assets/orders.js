window.showOrderDeletePop = function(orderId) {
    const popup = document.getElementById('deleteorderpopupModal-' + orderId);
    if (popup) popup.style.display = 'flex';
};

window.closeOrderDeletePop = function(orderId) {
    const popup = document.getElementById('deleteorderpopupModal-' + orderId);
    if (popup) popup.style.display = 'none';
};

async function cancelOrder(button, storeUrl) {
    const orderId = button.getAttribute('data-order-id');
    
    try {
        const { cancelOrderBehavior, script } = window.accountSettings;
        console.log('Cancel Order Behavior:', cancelOrderBehavior, 'Script:', script);
        if (cancelOrderBehavior === "script" && script) {
            try {
                closeOrderDeletePop(orderId);
                // Expose orderId and storeUrl as globals so admin script can
                // reference them (e.g. use window._orderToCancel).
                try {
                    window._orderToCancel = orderId;
                    window._orderStoreUrl = storeUrl;
                    // Use indirect eval to execute in global scope
                    (0, eval)(script);
                } finally {
                    try { delete window._orderToCancel; } catch (e) {}
                    try { delete window._orderStoreUrl; } catch (e) {}
                }
            } catch (e) {
                console.error("Error running stored script:", e);
                alert('Order cancellation script failed to execute properly.');
            }
        } else {
            try {
                const cancelResponse = await fetch('/apps/account-page/app/apiordercancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ orderId, storeUrl }),
                });

                const cancelData = await cancelResponse.json();

                if (cancelData.success) {
                    closeOrderDeletePop(orderId);
                    button.disabled = true;
                    button.innerText = 'Order Cancelled';
                    window.location.reload();
                } else {
                    alert('Failed to cancel order. Please try again later.');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during order cancellation.');
            }
        }
    } catch (error) {
        console.error('Error in cancellation process:', error);
        alert('An error occurred while processing your request.');
    }
}


async function handleSingleProduct(button) {
    const variantId = button.dataset.variantId;
    const originalText = button.textContent;
    try {
        // Prevent double clicks and show progress
        button.disabled = true;
        button.textContent = 'Processing...';

        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity: 1 }),
        });

        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }

        // Navigate to checkout after successful add
        window.location.href = '/checkout';
    } catch (err) {
        console.error('Error in handleSingleProduct:', err);
        alert("Couldn't prepare your order. Please try again.");
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function handleBuyAgain(button) {
    const originalText = button.textContent;
    try {
        // Prevent double clicks
        button.disabled = true;
        button.textContent = 'Processing...';
        const orderDetails = button.closest('.order-details');
        if (!orderDetails) throw new Error("Order details not found");
        const productItems = orderDetails.querySelectorAll('.ordered-product');
        if (productItems.length === 0) throw new Error("No products found");
        for (const item of productItems) {
            const variantId = item.querySelector('.view-product')?.getAttribute('data-variant-id');
            if (!variantId) continue;
            // Robustly find the quantity element (there are multiple .item-price elements)
            const qtyEl = Array.from(item.querySelectorAll('.item-price')).find(el => /qty/i.test(el.textContent));
            const quantity = qtyEl ? parseInt(qtyEl.querySelector('span')?.textContent?.trim() || '1', 10) : 1;

            // Use same-origin /cart/add.js to avoid CORS and add the item to the customer's cart
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: variantId, quantity: quantity })
            });

            if (!response.ok) {
                throw new Error(`Failed to add variant ${variantId}`);
            }
        }
        // Redirect to checkout once all items are added
        window.location.href = '/checkout';
    } catch (error) {
        console.error("Error in handleBuyAgain:", error);
        alert("Couldn't prepare your order. Please try again.");
        button.disabled = false;
        button.textContent = originalText;
    }
}

function view_product(buttonUrl) {
    const url = buttonUrl.getAttribute('data-url');
    if (url) {
        window.location.href = url;
    }
}

function showProducts(index) {
    if (document.querySelectorAll('.order-details-layout')) {
        const orderDetails = document.querySelectorAll('.order-details');
        orderDetails.forEach((detail) => detail.classList.add('hidden'));
        renderPage();
    }
}

function showLogs(index) {
    if (document.querySelectorAll('.order-page-item')) {
        const items = document.querySelectorAll('.order-page-item');
        items.forEach((item) => (item.style.display = 'none'));
        const pagination = document.querySelector('.pagination');
        pagination.style.display = 'none';
        document.querySelector(`.order-details[data-order-index="${index}"]`).classList.remove('hidden');
    }
}

let currentPage = 1;
const itemsPerPage = 2;
const items = document.querySelectorAll('.order-page-item');
const totalPages = Math.ceil(items.length / itemsPerPage);

function renderPage() {
    const items = document.querySelectorAll('.order-page-item');
    const orderDetails = document.querySelectorAll('.order-details');
    const pagination = document.querySelector('.pagination');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const start = (currentPage - 1) * itemsPerPage;
    const end = currentPage * itemsPerPage;

    items.forEach((item, index) => {
        item.style.display = index >= start && index < end ? 'block' : 'none';
    });

    orderDetails.forEach((detail) => detail.classList.add('hidden'));
    pagination.style.display = 'flex';
    pageNumbersContainer.innerHTML = '';
    const maxVisible = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.add('page-number');
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.setAttribute('onclick', `goToPage(${i})`);
        pageNumbersContainer.appendChild(pageBtn);
    }

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage();
        scrollToTopOnMobile();
    }
}

function nextPage() {
    const items = document.querySelectorAll('.order-page-item');
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderPage();
        scrollToTopOnMobile();
    }
}

function goToPage(page) {
    currentPage = page;
    renderPage();
    scrollToTopOnMobile();
}

// Scroll to top on mobile when pagination changes
function scrollToTopOnMobile() {
    // Only scroll on mobile (max-width: 768px)
    if (window.innerWidth <= 768) {
        const orderContainer = document.querySelector('.orders-main-container');
        if (orderContainer) {
            orderContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderPage();
});
