import fs from 'fs';
import path from 'path';

export const blockbookFixtures = {
    getInfo: (params: any) => ({
        data: {
            name: 'Blockbook',
            shortcut: params.shortcut,
            decimals: 8,
            bestHeight: 7000000, // high block to make sure that utxos have enough confirmations (composeTransaction test)
            bestHash: '',
            block0Hash: '',
            network: params.network,
            testnet: true,
            version: '0.0.0-mocked',
        },
    }),
    getAccountInfo: (_params: any, message: any) => {
        const file = path.resolve(__dirname, `./getAccountInfo/${message.params.descriptor}.json`);
        const rawJson = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(rawJson);

        return {
            data,
        };
    },
    estimateFee: (_params: any, message: any) => ({
        data: message.params.blocks.map(() => ({ feePerUnit: '1000' })),
    }),
};
