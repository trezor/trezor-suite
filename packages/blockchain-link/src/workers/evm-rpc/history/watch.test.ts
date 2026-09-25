import type { PublicClient } from 'viem';

import { TRANSFER_TOPIC } from './constants';
import { getDescriptorHistory } from './state';
import { detectAccountChanges } from './watch';
import { WorkerState } from '../../state';

const ACCOUNT_A = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const ACCOUNT_B = '0x2222222222222222222222222222222222222222';
const OTHER = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const ARC_TESTNET_CHAIN_ID = 5042002;

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;
/** Real txids are valid hex, and `toHex` re-prefixes anything that is not. */
const txid = (seed: string) => `0x${seed.padStart(64, '0')}`;
const NEW_TX = txid('abc1');

const transferLog = (from: string, to: string, txid: string, blockNumber = 500) => ({
    address: TOKEN.toLowerCase(),
    topics: [TRANSFER_TOPIC, topic(from), topic(to)],
    data: `0x${'0'.repeat(63)}5`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: txid,
    transactionIndex: '0x0',
    blockTimestamp: '0x6a8fef85',
});

const createClient = (logs: unknown[]) => {
    const request = jest.fn(() => Promise.resolve(logs));

    return {
        request,
        client: {
            request,
            getChainId: () => Promise.resolve(ARC_TESTNET_CHAIN_ID),
            getCode: () => Promise.resolve('0x'),
            call: () => Promise.reject(new Error('no metadata in this test')),
            getTransaction: jest.fn(({ hash }: { hash: string }) =>
                Promise.resolve({
                    hash,
                    from: OTHER,
                    to: TOKEN,
                    value: 0n,
                    nonce: 1,
                    gas: 21000n,
                    gasPrice: 1n,
                    input: '0x',
                    blockHash: '0xb',
                    blockNumber: 500n,
                }),
            ),
            getTransactionReceipt: jest.fn(() =>
                Promise.resolve({
                    status: 'success',
                    gasUsed: 21000n,
                    effectiveGasPrice: 1n,
                    contractAddress: null,
                    logs: [transferLog(OTHER, ACCOUNT_A, NEW_TX)],
                }),
            ),
            getBlock: () => Promise.resolve({ timestamp: 1n }),
        } as unknown as PublicClient,
    };
};

const subscribed = (...descriptors: string[]) => {
    const state = new WorkerState();
    state.addAccounts(descriptors.map(descriptor => ({ descriptor })));
    descriptors.forEach(descriptor => {
        const history = getDescriptorHistory(state, descriptor);
        history.syncedFrom = 0;
        history.syncedTo = 499;
    });

    return state;
};

describe(detectAccountChanges.name, () => {
    it('watches every subscribed account with a single pair of queries', async () => {
        const state = subscribed(ACCOUNT_A, ACCOUNT_B);
        const { client, request } = createClient([]);

        await detectAccountChanges(client, state, 500, 510);

        // one query for "as sender", one for "as recipient" — regardless of account count
        expect(request).toHaveBeenCalledTimes(2);
    });

    it('reports a transfer to a watched account, attributed to that account', async () => {
        const state = subscribed(ACCOUNT_A, ACCOUNT_B);
        const { client } = createClient([transferLog(OTHER, ACCOUNT_A, NEW_TX)]);

        const changes = await detectAccountChanges(client, state, 500, 510);

        expect(changes).toHaveLength(1);
        expect(changes[0]?.descriptor).toBe(ACCOUNT_A);
        expect(changes[0]?.tx.txid).toBe(NEW_TX);
        expect(changes[0]?.tx.type).toBe('recv');
        expect(getDescriptorHistory(state, ACCOUNT_A).entries.has(NEW_TX)).toBe(true);
        expect(getDescriptorHistory(state, ACCOUNT_B).entries.size).toBe(0);
    });

    it('reports nothing for a transaction it already knew about', async () => {
        const state = subscribed(ACCOUNT_A);
        getDescriptorHistory(state, ACCOUNT_A).entries.set(NEW_TX, {
            txid: NEW_TX,
            blockNumber: 500,
            transactionIndex: 0,
        });
        const { client } = createClient([transferLog(OTHER, ACCOUNT_A, NEW_TX)]);

        expect(await detectAccountChanges(client, state, 500, 510)).toEqual([]);
    });

    it('discovers the token contract, so the refetch already knows about it', async () => {
        const state = subscribed(ACCOUNT_A);
        const { client } = createClient([transferLog(OTHER, ACCOUNT_A, NEW_TX)]);

        await detectAccountChanges(client, state, 500, 510);

        expect([...getDescriptorHistory(state, ACCOUNT_A).tokenContracts]).toEqual([
            TOKEN.toLowerCase(),
        ]);
    });

    it('leaves the scanned bounds alone — that meaning belongs to syncHistory', async () => {
        const state = subscribed(ACCOUNT_A);
        const { client } = createClient([transferLog(OTHER, ACCOUNT_A, NEW_TX)]);

        await detectAccountChanges(client, state, 500, 510);

        const history = getDescriptorHistory(state, ACCOUNT_A);
        expect(history.syncedTo).toBe(499);
    });

    it('does nothing when no account is subscribed', async () => {
        const { client, request } = createClient([transferLog(OTHER, ACCOUNT_A, NEW_TX)]);

        expect(await detectAccountChanges(client, new WorkerState(), 500, 510)).toEqual([]);
        expect(request).not.toHaveBeenCalled();
    });
});
