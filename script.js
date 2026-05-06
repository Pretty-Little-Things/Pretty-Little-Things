let cart = [];

/* ---------------- 1. FIREBASE LOAD (REALTIME DATABASE) ---------------- */
// Fixed to use the correct database type based on your configuration
async function loadAdminProducts() {
    try {
        // We use the 'db' variable we exposed in index.html
        if (!window.db) {
            console.error("Database not initialized yet.");
            return;
        }

        const { ref, onValue } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
        const productsRef = ref(window.db, 'products');

        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            let grid = document.getElementById("productGrid");
            if (!grid) return;

            grid.innerHTML = "";

            if (data) {
                Object.keys(data).forEach(key => {
                    let p = data[key];
                    let card = document.createElement("div");
                    card.className = "product-card";
                    card.dataset.cat = (p.category || "clothes").toLowerCase();

                    let discountHTML = p.discount ? `<div class="discount-badge">${p.discount}</div>` : "";

                    card.innerHTML = `
                        <img src="${p.image}">
                        ${discountHTML}
                        <h3>${p.name}</h3>
                        <p>KSh ${p.price}</p>
                        <button class="add-cart" data-name="${p.name}" data-price="${p.price}">
                          Add To Cart
                        </button>
                    `;
                    grid.appendChild(card);
                });
            }
            bindAddButtons();
        });

    } catch (err) {
        console.error("Firebase load error:", err);
    }
}

/* ---------------- 2. CART LOGIC ---------------- */

function addToCart(name, price) {
    price = parseInt(price);
    let item = cart.find(p => p.name === name);

    if (item) {
        item.qty++;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    renderCart();
}

function removeOne(name) {
    let item = cart.find(p => p.name === name);
    if (!item) return;

    item.qty--;
    if (item.qty <= 0) {
        cart = cart.filter(p => p.name !== name);
    }
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

/* ---------------- 3. RENDER CART (UI FIXES) ---------------- */

function renderCart() {
    const box = document.getElementById("cartBox");
    if (!box) return;

    box.innerHTML = "";
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        count += item.qty;
        let subtotal = item.price * item.qty;
        total += subtotal;

        let row = document.createElement("div");
        row.className = "cart-item"; // Matches the new CSS

        row.innerHTML = `
            <div class="cart-info">
                <strong>${item.name}</strong><br>
                <small>KSh ${item.price} x ${item.qty}</small>
            </div>
            <div class="cart-controls">
                <button class="remove-btn" data-name="${item.name}">-</button>
                <span>${item.qty}</span>
                <button class="add-more-btn" data-name="${item.name}" data-price="${item.price}">+</button>
            </div>
        `;
        box.appendChild(row);
    });

    document.getElementById("cartCount").textContent = count;
    document.getElementById("cartTotal").textContent = "Total: KSh " + total;
    updateCheckout(total);
}

function updateCheckout(total) {
    let order = "Hi! I want to order from Pretty Little Things:%0A%0A";
    cart.forEach(item => {
        order += `• ${item.name} (x${item.qty}) - KSh ${item.price * item.qty}%0A`;
    });
    order += `%0A*Total: KSh ${total}*`;
    
    document.getElementById("checkoutLink").href = "https://wa.me/254721336459?text=" + order;
}

/* ---------------- 4. BINDING & EVENTS ---------------- */

function bindAddButtons() {
    document.querySelectorAll(".add-cart").forEach(btn => {
        btn.onclick = function() {
            addToCart(this.dataset.name, this.dataset.price);
            this.textContent = "Added ✓";
            this.style.background = "#2d3436";
            setTimeout(() => {
                this.textContent = "Add To Cart";
                this.style.background = "";
            }, 800);
        };
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Start loading products
    loadAdminProducts();

    const cartFab = document.getElementById("cartFab");
    const cartDrawer = document.getElementById("cartDrawer");
    const closeCart = document.getElementById("closeCart");

    cartFab.onclick = () => cartDrawer.classList.toggle("open");
    closeCart.onclick = () => cartDrawer.classList.remove("open");
    document.getElementById("clearCartBtn").onclick = clearCart;

    // Handle +/- clicks inside the cart using delegation
    document.getElementById("cartBox").addEventListener("click", function(e) {
        if (e.target.classList.contains("remove-btn")) {
            removeOne(e.target.dataset.name);
        }
        if (e.target.classList.contains("add-more-btn")) {
            addToCart(e.target.dataset.name, e.target.dataset.price);
        }
    });

    // Copy Till Logic
    document.getElementById("copyTill").onclick = function() {
        navigator.clipboard.writeText("192461");
        this.textContent = "Copied!";
        setTimeout(() => this.textContent = "Copy Till Number", 2000);
    };

    // Category Filter Logic
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            let cat = this.dataset.cat;

            document.querySelectorAll(".product-card").forEach(card => {
                if (cat === "all" || card.dataset.cat === cat) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        };
    });
});