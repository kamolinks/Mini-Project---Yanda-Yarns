// This script handles the logic of the item description page.
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { saveUserCart } from "./firebaseauth.js";

document.addEventListener('DOMContentLoaded', () => {

    // Add to cart logic
    let loadedProduct = null;
    let cart = [];

    // Load product details and attach add-to-cart event
    async function loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        console.log('Product ID from URL:', productId);
        if (!productId) {
            console.error('No product ID found in URL');
            return;
        }

        try {
            const db = window.db;
            if (!db || !window.doc || !window.getDoc) {
                console.error('Firestore not initialized or missing global functions');
                return;
            }
            const docRef = window.doc(db, "Products", productId);
            const docSnap = await window.getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                loadedProduct = { ...data, id: productId };
                console.log('Product data loaded:', loadedProduct);
                document.querySelector('.product-detail-image').src = data.imageUrl || '';
                document.querySelector('.product-detail-title').textContent = data.name || '';
                document.querySelector('.product-detail-price').textContent = data.price ? `R${data.price}` : '';
                document.querySelector('.product-detail-description').textContent = data.description || '';

                // Attach add-to-cart event listener after DOM is updated
                const addToCartBtn = document.querySelector('.add-to-cart-primary');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', async () => {
                        if (!loadedProduct) {
                            alert('Product not loaded yet!');
                            return;
                        }
                        // Check if already in cart
                        const existingItem = cart.find(item => item.product.id === loadedProduct.id);
                        if (existingItem) {
                            existingItem.quantity += 1;
                        } else {
                            cart.push({ product: loadedProduct, quantity: 1 });
                        }
                        console.log('Cart before save:', cart);

                        // Save cart to Firestore if user is logged in
                        const auth = window.auth;
                        if (auth && auth.currentUser) {
                            const userId = auth.currentUser.uid;
                            if (window.saveUserCart) {
                                try {
                                    await window.saveUserCart(userId, cart);
                                    console.log('Cart saved to Firestore for user:', userId);
                                    alert('Added to cart!');
                                } catch (err) {
                                    console.error('Error saving cart to Firestore:', err);
                                    alert('Error saving cart!');
                                }
                            } else {
                                console.error('window.saveUserCart not available');
                            }
                        } else {
                            // Save locally (simple localStorage)
                            localStorage.setItem('cart', JSON.stringify(cart));
                            alert('Added to cart!');
                        }
                    });
                } else {
                    console.error('Add to Cart button not found');
                }
            } else {
                console.error('No product found for ID:', productId);
            }
        } catch (err) {
            console.error('Error loading product details:', err);
        }
    }

    loadProductDetails();

    // Add to cart button event
    document.querySelector('.add-to-cart-primary').addEventListener('click', async () => {
        if (!loadedProduct) {
            alert('Product not loaded yet!');
            return;
        }
        // Check if already in cart
        const existingItem = cart.find(item => item.product.id === loadedProduct.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ product: loadedProduct, quantity: 1 });
        }

        // Save cart to Firestore if user is logged in
        const auth = window.auth;
        if (auth && auth.currentUser) {
            const userId = auth.currentUser.uid;
            if (window.saveUserCart) {
                await window.saveUserCart(userId, cart);
                alert('Added to cart!');
            }
        } else {
            // Save locally 
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Added to cart!');
        }
    });

    // Add to wishlist button event
    document.querySelector('.heart-icon').addEventListener('click', async () => {
        if (!loadedProduct) {
            alert('Product not loaded yet!');
            return;
        }
        let wishlist = [];
        // Try to get existing wishlist from localStorage
        try {
            wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        } catch (e) {
            wishlist = [];
        }
        // Check if already in wishlist
        if (!wishlist.find(item => item.id === loadedProduct.id)) {
            wishlist.push(loadedProduct);
        }

        // Save wishlist to Firestore if user is logged in
        const auth = window.auth;
        if (auth && auth.currentUser) {
            const userId = auth.currentUser.uid;
            const db = window.db;
            if (db && window.doc && window.updateDoc && window.arrayUnion) {
                const userRef = window.doc(db, "users", userId);
                try {
                    await window.updateDoc(userRef, {
                        wishlist: window.arrayUnion(loadedProduct)
                    });
                    alert('Added to wishlist!');
                } catch (err) {
                    console.error('Error saving wishlist to Firestore:', err);
                    alert('Error saving wishlist!');
                }
            } else {
                // Fallback to localStorage
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                alert('Added to wishlist!');
            }
        } else {
            // Save locally
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            alert('Added to wishlist!');
        }
    });
});