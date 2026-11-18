import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));

export const blockfrostFixtures = {
    GET_SERVER_INFO: params => ({
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
    GET_PROTOCOL_PARAMETERS: () => ({
        data: {
            epoch: 656,
            min_fee_a: 44,
            min_fee_b: 155381,
            max_tx_size: 16384,
            max_val_size: '5000',
            key_deposit: '2000000',
            pool_deposit: '500000000',
            coins_per_utxo_size: '4310',
        },
    }),
    GET_ACCOUNT_INFO: (params, message) => {
        const file = path.resolve(
            fixturesDir,
            `./getAccountInfo/${message.params.descriptor}.json`,
        );
        const rawJson = fs.readFileSync(file);
        const data = JSON.parse(rawJson);

        return {
            data,
        };
    },
};
