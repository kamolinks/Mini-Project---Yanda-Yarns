//This javascript file handles the logic of the user profile page, including displaying order history and wishlist items, and allowing users to remove items from their wishlist or reorder past purchases.

import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal");
    const closeBtn = document.getElementById("closeBtn");
    if (closeBtn) {
        closeBtn.onclick = function() {
            if (modal) {
                modal.classList.add("hidden");
            }
        };
    }

    window.onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("You must be logged in to view your profile.");
            modal.classList.remove("hidden");
            return;
        }
        await loadOrderHistory(user);
        await loadWishlist(user);
        
    });

    const profileName = document.getElementById("profileName");

    function updateProfileName(user) {
      if (profileName && user) {
        // Use displayName if set, otherwise fallback to email prefix
        profileName.textContent = user.displayName && user.displayName.trim() !== "" ? user.displayName : user.email.split("@")[0];
      }
    }

    // Update profile name on auth state change
    window.onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("You must be logged in to view your profile.");
        modal.classList.remove("hidden");
        return;
      }
      updateProfileName(user);
      await loadOrderHistory(user);
      await loadWishlist(user);
    });

    // Function to load order history
    async function loadOrderHistory(user) {
        try {
            const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(ordersQuery);
            const orderHistoryContainer = document.getElementById("orderList");
            orderHistoryContainer.innerHTML = "";
            if (querySnapshot.empty) {
                orderHistoryContainer.innerHTML = '<li style="color:#888;padding:1rem;">No order history.</li>';
                return;
            }
            querySnapshot.forEach(doc => {
                const order = doc.data();
                const orderDiv = document.createElement("li");
                orderDiv.classList.add("order-item");
                let orderDate = "Unknown date";
                if (order.Timestamp && typeof order.Timestamp.toDate === "function") {
                  orderDate = order.Timestamp.toDate().toLocaleDateString();
                }
                orderDiv.innerHTML = `
                    <h3>Order on ${orderDate}</h3>
                    <p>Total: R${order.total}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;">
                        ${order.items.map(item => `
                            <div style='display:flex;align-items:center;gap:1rem;background:#f3f4f6;padding:0.5rem 1rem;border-radius:8px;'>
                                <img src='${item.product.imageUrl}' alt='${item.product.name}' style='width:60px;height:60px;border-radius:6px;object-fit:cover;'>
                                <div>
                                    <div style='font-weight:500;'>${item.product.name}</div>
                                    <div>R${item.product.price}</div>
                                    <div>Qty: ${item.quantity}</div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `;
                orderHistoryContainer.appendChild(orderDiv);
            });
        } catch (error) {
            console.error("Error loading order history: ", error);
        }
    }

    async function loadWishlist(user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const wishlist = userDoc.data().wishlist || [];
            const wishlistContainer = document.getElementById("wishlistList");
            wishlistContainer.innerHTML = "";
            if (!wishlist.length) {
                wishlistContainer.innerHTML = '<li style="color:#888;padding:1rem;">Your wishlist is currently empty.</li>';
                return;
            }
            wishlist.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("wishlist-item");
                itemDiv.style.display = "flex";
                itemDiv.style.alignItems = "center";
                itemDiv.style.gap = "1.5rem";
                itemDiv.innerHTML = `
                    <div style="flex-shrink:0;">
                      <img src="${item.imageUrl}" alt="${item.name}" class="wishlist-item-image" style="width:80px;height:80px;border-radius:8px;object-fit:cover;">
                    </div>
                    <div class="wishlist-item-info" style="flex:1;display:flex;flex-direction:column;align-items:flex-start;">
                        <h3 style="margin:0 0 0.5rem 0;">${item.name}</h3>
                        <p style="margin:0 0 0.5rem 0;">R${item.price}</p>
                        <div style="display:flex;gap:0.5rem;">
                          <button class="removeFromWishlistBtn" data-id="${item.id}" style="padding:0.4rem 1rem;background:#e53e3e;color:#fff;border:none;border-radius:4px;cursor:pointer;">Remove</button>
                          <button class="addToCartBtn" data-id="${item.id}" style="padding:0.4rem 1rem;background:#3182ce;color:#fff;border:none;border-radius:4px;cursor:pointer;">Add to Cart</button>
                        </div>
                    </div>
                `;
                wishlistContainer.appendChild(itemDiv);
            });
        } catch (error) {
            console.error("Error loading wishlist: ", error);
        }
    }

    

    // Remove from wishlist handler
    document.getElementById("wishlistList").addEventListener("click", async function(event) {
      const removeBtn = event.target.closest(".removeFromWishlistBtn");
      if (removeBtn) {
        const productId = removeBtn.getAttribute("data-id");
        // Get current user
        const user = auth.currentUser;
        if (!user) return;
        try {
          const userRef = doc(db, "users", user.uid);
          // Get current wishlist
          const userDoc = await getDoc(userRef);
          let wishlist = userDoc.data().wishlist || [];
          // Remove product by id
          wishlist = wishlist.filter(item => item.id !== productId);
          await updateDoc(userRef, { wishlist });
          // Remove from DOM
          removeBtn.closest(".wishlist-item").remove();
        } catch (error) {
          alert("Could not remove from wishlist: " + error.message);
        }
      }
    });

    // Add to cart handler for wishlist
    document.getElementById("wishlistList").addEventListener("click", async function(event) {
      const addBtn = event.target.closest(".addToCartBtn");
      if (addBtn) {
        const productId = addBtn.getAttribute("data-id");
        const user = auth.currentUser;
        if (!user) return;
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          let cart = userDoc.data().cart || [];
          let wishlist = userDoc.data().wishlist || [];
          // Find product in wishlist
          const product = wishlist.find(item => item.id === productId);
          if (!product) return;
          // Check if already in cart
          const cartItem = cart.find(item => item.product.id === productId);
          if (cartItem) {
            cartItem.quantity += 1;
          } else {
            cart.push({ product, quantity: 1 });
          }
          await updateDoc(userRef, { cart });
          alert("Added to cart!");
        } catch (error) {
          alert("Could not add to cart: " + error.message);
        }
      }
    });
});