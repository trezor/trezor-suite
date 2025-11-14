import fs from 'fs';
import path from 'path';

export const blockfrostFixtures = {
    GET_SERVER_INFO: (params: any) => ({
        data: {
            name: 'Blockfrost',
            shortcut: params.shortcut,
            network: params.network,
            decimals: 6,
            testnet: false,
            version: '1.4.0',
            blockHash: 'test_block_hash-hash',
            blockHeight: 1,
        },
    }),
    GET_ACCOUNT_INFO: (_params: any, message: any) => {
        const file = path.resolve(__dirname, `./getAccountInfo/${message.params.descriptor}.json`);
        const rawJson = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(rawJson);

        return {
            data,
        };
    },
};
