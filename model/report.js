// this is the parent class for reports.

export default class Report {
    #id;
    #title;
    #endDate;
    #startDate;
    

    constructor(id, title, startDate, endDate) {
        this.#id = id;
        this.#title = title;
        this.#startDate = startDate;
        this.#endDate = endDate;
        
    }

    //getters for the report class
    getId() {
        return this.#id;
    }

    getTitle() {
        return this.#title;
    }

    getStartDate() {
        return this.#startDate;
    }

    getEndDate() {
        return this.#endDate;
    }
}