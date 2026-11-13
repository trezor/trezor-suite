import coins from '@trezor/connect-data/files/coins.json';

import { getBackendCoinInfo } from './coinInfo';

describe('getBackendCoinInfo', () => {
    it.each([
        ['rhc', { type: 'blockbook', url: ['https://rhc.trezor.io'] }],
        ['hype', { type: 'blockbook', url: ['https://hype.trezor.io'] }],
        // The first network whose default backend is not blockbook. The parser copies
        // blockchain_link through untouched, and Blockchain.getWorker() dispatches on that type,
        // so a typo here silently becomes Backend_NotSupported at runtime.
        ['tarc', { type: 'evm-rpc', url: ['https://rpc.testnet.arc.network'] }],
    ])('takes the default backend of %s from coins.json', (coin, blockchainLink) => {
        expect(getBackendCoinInfo(coin).blockchainLink).toEqual(blockchainLink);
    });

    it('gives every bitcoin-like network a block time', () => {
        Object.values(coins.bitcoin).forEach(coin => {
            expect(getBackendCoinInfo(coin.coin_shortcut).blockTime).toBeGreaterThan(0);
        });
    });
});
