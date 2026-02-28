export default class FinanceReport extends Report {
    
    #totalRevenue = 0;
    #totalExpenses = 0;
    #totalProfit = 0;

    constructor(id, title, startDate, endDate) {
        super(id, title, startDate, endDate);
        
    }

    //function to calculate the total revenue
    calculateTotalRevenue(salesData) {
        // logic to calculate total revenue from salesData
        // this is a placeholder implementation
        this.#totalRevenue = salesData.reduce((acc, sale) => acc + sale.revenue, 0);
    }

    //function to calculate the total expenses
    calculateTotalExpenses(expenseData) {
        // logic to calculate total expenses from expenseData
        // this is a placeholder implementation
        this.#totalExpenses = expenseData.reduce((acc, expense) => acc + expense.amount, 0);
    }

    //getters for the most sold and least sold products
    getTotalRevenue() {
        return this.#totalRevenue;
    }   

    getTotalExpenses() {
        return this.#totalExpenses;
    }

    getTotalProfit() {
        return this.#totalProfit;
    }

    // function to rank categories based on sales
    rankCategoriesBySales(salesData) {
        // logic to rank categories based on sales from salesData
        // this is a placeholder implementation
         
    }
}