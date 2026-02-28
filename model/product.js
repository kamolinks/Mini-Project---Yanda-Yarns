// This is a product class for product objects.

export class Product {

    #id;
    #name;
    #price;
    #costPrice;
    #description;
    #imageUrl;
    #category;
    #tags = [];
    static profitMargin = 0.3; // 30% profit margin

    constructor(id, name, costPrice, description, imageUrl, category, tags = []) {
        this.#id = id;
        this.#name = name;
        this.#costPrice = costPrice;
        this.#price = this.#costPrice * (1 + Product.profitMargin);
        this.#description = description;
        this.#tags = tags;
        this.#imageUrl = imageUrl;
        this.#category = category;
    }

    //getters for the product class
    getId() {
        return this.#id;
    }

    getName() {
        return this.#name;
    }

    getCostPrice() {
        return this.#costPrice;
    }

    getPrice() {
        return this.#price;
    }

    getDescription() {
        return this.#description;
    }

    getImageUrl() {
        return this.#imageUrl;
    }

    getCategory() {
        return this.#category;
    }

    //setters for the product class
    
    setName(name) {
        this.#name = name;
    }

    setCostPrice(costPrice) {
        this.#costPrice = costPrice;
        this.#price = this.#costPrice * (1 + Product.profitMargin);
    }

    setDescription(description) {
        this.#description = description;
    }

    setImageUrl(imageUrl) {
        this.#imageUrl = imageUrl;
    }

    setCategory(category) {
        this.#category = category;
    }

    // helper methods

    // this function allows the admin to add a tag to a product
    addTag(tag) {
        if (!this.#tags.includes(tag)) {
            this.#tags.push(tag);
        }
    }

    // this function allows the admin to remove a tag from a product
    removeTag(tag) {
        this.#tags = this.#tags.filter(t => t !== tag);
    }
}