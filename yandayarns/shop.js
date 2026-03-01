
import { getProducts } from "./firebaseauth.js";
import { saveUserCart } from "./firebaseauth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { loadProducts, createProductCard } from "./script.js";

// Make products array global
window.products = [];

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('shop-products-grid');
    const applyBtn = document.getElementById('applyFiltersBtn');
    const priceSelect = document.getElementById('priceRange');
    const categoryCheckboxes = Array.from(document.querySelectorAll('.filters input[type="checkbox"]'));

    function getPriceFilterFn(priceValue) {
      if (priceValue === 'all') return () => true;
      if (priceValue === '0-200') return p => p.price >= 0 && p.price <= 200;
      if (priceValue === '200-500') return p => p.price > 200 && p.price <= 500;
      if (priceValue === '500-1000') return p => p.price > 500 && p.price <= 1000;
      if (priceValue === '1000+') return p => p.price > 1000;
      return () => true;
    }

    function getCategoryFilterFn(selectedCategories) {
      if (selectedCategories.length === 0) return () => true;
      return p => selectedCategories.includes((p.category || '').toLowerCase());
    }

    function combinedFilter(product) {
      const selectedCategories = categoryCheckboxes.filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
      const priceValue = priceSelect.value;
      const priceFn = getPriceFilterFn(priceValue);
      const categoryFn = getCategoryFilterFn(selectedCategories);
      return priceFn(product) && categoryFn(product);
    }

    // Get search query from URL
    function getSearchQuery() {
      const params = new URLSearchParams(window.location.search);
      return params.get('search') ? params.get('search').toLowerCase() : '';
    }

    // Initial load with search filter
    function matchesSearchQuery(product, query) {
      if (!product) return false;
      const words = query.split(" ");
      return words.some(word =>
        (product.name && product.name.toLowerCase().includes(word))  ||
        (product.category && product.category.toLowerCase().includes(word)) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(word)))
      );
    }

    // Load products and store globally
    window.products = await getProducts();
    if (grid && typeof loadProducts === 'function') {
      const searchTerm = getSearchQuery();
      if (searchTerm) {
        loadProducts(grid, p => matchesSearchQuery(p, searchTerm));
      } else {
        loadProducts(grid);
      }
    }

    
});
