const { createServer } = require('./server');

// Change all "blockchain_link" urls to localhost.
// This method is used in karma.plugin.js and jest.setup.js
const transformCoinsJson = json => {
    Object.keys(json).forEach(key => {
        json[key].forEach(coin => {
            if (coin.blockchain_link) {
                const query = `?type=${coin.blockchain_link.type}&shortcut=${coin.shortcut}&suffix=/websocket`;
                coin.blockchain_link.url = [`ws://localhost:18088/${query}`];
            }
        });
    });

    return json;
};

module.exports = { createServer, transformCoinsJson };
