const fs = require('fs');
const path = require('path');

const blockbookFixtures = {
    getInfo: params => ({
        data: {
            name: 'Blockbook',
            shortcut: params.shortcut,
            decimals: 8,
            bestHeight: 7000000, // high block to make sure that utxos have enough confirmations (composeTransaction test)
            bestHash: '',
            block0Hash: '',
            testnet: true,
            version: '0.0.0-mocked',
        },
    }),
    getAccountInfo: (params, message) => {
        const file = path.resolve(__dirname, `./getAccountInfo/${message.params.descriptor}.json`);
        const rawJson = fs.readFileSync(file);
        const data = JSON.parse(rawJson);

        return {
            data,
        };
    },
    estimateFee: (params, message) => ({
        data: message.params.blocks.map(() => ({ feePerUnit: '1000' })),
    }),
};

module.exports = { blockbookFixtures };
