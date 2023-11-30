// mock 'cross-fetch' package

module.exports = {
    __esModule: true,
    default: () => {
        throw Error('Unit test should not fetch. Use cross-fetch mock');
    },
};
