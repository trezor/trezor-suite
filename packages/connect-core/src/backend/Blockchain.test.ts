import { BlockchainLink } from '@trezor/blockchain-link';
import type { CoinInfo } from '@trezor/connect-common';
import type { CanonicalDescriptor } from '@trezor/utils';

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

// The mocked BlockchainLink instances are told apart by the name Blockchain gives them.
const mockGetAccountInfo = (implementation: (backend: string) => Promise<any>) =>
    jest.spyOn(BlockchainLink.prototype, 'getAccountInfo').mockImplementation(function (this: {
        name: string;
    }) {
        return implementation(this.name) as ReturnType<BlockchainLink['getAccountInfo']>;
    });

const descriptor = '0xabc' as CanonicalDescriptor;

const accountInfo = (misc: Record<string, string>, txids: string[] = []) => ({
    descriptor,
    misc,
    history: { total: txids.length, unconfirmed: 0, transactions: txids.map(txid => ({ txid })) },
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

    describe('getAccountInfo with a broadcast backend', () => {
        it('takes the confirmed nonce from the broadcast backend when it is ahead', async () => {
            mockGetAccountInfo(backend =>
                Promise.resolve(
                    backend === 'ETH'
                        ? accountInfo({ nonce: '5', confirmedNonce: '5' })
                        : accountInfo({ nonce: '7' }),
                ),
            );

            const info = await createBlockchain(coinInfo).getAccountInfo({
                descriptor,
                details: 'basic',
                confirmedNonce: true,
            });

            expect(info.misc).toEqual({ nonce: '5', confirmedNonce: '7' });
        });

        it('keeps the primary confirmed nonce when the broadcast backend is behind or fails', async () => {
            mockGetAccountInfo(backend =>
                backend === 'ETH'
                    ? Promise.resolve(accountInfo({ nonce: '5', confirmedNonce: '5' }))
                    : Promise.reject(new Error('broadcast is down')),
            );

            const info = await createBlockchain(coinInfo).getAccountInfo({
                descriptor,
                details: 'basic',
                confirmedNonce: true,
            });

            expect(info.misc?.confirmedNonce).toBe('5');
        });

        it('adds own pending transactions only the broadcast backend knows', async () => {
            const getAccountInfo = mockGetAccountInfo(() =>
                Promise.resolve(accountInfo({ nonce: '5' }, ['0xknown'])),
            );
            const getTransaction = mockGetTransaction(() => Promise.resolve({ txid: '0xprivate' }));

            const info = await createBlockchain(coinInfo).getAccountInfo({
                descriptor,
                details: 'txs',
                privatePending: { nonces: [5, 6], txids: ['0xKNOWN', '0xprivate'] },
            });

            expect(info.history.transactions?.map(tx => tx.txid)).toEqual(['0xprivate', '0xknown']);
            expect(getTransaction).toHaveBeenCalledTimes(1);
            expect(getTransaction).toHaveBeenCalledWith({ txid: '0xprivate', descriptor });
            // Account sync reads the nonce from the primary backend only.
            expect(getAccountInfo).toHaveBeenCalledTimes(1);
        });

        it('leaves out a pending transaction the broadcast backend does not know either', async () => {
            mockGetAccountInfo(() => Promise.resolve(accountInfo({ nonce: '5' }, ['0xknown'])));
            mockGetTransaction(() => Promise.reject(new Error('tx not found')));

            const info = await createBlockchain(coinInfo).getAccountInfo({
                descriptor,
                details: 'txs',
                privatePending: { nonces: [5], txids: ['0xdropped'] },
            });

            expect(info.history.transactions?.map(tx => tx.txid)).toEqual(['0xknown']);
        });

        it('does not contact a broadcast backend the coin does not have', async () => {
            const getAccountInfo = mockGetAccountInfo(() =>
                Promise.resolve(accountInfo({ nonce: '5', confirmedNonce: '5' })),
            );
            const getTransaction = mockGetTransaction(() => Promise.resolve({ txid: '0xprivate' }));

            const info = await createBlockchain(withoutBroadcast).getAccountInfo({
                descriptor,
                details: 'txs',
                confirmedNonce: true,
                privatePending: { nonces: [5], txids: ['0xprivate'] },
            });

            expect(info.misc?.confirmedNonce).toBe('5');
            expect(getAccountInfo).toHaveBeenCalledTimes(1);
            expect(getTransaction).not.toHaveBeenCalled();
        });
    });
});
