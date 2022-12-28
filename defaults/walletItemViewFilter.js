module.exports = {
    interval: "3m", // d: days, m: monthes, y: years, w: weeks
    startDate: null, // javascript date format or null
    endDate: null, // javascript date format or null
    types: ["pendings", "incomes", "transfers"], // array of multiple choices: [pendings, incomes, transferts]
    paytypes: [], // array of paytype ids
    categories: [], // array of category ids
    states: "all", // all, closed, notclosed
    thirdparties: [], // array of thirdparty ids
    hideClosedOperations: false // true or false
};
