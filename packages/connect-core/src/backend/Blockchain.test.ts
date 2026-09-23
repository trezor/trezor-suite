import { BlockchainLink } from '@trezor/blockchain-link';
import type { CoinInfo } from '@trezor/connect-common';

import { Blockchain } from './Blockchain';

const coinInfo = {
    shortcut: 'ETH',
    type: 'ethereum',
    blockchainLink: {
        type: 'blockbook',
        url: ['primary'],
        broadcast: { type: 'evm-rpc', url: ['broadcast'] },
    },
} as CoinInfo;

const withoutBroadcast = {
    ...coinInfo,
    blockchainLink: { type: 'blockbook', url: ['primary'] },
} as CoinInfo;

const createBlockchain = (info: CoinInfo) =>
    new Blockchain({ coinInfo: info, postMessage: jest.fn() });

// The mocked BlockchainLink instances are told apart by the name Blockchain gives them.
const mockGetTransaction = (implementation: (backend: string) => Promise<any>) =>
    jest.spyOn(BlockchainLink.prototype, 'getTransaction').mockImplementation(function (this: {
        name: string;
    }) {
        return implementation(this.name) as ReturnType<BlockchainLink['getTransaction']>;
    });

describe('backend/Blockchain', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reads a transaction from the primary backend', async () => {
        mockGetTransaction(backend => Promise.resolve({ backend }));

        await expect(createBlockchain(coinInfo).getTransactions(['txid'])).resolves.toEqual([
            { backend: 'ETH' },
        ]);
    });

    it('falls back to the broadcast backend for a transaction the primary one does not know', async () => {
        mockGetTransaction(backend =>
            backend === 'ETH'
                ? Promise.reject(new Error('tx not found'))
                : Promise.resolve({ backend }),
        );

        await expect(createBlockchain(coinInfo).getTransactions(['txid'])).resolves.toEqual([
            { backend: 'ETH-broadcast' },
        ]);
    });

    it('reports the primary backend error when the broadcast backend fails too', async () => {
        mockGetTransaction(backend => Promise.reject(new Error(`${backend} is down`)));

        await expect(createBlockchain(coinInfo).getTransactions(['txid'])).rejects.toThrow(
            'ETH is down',
        );
    });

    it('does not look for a broadcast backend when the coin has none', async () => {
        const getTransaction = mockGetTransaction(backend =>
            Promise.reject(new Error(`${backend} is down`)),
        );

        await expect(createBlockchain(withoutBroadcast).getTransactions(['txid'])).rejects.toThrow(
            'ETH is down',
        );
        expect(getTransaction).toHaveBeenCalledTimes(1);
    });
});
