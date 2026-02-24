
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

    // Listen for auth state changes and update UI accordingly
    onAuthStateChanged(auth, (user) => {
        if (user) {
            displayOrderSummary(user);
            if (completeOrderBtn) completeOrderBtn.disabled = false;
        } else {
            cartItemsSummary.innerHTML = "<p>Please log in to see your order summary.</p>";
            subTotalElement.textContent = "R0";
            totalElement.textContent = "R0";
            if (completeOrderBtn) completeOrderBtn.disabled = true;
        }
    });

    async function displayOrderSummary(user) {
        if (!user) {
            cartItemsSummary.innerHTML = "<p>Please log in to see your order summary.</p>";
            subTotalElement.textContent = "R0";
            totalElement.textContent = "R0";
            return;
        }
        // Get cart from user document
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        let userCart = docSnap.exists() ? docSnap.data().cart || [] : [];
        let subTotal = 0;
        cartItemsSummary.innerHTML = "";
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
        totalElement.textContent = `R${subTotal.toFixed(2)}`;
    }

    completeOrderBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!validateCheckoutForm()) {
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to place an order.");
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
        alert("Order placed successfully!");

        // Clear cart array in user document
        await saveUserCart(auth.currentUser.uid, []);
        if (window.cart) window.cart = [];
        if (window.loadCart) await window.loadCart();
        if (window.updateCartItems) window.updateCartItems();
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