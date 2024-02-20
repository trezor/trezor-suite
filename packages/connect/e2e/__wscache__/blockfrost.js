const fs = require('fs');
const path = require('path');

const blockfrostFixtures = {
    GET_SERVER_INFO: params => ({
        data: {
            name: 'Blockfrost',
            shortcut: params.shortcut,
            decimals: 6,
            testnet: false,
            version: '1.4.0',
            blockHash: 'test_block_hash-hash',
            blockHeight: 1,
        },
    }),
    GET_ACCOUNT_INFO: (params, message) => {
        const file = path.resolve(__dirname, `./getAccountInfo/${message.params.descriptor}.json`);
        const rawJson = fs.readFileSync(file);
        const data = JSON.parse(rawJson);

        return {
            data,
        };
    },
};

module.exports = {
    blockfrostFixtures,
};
