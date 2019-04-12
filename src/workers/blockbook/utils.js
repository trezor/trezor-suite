export const transformAccountInfo = (payload, details) => {
    const result = payload;

    if (details === 'basic') {
        result.transactions = [];
        result.tokens = [];
    }
    return result;
};
