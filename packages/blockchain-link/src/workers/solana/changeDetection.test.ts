import type { AccountInfoParams } from '@trezor/blockchain-link-types';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import type { SolanaAPI } from '@trezor/network-solana/types';

import { BlockchainLink } from '../../index';

import SolanaWorker from './index';

const descriptor = '2MLmmoKgCrxVEzMeGatnjdABYS5RXsQSNikcWrmnvQna';
const tokenAccountA = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R';
const tokenAccountB = '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump';
const mintA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const mintB = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

const splTokenProgram = tokenProgramsInfo['spl-token'].publicKey;

const tokenAccount = (pubkey: string, mint: string) => ({
    pubkey,
    account: {
        data: {
            program: 'spl-token',
            parsed: { type: 'account', info: { mint, tokenAmount: { amount: '5', decimals: 6 } } },
        },
    },
});

const createApiMock = () => {
    // mutable so a test can make one address look changed
    const lamports: Record<string, number> = {
        [descriptor]: 1000,
        [tokenAccountA]: 2000,
        [tokenAccountB]: 3000,
    };
    const signatureCalls: string[] = [];
    let multipleAccountsCalls = 0;

    const api = {
        rpc: {
            getAccountInfo: () => ({
                send: () => Promise.resolve({ value: { lamports: 1000, data: ['', 'base64'] } }),
            }),
            getTokenAccountsByOwner: (_owner: string, filter: { programId: string }) => ({
                send: () =>
                    Promise.resolve({
                        value:
                            filter.programId === splTokenProgram
                                ? [
                                      tokenAccount(tokenAccountA, mintA),
                                      tokenAccount(tokenAccountB, mintB),
                                  ]
                                : [],
                    }),
            }),
            getMultipleAccounts: (addresses: string[]) => ({
                send: () => {
                    multipleAccountsCalls += 1;

                    return Promise.resolve({
                        value: addresses.map(a => ({
                            lamports: lamports[a] ?? 0,
                            data: ['', 'base64'],
                        })),
                    });
                },
            }),
            getSignaturesForAddress: (address: string) => ({
                send: () => {
                    signatureCalls.push(address);

                    return Promise.resolve([{ signature: `sig-${address}`, slot: 1n }]);
                },
            }),
            getEpochInfo: () => ({ send: () => Promise.resolve({ epoch: 7n }) }),
        },
    } as unknown as SolanaAPI;

    return {
        api,
        signatureCalls,
        multipleAccountsCalls: () => multipleAccountsCalls,
        bumpLamports: (address: string) => {
            lamports[address] = (lamports[address] ?? 0) + 1;
        },
    };
};

describe('solana worker change detection', () => {
    const originalFetch = global.fetch;
    let mock: ReturnType<typeof createApiMock>;
    let blockchain: BlockchainLink;

    beforeAll(() => {
        // token definitions are fetched over HTTP; only recognised mints reach the fan-out
        global.fetch = (() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ [mintA]: { symbol: 'A' }, [mintB]: { symbol: 'B' } }),
            })) as unknown as typeof global.fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
        blockchain.dispose();
    });

    beforeAll(() => {
        mock = createApiMock();
        const worker = SolanaWorker();
        worker.tryConnect = () => Promise.resolve(mock.api);
        blockchain = new BlockchainLink({
            name: 'Solana',
            worker: () => worker,
            server: ['dummyUrl'],
            debug: false,
        });
    });

    const sync = () =>
        blockchain.getAccountInfo({ descriptor, details: 'txids' } as AccountInfoParams);

    it('fans out signature lookups once, then serves unchanged addresses from cache', async () => {
        const first = await sync();

        expect(mock.multipleAccountsCalls()).toBe(1);
        expect([...mock.signatureCalls].sort()).toEqual(
            [descriptor, tokenAccountA, tokenAccountB].sort(),
        );

        mock.signatureCalls.length = 0;
        const second = await sync();

        // one getMultipleAccounts told us nothing moved, so no address was refetched
        expect(mock.multipleAccountsCalls()).toBe(2);
        expect(mock.signatureCalls).toEqual([]);
        expect(second.history.txids).toEqual(first.history.txids);
    });

    it('refetches only the address whose state changed', async () => {
        mock.signatureCalls.length = 0;
        mock.bumpLamports(tokenAccountA);

        const result = await sync();

        expect(mock.signatureCalls).toEqual([tokenAccountA]);
        expect(result.history.txids).toEqual(
            expect.arrayContaining([`sig-${descriptor}`, `sig-${tokenAccountA}`]),
        );
    });
});
