
// Kamogelo Tsele  (TSLKAM002)
// This script file contains the logic of the checkout page
import { saveUserCart } from "./firebaseauth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const cartItemsSummary = document.getElementById("cartItemsSummary");
    const subTotalElement = document.getElementById("subTotal");
    const totalElement = document.getElementById("total");
    const completeOrderBtn = document.getElementById("completeOrder");

    // Helper to complete order programmatically
    async function completeOrderFlow() {
        if (!validateCheckoutForm()) {
            return;
        }
        const user = auth.currentUser;
        if (!user) {
            // Should not happen, but just in case
            return;
        }
        // Collect form values (update IDs as per your HTML)
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;
        const city = document.getElementById("city").value;
        const postalCode = document.getElementById("zip").value;

        // Get cart from user document
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        let userCart = docSnap.exists() ? docSnap.data().cart || [] : [];

        if (userCart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        await setDoc(doc(db, "orders", user.uid + "_" + Date.now()), {
            firstName,
            lastName,
            email,
            address,
            city,
            postalCode,
            userId: user.uid,
            items: userCart,
            total: userCart.reduce((total, item) => total + item.product.price * item.quantity, 0),
            Timestamp: new Date()
        });
        // Show order placed modal
        const orderPlacedModal = document.getElementById("orderPlacedModal");
        if (orderPlacedModal) {
            orderPlacedModal.classList.remove("hidden");
            orderPlacedModal.style.display = "flex";
            // Hide modal and redirect after 3 seconds
            setTimeout(() => {
                orderPlacedModal.style.display = "none";
                window.location.href = "index.html";
            }, 3000);
        } else {
            alert("Order placed successfully!");
            window.location.href = "index.html";
        }

        // Clear cart array in user document
        await saveUserCart(auth.currentUser.uid, []);
        if (window.cart) window.cart = [];
        if (window.loadCart) await window.loadCart();
        if (window.updateCartItems) window.updateCartItems();
    }

    // Listen for auth state changes and update UI accordingly
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if Firestore cart is empty
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            let firestoreCart = docSnap.exists() ? docSnap.data().cart || [] : [];
            if (firestoreCart.length === 0) {
                // Try to migrate guest cart from localStorage
                const guestCart = localStorage.getItem("cart");
                if (guestCart) {
                    try {
                        const parsedCart = JSON.parse(guestCart);
                        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                            await saveUserCart(user.uid, parsedCart);
                            // Optionally clear guest cart
                            // localStorage.removeItem("cart");
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
        displayOrderSummary(user);
        if (completeOrderBtn) completeOrderBtn.disabled = false;
        // If user just logged in after clicking Complete Order, just remove the flag (do not auto-complete order)
        if (user && localStorage.getItem("pendingOrderAfterLogin") === "1") {
            localStorage.removeItem("pendingOrderAfterLogin");
            // Modal should be hidden by your login logic; nothing else to do here
        }
    });

    async function displayOrderSummary(user) {
        let userCart = [];
        if (user) {
            // Logged-in: get cart from Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            userCart = docSnap.exists() ? docSnap.data().cart || [] : [];
        } else {
            // Guest: get cart from localStorage
            const savedCart = localStorage.getItem("cart");
            userCart = savedCart ? JSON.parse(savedCart) : [];
        }
        let subTotal = 0;
        cartItemsSummary.innerHTML = "";
        if (userCart.length === 0) {
            cartItemsSummary.innerHTML = "<p>Your cart is empty.</p>";
            subTotalElement.textContent = "R0";
            document.getElementById("deliveryFee").textContent = "R0";
            totalElement.textContent = "R0";
            return;
        }
        userCart.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            subTotal += itemTotal;
            cartItemsSummary.innerHTML += `
                <div class="order-item">
                    <img src="${item.product.image || item.product.imageUrl || ''}" alt="${item.product.name}" class="order-item-image">
                    <div class="order-item-details">
                        <h4>${item.product.name}</h4>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: R${item.product.price.toFixed(2)}</p>
                        <p>Total: R${itemTotal.toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
        subTotalElement.textContent = `R${subTotal.toFixed(2)}`;
        const deliveryFee = subTotal * 0.10;
        document.getElementById("deliveryFee").textContent = `R${deliveryFee.toFixed(2)}`;
        totalElement.textContent = `R${(subTotal + deliveryFee).toFixed(2)}`;
    }

    completeOrderBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            // Show login modal if not logged in
            const modal = document.getElementById("modal");
            if (modal) {
                modal.classList.remove("hidden");
                modal.style.display = "flex";
            } else {
                alert("You must be logged in to place an order.");
            }
            // Set flag to complete order after login
            localStorage.setItem("pendingOrderAfterLogin", "1");
            return;
        }
        await completeOrderFlow();
    });
});

    // Validate checkout form fields
    function validateCheckoutForm() {
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const address = document.getElementById("address").value.trim();
        const city = document.getElementById("city").value.trim();
        const postalCode = document.getElementById("zip").value.trim();
        const payment = document.querySelector('input[name="payment"]:checked');

        // Simple email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!firstName) {
            alert("Please enter your first name.");
            return false;
        }
        if (!lastName) {
            alert("Please enter your last name.");
            return false;
        }
        if (!email || !emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return false;
        }
        if (!address) {
            alert("Please enter your address.");
            return false;
        }
        if (!city) {
            alert("Please enter your city.");
            return false;
        }
        if (!postalCode) {
            alert("Please enter your ZIP code.");
            return false;
        }
        if (!payment) {
            alert("Please select a payment method.");
            return false;
        }
        return true;
    }