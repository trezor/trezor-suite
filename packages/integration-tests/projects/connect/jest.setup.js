const { TX_CACHE } = require('./__txcache__');

jest.setTimeout(20000);

// Always mock blockchain-link worker unless it's explicitly required not to.
if (process.env.TESTS_USE_WS_CACHE === 'true') {
    // TODO HERE!
    jest.mock('../src/data/coins.json', () => {
        const json = jest.requireActual('../src/data/coins.json');
        const { transformCoinsJson } = jest.requireActual('./__wscache__');
        return transformCoinsJson(json);
    });
}

global.TestUtils = {
    ...global.TestUtils,
    TX_CACHE,
};
