import { getProducts } from "../data/firebaseauth.js";


// Load products and populate table
document.addEventListener('DOMContentLoaded', async function() {
    // Dynamically populate image dropdown
    const imageFilenames = [
      "Beach Hat.jpg","Blue Shrug.jpg","Brown Square Hat.jpg","Brown Vest.jpg","Flower Keychain Set.jpg", 
      "Green Ruffle Hat.jpg","Jesus Hat.jpg","Maize Hat.jpg","Orange Top.jpg",
      "Pattern Tote Bag.jpg","Pink Hair Pin.jpg","Red Scrunchie.jpg",,"Square Vest.jpg","Sunflower Bandana.jpg",
      "The Cat Hat.jpg","The Man Bag.jpg"
    ];
    const imageSelect = document.getElementById("productImageSelect");
    if (imageSelect) {
      imageSelect.innerHTML = '<option value="">-- Select an image --</option>' +
        imageFilenames.map(f => `<option value="${f}">${f}</option>`).join("");
    }
  // Show product form modal when Add New Product is clicked
  const addProductBtn = document.getElementById("addProductBtn");
  const productFormModal = document.getElementById("productFormModal");
  if (addProductBtn && productFormModal) {
    addProductBtn.addEventListener("click", function() {
      productFormModal.classList.remove("hidden");
      productFormModal.style.display = "flex";
    });
    // Close modal on close button click
    const closeBtn = document.getElementById("closeProductForm");
    if (closeBtn) {
      closeBtn.onclick = function(e) {
        productFormModal.classList.add("hidden");
        productFormModal.style.display = "none";
      };
    }
    // Close modal when clicking outside modal-content
    productFormModal.addEventListener("mousedown", function(e) {
      if (e.target === productFormModal) {
        productFormModal.classList.add("hidden");
        productFormModal.style.display = "none";
      }
    });
  }
  // Image file input logic
  const productImageFile = document.getElementById("productImageFile");
  const productImageInput = document.getElementById("productImage");
  if (productImageFile && productImageInput) {
    productImageFile.addEventListener("change", function() {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const url = URL.createObjectURL(file);
        productImageInput.value = url;
      }
    });
  }

  const tableBody = document.getElementById("adminProductTableBody");
  if (!tableBody) return;
  // Add modal for full description
  let descModal = document.getElementById("descModal");
  if (!descModal) {
    descModal = document.createElement("div");
    descModal.id = "descModal";
    descModal.style.display = "none";
    descModal.style.position = "fixed";
    descModal.style.top = "0";
    descModal.style.left = "0";
    descModal.style.width = "100vw";
    descModal.style.height = "100vh";
    descModal.style.background = "rgba(0,0,0,0.4)";
    descModal.style.zIndex = "9999";
    descModal.innerHTML = `<div style="background:#fff;padding:32px 24px;border-radius:12px;max-width:500px;margin:80px auto;text-align:left;position:relative;">
      <span id="descModalClose" style="position:absolute;top:12px;right:18px;font-size:1.5rem;cursor:pointer;">&times;</span>
      <h3>Product Description</h3>
      <div id="descModalContent"></div>
    </div>`;
    document.body.appendChild(descModal);
    document.getElementById("descModalClose").onclick = function() {
      descModal.style.display = "none";
    };
  }
  try {
    const snapshot = await getProducts();
    tableBody.innerHTML = "";
    snapshot.forEach(doc => {
      const product = doc.data();
      const desc = product.description || "";
      const truncated = desc.length > 60 ? desc.slice(0, 60) + "..." : desc;
      tableBody.innerHTML += `
        <tr class="admin-product-row" data-id="${doc.id}">
          <td>${doc.id}</td>
          <td>${product.name || ""}</td>
          <td>${product.costPrice !== undefined ? product.costPrice : ""}</td>
          <td>${product.price !== undefined ? product.price : ""}</td>
          <td>${product.category || ""}</td>
          <td><span class="desc-cell" style="cursor:pointer;color:#333;text-decoration:underline;" data-desc="${encodeURIComponent(desc)}">${truncated}</span></td>
          <td>
            ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product Image" style="max-width:80px;max-height:80px;border-radius:8px;object-fit:cover;" />` : ""}
          </td>
          <td>${product["top-seller"] || product["topSeller"] ? "Yes" : "No"}</td>
          <td>${product["on-sale"] || product["onSale"]? "Yes" : "No"}</td>
        </tr>
      `;
    });

    // Add filter button functionality
    const filterBtn = document.getElementById("filterApplyBtn");
    const filterCombo = document.getElementById("filterByCombo");
    if (filterBtn && filterCombo) {
      filterBtn.addEventListener("click", function() {
        const filterValue = filterCombo.value;
        tableBody.querySelectorAll('.admin-product-row').forEach(row => {
          const categoryCell = row.children[4]; // Category is now the 5th column (index 4)
          const topSellerCell = row.children[7];
          const onSaleCell = row.children[8];
          let show = true;
          if (filterValue === "all") {
            show = true;
          } else if (filterValue === "top-seller") {
            show = topSellerCell && topSellerCell.textContent.trim().toLowerCase() === "yes";
          } else if (filterValue === "on-sale") {
            show = onSaleCell && onSaleCell.textContent.trim().toLowerCase() === "yes";
          } else {
            // For category filter, match exact category
            show = categoryCell && categoryCell.textContent.trim().toLowerCase() === filterValue;
          }
          row.style.display = show ? "" : "none";
        });
      });
    }

    // Add search button functionality
    const searchBtn = document.getElementById("productSearchBtn");
    const searchInput = document.getElementById("productSearchInput");
    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", function() {
        const searchValue = searchInput.value.trim().toLowerCase();
        let found = false;
        tableBody.querySelectorAll('.admin-product-row').forEach(row => {
          const nameCell = row.children[1];
          if (nameCell && nameCell.textContent.trim().toLowerCase() === searchValue) {
            row.classList.add('selected-row');
            row.scrollIntoView({behavior: "smooth", block: "center"});
            found = true;
          } else {
            row.classList.remove('selected-row');
          }
        });
        if (!found) {
          alert("No product found with that name.");
        }
      });
    }
    // Add click handler for description cells
    tableBody.querySelectorAll('.desc-cell').forEach(cell => {
      cell.onclick = function(e) {
        e.stopPropagation();
        const fullDesc = decodeURIComponent(this.getAttribute('data-desc'));
        document.getElementById("descModalContent").textContent = fullDesc;
        descModal.style.display = "flex";
      };
    });

    // Add click handler for product rows
    const adminActionsDiv = document.getElementById("adminActions");
    tableBody.querySelectorAll('.admin-product-row').forEach(row => {
      row.onclick = function() {
        // Remove highlight from all rows
        tableBody.querySelectorAll('.admin-product-row').forEach(r => r.classList.remove('selected-row'));
        // Highlight this row
        this.classList.add('selected-row');
        // Show edit/delete buttons in adminActions div
        adminActionsDiv.style.display = "block";
        const productId = this.getAttribute('data-id');
        // Store product data for editing
        const selectedProduct = snapshot.docs.find(doc => doc.id === productId).data();
        selectedProduct.id = productId;
        adminActionsDiv.innerHTML = `
          <button class="admin-action-btn edit-btn" data-id="${productId}" style="margin-right:8px;padding:6px 14px;border-radius:6px;background:#d4af37;color:#fff;border:none;cursor:pointer;">Edit</button>
          <button class="admin-action-btn delete-btn" data-id="${productId}" style="padding:6px 14px;border-radius:6px;background:#ef4444;color:#fff;border:none;cursor:pointer;">Delete</button>
        `;
        // Add event listener for edit
        adminActionsDiv.querySelector('.edit-btn').onclick = function() {
          // Show modal
          productFormModal.classList.remove("hidden");
          productFormModal.style.display = "flex";
          // Fill form fields
          document.getElementById("productId").value = selectedProduct.id || "";
          document.getElementById("productName").value = selectedProduct.name || "";
          document.getElementById("productCostPrice").value = selectedProduct.costPrice || "";
          document.getElementById("productPrice").value = selectedProduct.price || "";
          document.getElementById("productCategory").value = selectedProduct.category || "";
          document.getElementById("productImageSelect").value = (selectedProduct.imageUrl||"").replace("images/", "");
          document.getElementById("productDescription").value = selectedProduct.description || "";
          document.getElementById("productTopSeller").checked = !!selectedProduct.topSeller;
          document.getElementById("productOnSale").checked = !!selectedProduct.onSale;
          // Optionally store productId for update logic
          productForm.setAttribute('data-edit-id', productId);
        };
        // Add event listener for delete
        adminActionsDiv.querySelector('.delete-btn').onclick = async function() {
          if (confirm('Are you sure you want to delete this product?')) {
            try {
              await window.deleteDoc(window.doc(window.db, "Products", productId));
              alert('Product deleted successfully!');
              // Optionally, refresh the product list
              location.reload();
            } catch (error) {
              alert('Failed to delete product: ' + error.message);
            }
          }
        };
      };
    });
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="9">Error loading products: ${error.message}</td></tr>`;
  }

  //get new product details
  const productForm = document.getElementById("productForm");
  productForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const productData = {
      name: document.getElementById("productName").value,
      costPrice: parseFloat(document.getElementById("productCostPrice").value),
      price: parseFloat(document.getElementById("productPrice").value),
      category: document.getElementById("productCategory").value,
      imageUrl: "images/" + document.getElementById("productImageSelect").value,
      description: document.getElementById("productDescription").value,
      topSeller: document.getElementById("productTopSeller").checked,
      onSale: document.getElementById("productOnSale").checked
    };

    const editId = productForm.getAttribute('data-edit-id');
    if (editId) {
      // Update existing product
      try {
        await window.setDoc(window.doc(window.db, "Products", editId), productData, {merge: true});
        alert("Product updated successfully!");
      } catch (error) {
        console.error("Error updating product: ", error);
        alert("Failed to update product: " + error.message);
      }
      productForm.removeAttribute('data-edit-id');
    } else {
      // Add new product
      await addProduct(productData);
    }
    productForm.reset();
  });

  //add product to db
  async function addProduct(productData) {
    try {
      await window.addDoc(window.collection(window.db, "Products"), productData);
      alert("Product added successfully!");
      // Optionally, refresh the product list here
      
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Failed to add product: " + error.message);
    }
  }

});

//logic for the dashboard 

