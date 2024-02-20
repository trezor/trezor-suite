// mock 'cross-fetch' package

module.exports = {
    __esModule: true,
    default: () => {
        const error = new Error('Unit test should not fetch. Use cross-fetch mock');
        console.error(error);

        return Promise.reject(error);
    },
};
