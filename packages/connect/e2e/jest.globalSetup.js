const { createServer } = require('./__wscache__');

module.exports = async () => {
    // Always mock blockchain-link server unless it's explicitly required not to.
    if (process.env.TESTS_USE_WS_CACHE === 'true') {
        global.WsCacheServer = await createServer();
    }
};
