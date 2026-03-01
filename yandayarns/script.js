// Kamogelo Tsele  (TSLKAM002)
// This script file contains the logic of the web app
import { getProducts } from "./firebaseauth.js";
import { saveUserCart } from "./firebaseauth.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
 let cart = [];
 let products = [];
 let wishlist = [];
 let orderHistory = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile logout button functionality
    const logoutMobileBtn = document.querySelector('.logout-mobile');
    if (logoutMobileBtn) {
      logoutMobileBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          alert('Signed out successfully!');
          window.location.href = 'index.html';
        } catch (error) {
          alert('Error signing out: ' + error.message);
        }
      });
    }
  let mode = 'login'; // Default mode is login
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const accountLink = document.querySelector(".account-link");
  const button = document.getElementById("authButton");
  const toggleText = document.getElementById("toggleText");
  const closeBtn = document.getElementById("closeBtn");
  const cartLink = document.querySelector('.sidebar .nav-link[href=""]');
  const sidebar = document.querySelector('.sidebar');
  const cartModal = document.getElementById('cartModal');

  // Show cart modal on mobile when cart-button-mobile is clicked
  const cartButtonMobile = document.querySelector('.cart-button-mobile');
  if (cartButtonMobile && cartModal) {
    cartButtonMobile.addEventListener('click', async function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        cartModal.classList.remove('hidden');
        cartModal.style.removeProperty('display');
        await loadCart();
      }
    });
  }
  // Log current user on page load
  if (typeof auth !== "undefined") {
    console.log("Current user on load:", auth.currentUser);
  }

  if (cartLink && sidebar && cartModal) {
    cartLink.addEventListener('click', function(e) {
      if (window.innerWidth < 768) {
        e.preventDefault();
        sidebar.style.display = 'none';
        cartModal.classList.remove('hidden');
        cartModal.style.removeProperty('display');
      }
    });
  }
  

  // Quick view button functionality: redirect to item description page
  document.addEventListener("click", (event) => {
    const quickViewBtn = event.target.closest(".quick-view-button");
    if (!quickViewBtn) return;
    const productCard = quickViewBtn.closest(".product-card");
    if (!productCard) return;
    const productName = productCard.querySelector(".product-name")?.textContent;
    // Find product by name (or use id if available)
    const selectedProduct = products.find(p => p.name === productName);
    if (!selectedProduct) return;
    // Redirect to item description page with product id as query param
    window.location.href = `itemDescription.html?id=${selectedProduct.id}`;
  });
  
  // cart function if the user is not logged in.
  function saveCartLocally(){
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function loadCartFromLocalStorage(){
    const savedCart = localStorage.getItem("cart");
    if(savedCart){
      cart = JSON.parse(savedCart);
    }
    updateCartItems(); // Always update badge, even if cart is empty
  }

  loadCartFromLocalStorage();

  // Open modal when account link or icon is clicked
  if (accountLink) {
    accountLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof auth !== "undefined") {
        console.log("Current user on icon click:", auth.currentUser);
      }
      // If user is logged in, go to profile page
      if (typeof auth !== "undefined" && auth.currentUser) {
        window.location.href = "profile.html";
        return;
      }
      if (modal) {
        modal.classList.remove("hidden");
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

    const authNameInput = document.getElementById("authName");

    if (mode === 'login') {
      mode = 'signup';
      title.textContent = "Create Account";
      button.textContent = "Sign Up";
      toggleText.innerHTML = `Already have an account? <a href="#" id="signUp">Login</a>`;
      if (authNameInput) authNameInput.style.display = "block";
    } else {
      mode = 'login';
      title.textContent = "Login";
      button.textContent = "Login";
      toggleText.innerHTML = `Don't have an account? <a href="#" id="signUp">Signup</a>`;
      if (authNameInput) authNameInput.style.display = "none";
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

  //check if user is an admin
  async function checkAdmin(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.data().role === "admin") {
    window.location.href = "admin.html";
  }
}

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
          checkAdmin(userCredential.user);
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
      // For guests, reload cart from localStorage and update badge
      loadCartFromLocalStorage();
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
    if (logoutMobileBtn) {
      logoutMobileBtn.style.display = 'none';
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

  
    //function to create product cards and display products on the page
    function createProductCard(product, id) {
      return`
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
              <button type="button" class="wishlist-button" aria-label="Add to wishlist">
                <img src="images/wishlist icon.svg" alt="Wishlist Icon" class="heart-icon" />
              </button>
              <button type="button" class="add-to-cart-button" data-product-id="${id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `
    }

    //a function to load products from firestore and display them on the page
    async function loadProducts(container, filterFn=null) {
      try{
        const snapshot = await getProducts();
        container.innerHTML = "";

        if (snapshot.empty) {
          container.innerHTML = "<p>No products found.</p>";
          return;
        }

        snapshot.forEach((doc) => {
          const product = { ...doc.data(), id: doc.id };
          // Add to global products array if not already present
          if (!products.some(p => p.id === product.id)) {
            products.push(product);
          }
          // Apply filter if provided
          if (!filterFn || filterFn(product)) {
            container.innerHTML += createProductCard(product, doc.id);
          }
        });

      } catch (error) {
        console.error("Error loading products:", error);
      }
    }
    

    
  loadProducts(document.querySelector("#best-sellers-container"), 
  (product) => product["topSeller"] === true);

  loadProducts(document.querySelector(".on-sale-container .product-grid"), 
  (product) => product["onSale"] === true);

  loadProducts(document.querySelector("#shop-products-section .product-grid"));

    

  //add to cart button functionality
  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".add-to-cart-button");
    if (!button) return;
    const productId = button.dataset.productId;
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      alert('Product not found!');
      return;
    }
    const existingItem = cart.find(item => item.product.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ product: selectedProduct, quantity: 1 });
    }

    updateCartItems();

    if (auth.currentUser) {
      saveCartToFirestore();
    } else {
      saveCartLocally();
    }
  });


  // Function to update cart count badge in the UI
  function updateCartItems() {
    const cartCountDesktop = document.getElementById("cartCountDesktop");
    const cartCountMobile = document.getElementById("cartCountMobile");
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCountDesktop) cartCountDesktop.textContent = totalItems;
    if (cartCountMobile) cartCountMobile.textContent = totalItems;
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

  const closeCartBtn = document.getElementById("closeCartBtn");
  console.log(cartIcon);
  console.log(cartModal);
  cartIcon.addEventListener("click", async () => {
    cartModal.classList.remove("hidden");
    cartModal.style.removeProperty('display');
    await loadCart();
  });

  closeCartBtn.addEventListener("click", () => {
    cartModal.classList.add("hidden");
    cartModal.style.removeProperty('display');
  });

  // Function to load cart items into the cart modal
  async function loadCart() {
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("cartTotal");
    cartItems.innerHTML = "";
    let total = 0;

    let userCart = [];
    if (auth.currentUser) {
      // Logged-in: load cart from Firestore
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        userCart = docSnap.data().cart || [];
      }
    } else {
      // Guest: load cart from localStorage
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        userCart = JSON.parse(savedCart);
      }
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
            <div class="cart-item-qty-controls">
              <button class="increase-qty">+</button>
              <button class="decrease-qty">-</button>
            </div>
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

    let userCart = [];
    if (auth.currentUser) {
      // Logged-in: get cart from Firestore
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      userCart = docSnap.exists() ? docSnap.data().cart || [] : [];
    } else {
      // Guest: get cart from localStorage
      const savedCart = localStorage.getItem("cart");
      userCart = savedCart ? JSON.parse(savedCart) : [];
    }

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
    if (auth.currentUser) {
      await saveUserCart(auth.currentUser.uid, userCart);
    } else {
      localStorage.setItem("cart", JSON.stringify(userCart));
    }
    await loadCart();
    cart = userCart;
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

  //goto checkout button
  const goToCheckoutBtn = document.getElementById("goToCheckout");
  if (goToCheckoutBtn) {
    goToCheckoutBtn.addEventListener("click", async () => {
      cartModal.classList.add("hidden");
      window.location.href = "checkout.html";
    });
  }

  const checkoutButton = document.getElementById("checkoutButton");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", async () => {
      // Get cart from user document
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      let userCart = docSnap.exists() ? docSnap.data().cart || [] : [];

      if (userCart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      // Save order to "orders" collection using window.addDoc and window.collection
      await window.addDoc(window.collection(window.db, "orders"), {
        userId: auth.currentUser.uid,
        items: userCart,
        total: userCart.reduce((total, item) => total + item.product.price * item.quantity, 0),
        createdAt: new Date()
      });

      // Clear cart array in user document
      await saveUserCart(auth.currentUser.uid, []);
      cart = [];
      alert("Order placed successfully!");
      await loadCart();
      updateCartItems();
    });
  }

  // Wishlist heart icon toggle and add to wishlist
  document.addEventListener("click", function(event) {
    const heart = event.target.closest(".heart-icon");
    if (heart) {
      heart.classList.toggle("selected");
      // Find the product card and get product id
      const productCard = heart.closest(".product-card");
      if (productCard) {
        const productName = productCard.querySelector(".product-name")?.textContent;
        const product = products.find(p => p.name === productName);
        if (product) {
          addToWishlist(product);
        }
      }
    }
  });

  // Add product to user's wishlist in Firestore
  async function addToWishlist(product) {
    if (!auth.currentUser) {
      modal.classList.remove("hidden");
      return;
    }
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        wishlist: arrayUnion(product)
      });
      alert("Added to wishlist!");
    } catch (error) {
      alert("Could not add to wishlist: " + error.message);
    }
  };

  //search functionality
  const searchInput = document.querySelector(".search-input");
  const searchInputMobile = document.querySelector(".search-input-mobile");
  const searchButton = document.getElementById("searchButton");
  if (searchInput || searchInputMobile) {
    const handleSearchInput = (input) => {
      input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const filteredProducts = products.filter(product => 
          matchesSearchQuery(product, query)
        );
      const container = document.querySelector("#shop-products-section .product-grid");
      if (container) {
        container.innerHTML = "";
        filteredProducts.forEach(product => {
          container.innerHTML += createProductCard(product, product.id);
        });
      }
    });
    }
    handleSearchInput(searchInput);
    handleSearchInput(searchInputMobile);
  }

  if (searchButton && searchInput) {
    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
      } else {
        window.location.href = "shop.html";
      }
    });
  }

  function matchesSearchQuery(product, query) {
    if (!product) return false;

    const words = query.split(" ");
    return words.some(word =>
      product.name.toLowerCase().includes(word) ||
      product.description.toLowerCase().includes(word) ||
      product.category.toLowerCase().includes(word) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(word)))
    );
  }




});










