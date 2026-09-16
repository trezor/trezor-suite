import { type PublicClient, encodeAbiParameters, parseAbiParameters } from 'viem';

import type { MessageTypes, Response } from '@trezor/blockchain-link-types';

import { getAccountInfo } from './getAccountInfo';
import { WorkerState } from '../../state';
import { TRANSFER_TOPIC } from '../history/constants';
import type { Request } from '../types';

const ME = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const OTHER = '0x1111111111111111111111111111111111111111';
const SENTINEL = '0xfffffffffffffffffffffffffffffffffffffffe';
const ARC_TESTNET_CHAIN_ID = 5042002;
const LATEST = 1_000_000;

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

const nativeLog = (blockNumber: number, txid: string) => ({
    address: SENTINEL,
    topics: [TRANSFER_TOPIC, topic(OTHER), topic(ME)],
    data: `0x${'0'.repeat(63)}5`,
    blockNumber: `0x${blockNumber.toString(16)}`,
    transactionHash: txid,
    transactionIndex: '0x0',
});

type Harness = {
    client: PublicClient;
    rpcRequest: jest.Mock;
    txReads: () => number;
};

const createRequest = ({
    details,
    page,
    pageSize,
    logs = () => [],
    state = new WorkerState(),
    latest = LATEST,
    reuse,
    tokenBalance,
    watched = true,
}: {
    details?: MessageTypes.GetAccountInfo['payload']['details'];
    page?: number;
    pageSize?: number;
    logs?: () => unknown[];
    state?: WorkerState;
    latest?: number;
    reuse?: Harness;
    tokenBalance?: bigint;
    /** Suite subscribes an account once it takes it on; discovery candidates are not subscribed. */
    watched?: boolean;
}) => {
    if (watched) {
        state.addAccounts([{ descriptor: ME }]);
    }

    const request = jest.fn(() => Promise.resolve(logs()));
    const getTransaction = jest.fn(({ hash }: { hash: string }) =>
        Promise.resolve({
            hash,
            from: OTHER,
            to: ME,
            value: 5n,
            nonce: 1,
            gas: 21000n,
            gasPrice: 1n,
            input: '0x',
            blockHash: '0xb',
            blockNumber: BigInt(LATEST),
        }),
    );
    const getTransactionReceipt = jest.fn(() =>
        Promise.resolve({
            status: 'success',
            gasUsed: 21000n,
            effectiveGasPrice: 1n,
            contractAddress: null,
            logs: [],
        }),
    );
    const client =
        reuse?.client ??
        ({
            request,
            getTransaction,
            getTransactionReceipt,
            getCode: () => Promise.resolve('0x'),
            call: () =>
                tokenBalance === undefined
                    ? Promise.reject(new Error('no token reads in this test'))
                    : Promise.resolve({
                          data: encodeAbiParameters(parseAbiParameters('uint256'), [tokenBalance]),
                      }),
            getBlock: () => Promise.resolve({ timestamp: 1n }),
            getBalance: () => Promise.resolve(0n),
            getTransactionCount: () => Promise.resolve(0),
            getBlockNumber: () => Promise.resolve(BigInt(latest)),
            getChainId: () => Promise.resolve(ARC_TESTNET_CHAIN_ID),
        } as unknown as PublicClient);

    return {
        client,
        rpcRequest: reuse?.rpcRequest ?? request,
        txReads: () => (reuse ? reuse.txReads() : getTransaction.mock.calls.length),
        state,
        payload: {
            type: 'm_get_account_info',
            id: 1,
            payload: { descriptor: ME, details, page, pageSize },
            connect: () => Promise.resolve(client),
            post: (_data: Response) => {},
            state,
            coinName: 'tARC',
        } as unknown as Request<MessageTypes.GetAccountInfo>,
    };
};

describe(getAccountInfo.name, () => {
    it('keeps a cheap probe cheap and reports the transaction count as unknown', async () => {
        const { payload, rpcRequest } = createRequest({ details: 'basic' });

        const { payload: info } = await getAccountInfo(payload);

        expect(rpcRequest).not.toHaveBeenCalled();
        expect(info.history.total).toBe(-1);
        expect(info.empty).toBe(true);
    });

    it('scans and reports a real count once transactions are asked for', async () => {
        const { payload, rpcRequest } = createRequest({
            details: 'txids',
            logs: () => [nativeLog(LATEST, '0xaaa'), nativeLog(LATEST - 1, '0xbbb')],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(rpcRequest).toHaveBeenCalled();
        expect(info.history.total).toBe(2);
        expect(info.history.txids).toEqual(['0xaaa', '0xbbb']);
        expect(info.empty).toBe(false);
    });

    it('reports the same count on a later cheap probe, so nothing refetches in a loop', async () => {
        const state = new WorkerState();
        const first = createRequest({
            details: 'txids',
            state,
            logs: () => [nativeLog(LATEST, '0xaaa')],
        });
        await getAccountInfo(first.payload);

        const second = createRequest({ details: 'basic', state, logs: () => [] });
        const { payload: info } = await getAccountInfo(second.payload);

        expect(info.history.total).toBe(1);
    });

    it('serves newest first and slices the requested page', async () => {
        const logs = Array.from({ length: 30 }, (_, index) =>
            nativeLog(LATEST - index, `0x${index.toString(16).padStart(4, '0')}`),
        );
        const { payload } = createRequest({ details: 'txids', page: 2, logs: () => logs });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.history.total).toBe(30);
        expect(info.page).toEqual({ index: 2, size: 25, total: 2 });
        expect(info.history.txids).toHaveLength(5);
        expect(info.history.txids?.[0]).toBe('0x0019');
    });

    it('never lists the contract mirroring the native asset as a token', async () => {
        const { payload } = createRequest({
            details: 'txids',
            logs: () => [nativeLog(LATEST, '0xaaa')],
        });

        const { payload: info } = await getAccountInfo(payload);

        expect(info.tokens).toBeUndefined();
    });
});

describe(`${getAccountInfo.name} incremental discovery`, () => {
    const TOKEN = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

    const tokenLog = (blockNumber: number, txid: string) => ({
        address: TOKEN.toLowerCase(),
        topics: [TRANSFER_TOPIC, topic(OTHER), topic(ME)],
        data: `0x${'0'.repeat(63)}5`,
        blockNumber: `0x${blockNumber.toString(16)}`,
        transactionHash: txid,
        transactionIndex: '0x0',
    });

    it('never scans logs for a request that only wants balances', async () => {
        const state = new WorkerState();

        // this is what account discovery asks for, once per candidate account
        const probe = createRequest({ details: 'basic', state, logs: () => [] });
        await getAccountInfo(probe.payload);

        expect(probe.rpcRequest).not.toHaveBeenCalled();
    });

    it('picks a token up from its balance, with no log scan', async () => {
        const state = new WorkerState();
        const held = createRequest({ details: 'basic', state, tokenBalance: 5n });

        const { payload: info } = await getAccountInfo(held.payload);

        expect(held.rpcRequest).not.toHaveBeenCalled();
        expect(info.tokens?.map(token => token.balance)).toContain('5');
        expect(info.empty).toBe(false);
    });

    it('re-scans the blocks at the tip, whose logs may not have been queryable yet', async () => {
        const state = new WorkerState();

        // first sync sees the tip block but the provider has no logs for it yet
        const primed = createRequest({ details: 'txs', state, logs: () => [] });
        await getAccountInfo(primed.payload);

        // the tip has not moved, and now the log for that same block is served
        const retry = createRequest({
            details: 'txs',
            state,
            logs: () => [tokenLog(LATEST, `0x${'cd'.repeat(32)}`)],
        });
        const { payload: info } = await getAccountInfo(retry.payload);

        expect(info.history.total).toBe(1);
    });
});

describe(`${getAccountInfo.name} request cost`, () => {
    it('does not re-read transactions it has already mapped', async () => {
        const state = new WorkerState();
        const logs = [nativeLog(LATEST, `0x${'ab'.repeat(32)}`)];
        const first = createRequest({ details: 'txs', state, logs: () => logs });

        await getAccountInfo(first.payload);
        const readsAfterFirst = first.txReads();

        expect(readsAfterFirst).toBeGreaterThan(0);

        const second = createRequest({ details: 'txs', state, logs: () => logs, reuse: first });
        await getAccountInfo(second.payload);

        // the same transaction, still mapped only once across both calls
        expect(second.txReads()).toBe(readsAfterFirst);
    });
});

describe(`${getAccountInfo.name} discovery cost`, () => {
    it('costs no log scan for an address Suite has not taken on yet', async () => {
        const state = new WorkerState();
        const candidate = createRequest({
            details: 'txs',
            state,
            watched: false,
            logs: () => [nativeLog(LATEST, `0x${'ef'.repeat(32)}`)],
        });

        const { payload: info } = await getAccountInfo(candidate.payload);

        expect(candidate.rpcRequest).not.toHaveBeenCalled();
        expect(candidate.txReads()).toBe(0);
        expect(info.empty).toBe(true);
    });

    it('reads history once the account is subscribed', async () => {
        const state = new WorkerState();
        const opened = createRequest({
            details: 'txs',
            state,
            logs: () => [nativeLog(LATEST, `0x${'ef'.repeat(32)}`)],
        });

        const { payload: info } = await getAccountInfo(opened.payload);

        expect(opened.rpcRequest).toHaveBeenCalled();
        expect(info.history.total).toBe(1);
    });
});
