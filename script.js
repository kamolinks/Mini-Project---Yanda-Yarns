// Kamogelo Tsele  (TSLKAM002)
// This script file contains the logic of the web app
import { getProducts } from "./firebaseauth.js";
import { saveUserCart } from "./firebaseauth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
console.log("Script loaded");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM LOADED");
  
  let mode = 'login'; // Default mode is login
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const accountLink = document.querySelector(".account-link");
  const button = document.getElementById("authButton");
  const toggleText = document.getElementById("toggleText");
  const closeBtn = document.getElementById("closeBtn");
  let cart = [];
  let products = [];

  // Open modal when account link or icon is clicked
  if (accountLink) {
    accountLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (modal) {
        modal.style.display = "flex";
      }
    });
  }

  // Close modal when close button (X) is clicked
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modal) {
        modal.style.display = "none";
      }
    });
  }

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (modal && event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Toggle between login and signup modes
  function toggleMode(e) {
    e.preventDefault();

    if (mode === 'login') {
      mode = 'signup';
      title.textContent = "Create Account";
      button.textContent = "Sign Up";
      toggleText.innerHTML = `Already have an account? <a href="#" id="signUp">Login</a>`;
    } else {
      mode = 'login';
      title.textContent = "Login";
      button.textContent = "Login";
      toggleText.innerHTML = `Don't have an account? <a href="#" id="signUp">Signup</a>`;
    }

    // Reattach event listener to the new link
    const newSignUpLink = document.getElementById("signUp");
    if (newSignUpLink) {
      newSignUpLink.removeEventListener("click", toggleMode);
      newSignUpLink.addEventListener("click", toggleMode);
    }
  }

  // Attach initial event listener
  const signUpLink = document.getElementById("signUp");
  if (signUpLink) {
    signUpLink.addEventListener("click", toggleMode);
  }

 // getting a user to login/sign up
  const authButton = document.getElementById("authButton");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");


  if (authButton) {
    authButton.addEventListener('click', async () => {
      const email = authEmail.value;
      const password = authPassword.value;

      // Check if email and password are provided
      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      try {
        if (mode === 'login') {
          const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
          alert('Login successful!');
        } else {
          const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
          await window.setDoc(window.doc(window.db, "users", userCredential.user.uid), {
            email: email,
            createdAt: new Date(),
            role: "customer"
          });
          alert('Account created!');
        }

        // Clear the form
        authEmail.value = '';
        authPassword.value = '';
        modal.style.display = "none"; // Close modal on success
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }

  //check if a user is logged in or not
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showLoggedInView(user);
      loadUserCart(); // Load cart from Firestore and update cart count
    } else {
      showLoggedOutView();
      cartCount.textContent = '0'; // Reset cart count when logged out
    }
  });
  
  // if the user is logged in
  const greeting = document.getElementById("userGreeting");
  const logoutBtn = document.getElementById("logoutBtn");

  function showLoggedInView(user) {
    const userName = user.email.split('@')[0]; // Get name from email before @
    greeting.textContent = `Hi, ${userName}`;
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
    }
  }

  function showLoggedOutView() {
    greeting.textContent = '';
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
  }

  // Add logout button click handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        alert('Signed out successfully!');
        showLoggedOutView();
        // Clear cart and update cart count to 0 after logout
        cart = [];
        updateCartItems();
      } catch (error) {
        alert('Error signing out: ' + error.message);
      }
    });
  }


  document.getElementById("userIcon").addEventListener("click", (e) => {
    e.preventDefault();
    if (modal) {
      modal.style.display = "flex";
    }
  });

    //Show user cartCount when logged in
    async function loadUserCart() {
      if (!auth.currentUser) {
        console.warn("No user logged in, cannot load cart.");
        return;
      }
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        cart = docSnap.data().cart || [];
        updateCartItems();
      }
    }

  


const bestSellersContainer = document.getElementById("best-sellers-container");
async function loadProducts() {
  try {
    const snapshot = await getProducts();
    console.log('Fetched products snapshot:', snapshot);
    bestSellersContainer.innerHTML = "";
    products = [];
    snapshot.forEach((doc) => {
      const product = doc.data();
      products.push({ ...product, id: doc.id });
      console.log('Product:', product);
      bestSellersContainer.innerHTML += `
        <article class="group product-card">
          <div class="product-media">
            <img loading="lazy" src="${product.image || product.imageUrl || ''}" alt="${product.name}" class="product-image"/>
            <button type="button" aria-label="Quick view" class="quick-view-button">
              <img src="https://api.iconify.design/lucide-eye.svg?color=%23e5e7eb" alt="Eye Icon" class="quick-view-icon"/>
            </button>
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price-row">
              <span class="product-price">R${product.price}</span>
              <button type="button" class="add-to-cart-button" data-product-id="${doc.id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    });
    if (snapshot.empty) {
      console.warn('No top-seller products found.');
      bestSellersContainer.innerHTML = '<p>No top-seller products found.</p>';
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}
loadProducts();

  //add to cart functionality using event delegation
  bestSellersContainer.addEventListener("click", async (event) => {
    if (event.target.classList.contains("add-to-cart-button")) {
      const productId = event.target.dataset.productId;
      const selectedProduct = products.find(p => p.id === productId);
      const exisistingItem = cart.find(item => item.product.id === productId);

      if (exisistingItem) {
        exisistingItem.quantity += 1;
      } else {
        cart.push({ product: selectedProduct, quantity: 1 });
      }

      updateCartItems();
      saveCartToFirestore();
    }
  });

  // Function to update cart count badge in the UI
  function updateCartItems() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
  }

  // Initialize cart count on page load
  updateCartItems();

  // Function to save cart to Firestore
  function saveCartToFirestore() {
    const user = auth.currentUser;

    if(!user) return; // User must be logged in to save cart

    saveUserCart(user.uid, cart);
  }

  //open cart when cart icon is clicked

  const cartIcon = document.getElementById("cartIcon");
  const cartModal = document.getElementById("cartModal");
  const closeCartBtn = document.getElementById("closeCartBtn");
  console.log(cartIcon);
  console.log(cartModal);
  cartIcon.addEventListener("click", async () => {
    cartModal.classList.remove("hidden");
    await loadCart();
  });

  closeCartBtn.addEventListener("click", () => {
    cartModal.classList.add("hidden");
  });

  // Function to load cart items into the cart modal
  async function loadCart() {
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("cartTotal");
    cartItems.innerHTML = "";
    let total = 0;

    // Read cart from user document (not subcollection)
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    let userCart = [];
    if (docSnap.exists()) {
      userCart = docSnap.data().cart || [];
    }

    userCart.forEach((item) => {
      total += item.product.price * item.quantity;
      cartItems.innerHTML += `
        <div class="cart-item" data-product-id="${item.product.id}">
          <img src="${item.product.image || item.product.imageUrl || ''}" alt="${item.product.name}" class="cart-item-image"/>
          <div class="cart-item-info">
            <h4>${item.product.name}</h4>
            <p>Price: R${item.product.price}</p>
            <p>Quantity: <span class="cart-qty">${item.quantity}</span></p>
            <button class="increase-qty">+</button>
            <button class="decrease-qty">-</button>
          </div>
        </div>
      `;
    });

    totalPrice.textContent = total.toFixed(2);
  }

  // Event delegation for cart item quantity buttons
  cartItems.addEventListener("click", async (event) => {
    const cartItemDiv = event.target.closest(".cart-item");
    if (!cartItemDiv) return;
    const productId = cartItemDiv.getAttribute("data-product-id");
    if (!productId) return;

    // Get latest cart from Firestore
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    let userCart = docSnap.exists() ? docSnap.data().cart || [] : [];

    // Find item index
    const itemIndex = userCart.findIndex(item => item.product.id === productId);
    if (itemIndex === -1) return;

    if (event.target.classList.contains("increase-qty")) {
      userCart[itemIndex].quantity += 1;
    } else if (event.target.classList.contains("decrease-qty")) {
      if (userCart[itemIndex].quantity > 1) {
        userCart[itemIndex].quantity -= 1;
      } else {
        userCart.splice(itemIndex, 1);
      }
    } else {
      return;
    }

    // Save updated cart
    await saveUserCart(auth.currentUser.uid, userCart);
    await loadCart();
    updateCartItems();
  });

  //increase quantity of a cart item
  async function increaseQty(productId) {
    const docRef = doc(db, "users", auth.currentUser.uid, productId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    await updateDoc(docRef, {
      quantity: data.quantity + 1
    });
    await loadCart();
  }

  //decrease quantity of a cart item
  async function decreaseQty(productId) {
    const docRef = doc(db, "users", auth.currentUser.uid, productId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    if (data.quantity > 1) {
      await updateDoc(docRef, {
        quantity: data.quantity - 1
      });
    } else {
      await deleteDoc(docRef);
    }
    await loadCart();
  }

});



