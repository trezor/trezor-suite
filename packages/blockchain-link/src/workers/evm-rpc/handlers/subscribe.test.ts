import type { PublicClient } from 'viem';

import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes } from '@trezor/blockchain-link-types';

import { WorkerState } from '../../state';
import { BLOCK_SUBSCRIPTION } from '../constants';
import { cleanupSubscriptions, subscribe, unsubscribe } from './subscribe';

const { POLL_INTERVAL_MS } = BLOCK_SUBSCRIPTION;

const ADDRESS = '0x1234567890123456789012345678901234567890';
const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111';

const TXID = `0x${'abc1'.padStart(64, '0')}`;

const createWorker = ({
    blockNumber = 1n,
    logs = () => [],
}: { blockNumber?: bigint; logs?: () => unknown[] } = {}) => {
    let currentBlock = blockNumber;
    const getBlockNumber = jest.fn(() => Promise.resolve(currentBlock));
    const getBlock = jest.fn(({ blockNumber: requested }: { blockNumber: bigint }) =>
        Promise.resolve({ hash: `0x${requested}`, timestamp: 1n }),
    );
    const request = jest.fn(() => Promise.resolve(logs()));
    const client = {
        getBlockNumber,
        getBlock,
        request,
        getChainId: () => Promise.resolve(5042002),
        getCode: () => Promise.resolve('0x'),
        call: () => Promise.reject(new Error('no metadata in this test')),
        getTransaction: jest.fn(({ hash }: { hash: string }) =>
            Promise.resolve({
                hash,
                from: OTHER_ADDRESS,
                to: ADDRESS,
                value: 5n,
                nonce: 1,
                gas: 21000n,
                gasPrice: 1n,
                input: '0x',
                blockHash: '0xb',
                blockNumber: 2n,
            }),
        ),
        getTransactionReceipt: jest.fn(() =>
            Promise.resolve({
                status: 'success',
                gasUsed: 21000n,
                effectiveGasPrice: 1n,
                contractAddress: null,
                logs: [],
            }),
        ),
    } as unknown as PublicClient;

    const state = new WorkerState();
    const post = jest.fn();
    const context = {
        connect: () => Promise.resolve(client),
        post,
        state,
        coinName: 'ETH',
    };

    return {
        state,
        post,
        getBlockNumber,
        rpcRequest: request,
        mineBlock: () => {
            currentBlock += 1n;
        },
        subscribe: (payload: MessageTypes.Subscribe['payload']) =>
            subscribe({ ...context, type: MESSAGES.SUBSCRIBE, payload }),
        unsubscribe: (payload: MessageTypes.Unsubscribe['payload']) =>
            unsubscribe({ ...context, type: MESSAGES.UNSUBSCRIBE, payload }),
    };
};

const blockNotification = (blockHeight: number) => ({
    id: -1,
    type: RESPONSES.NOTIFICATION,
    payload: {
        type: 'block',
        payload: { blockHeight, blockHash: `0x${blockHeight}` },
    },
});

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('subscribe', () => {
    it('polls a block subscription per worker instance', async () => {
        const first = createWorker();
        const second = createWorker();

        await first.subscribe({ type: 'block' });
        await second.subscribe({ type: 'block' });

        expect(jest.getTimerCount()).toBe(2);

        first.mineBlock();
        second.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(first.post).toHaveBeenCalledWith(blockNotification(2));
        expect(second.post).toHaveBeenCalledWith(blockNotification(2));
    });

    it('keeps polling other instances when one is cleaned up', async () => {
        const first = createWorker();
        const second = createWorker();

        await first.subscribe({ type: 'block' });
        await second.subscribe({ type: 'block' });

        // Mirrors EvmRpcWorker.cleanup(), where the state is wiped right after the handler.
        cleanupSubscriptions(first.state);
        first.state.cleanup();

        first.mineBlock();
        second.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);

        expect(first.post).not.toHaveBeenCalled();
        expect(second.post).toHaveBeenCalledWith(blockNotification(2));
        expect(jest.getTimerCount()).toBe(1);
    });

    it('stops polling when the subscription is dropped without the interval handle', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'block' });
        worker.state.cleanup();

        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);

        expect(worker.post).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('tracks the last seen block height per worker instance', async () => {
        const highChain = createWorker({ blockNumber: 100n });
        const lowChain = createWorker({ blockNumber: 5n });

        await highChain.subscribe({ type: 'block' });
        await lowChain.subscribe({ type: 'block' });

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(highChain.post).not.toHaveBeenCalled();
        expect(lowChain.post).not.toHaveBeenCalled();

        highChain.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(highChain.post).toHaveBeenCalledWith(blockNotification(101));
        expect(lowChain.post).not.toHaveBeenCalled();
    });

    it('subscribes only once per instance', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'block' });
        const response = await worker.subscribe({ type: 'block' });

        expect(response).toEqual({ type: RESPONSES.SUBSCRIBE, payload: { subscribed: true } });
        expect(jest.getTimerCount()).toBe(1);
    });

    it('keeps polling after a failed poll', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const worker = createWorker();

        await worker.subscribe({ type: 'block' });
        worker.getBlockNumber.mockRejectedValueOnce(new Error('rpc down'));
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(warn).toHaveBeenCalled();
        expect(worker.post).not.toHaveBeenCalled();

        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(worker.post).toHaveBeenCalledWith(blockNotification(2));
    });

    it('registers accounts in the worker state', async () => {
        const worker = createWorker();
        const accounts = [{ descriptor: ADDRESS }];

        const response = await worker.subscribe({ type: 'accounts', accounts });

        expect(response).toEqual({ type: RESPONSES.SUBSCRIBE, payload: { subscribed: true } });
        expect(worker.state.getAccounts()).toEqual(accounts);
        expect(worker.state.getAddresses()).toEqual([ADDRESS]);
    });

    it('registers addresses in the worker state', async () => {
        const worker = createWorker();

        const response = await worker.subscribe({
            type: 'addresses',
            addresses: [ADDRESS, OTHER_ADDRESS],
        });

        expect(response).toEqual({ type: RESPONSES.SUBSCRIBE, payload: { subscribed: true } });
        expect(worker.state.getAddresses()).toEqual([ADDRESS, OTHER_ADDRESS]);
    });

    it.each(['fiatRates', 'mempool'] as const)('rejects an unsupported %s type', async type => {
        const worker = createWorker();

        await expect(worker.subscribe({ type })).rejects.toMatchObject({
            code: 'blockchain_link/invalid_param',
            message: `Subscription type '${type}' not supported by EVM RPC worker`,
        });
    });
});

describe('unsubscribe', () => {
    it('stops the poll loop of its own instance only', async () => {
        const first = createWorker();
        const second = createWorker();

        await first.subscribe({ type: 'block' });
        await second.subscribe({ type: 'block' });

        const response = first.unsubscribe({ type: 'block' });

        expect(response).toEqual({ type: RESPONSES.UNSUBSCRIBE, payload: { subscribed: false } });
        expect(jest.getTimerCount()).toBe(1);

        first.mineBlock();
        second.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(first.post).not.toHaveBeenCalled();
        expect(second.post).toHaveBeenCalledWith(blockNotification(2));
    });

    it('removes the given accounts from the worker state', async () => {
        const worker = createWorker();
        const account = { descriptor: ADDRESS };
        const otherAccount = { descriptor: OTHER_ADDRESS };

        await worker.subscribe({ type: 'accounts', accounts: [account, otherAccount] });

        expect(worker.unsubscribe({ type: 'accounts', accounts: [account] })).toEqual({
            type: RESPONSES.UNSUBSCRIBE,
            payload: { subscribed: true },
        });
        expect(worker.state.getAccounts()).toEqual([otherAccount]);

        expect(worker.unsubscribe({ type: 'accounts', accounts: [otherAccount] })).toEqual({
            type: RESPONSES.UNSUBSCRIBE,
            payload: { subscribed: false },
        });
        expect(worker.state.getAccounts()).toEqual([]);
    });

    it('removes all accounts when none are given', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });

        expect(worker.unsubscribe({ type: 'accounts' })).toEqual({
            type: RESPONSES.UNSUBSCRIBE,
            payload: { subscribed: false },
        });
        expect(worker.state.getAccounts()).toEqual([]);
        expect(worker.state.getAddresses()).toEqual([]);
    });

    it('removes the given addresses from the worker state', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'addresses', addresses: [ADDRESS, OTHER_ADDRESS] });

        expect(worker.unsubscribe({ type: 'addresses', addresses: [ADDRESS] })).toEqual({
            type: RESPONSES.UNSUBSCRIBE,
            payload: { subscribed: true },
        });
        expect(worker.state.getAddresses()).toEqual([OTHER_ADDRESS]);
    });

    it.each(['fiatRates', 'mempool'] as const)('rejects an unsupported %s type', type => {
        const worker = createWorker();

        expect(() => worker.unsubscribe({ type })).toThrow(
            `Unsubscription type '${type}' not supported by EVM RPC worker`,
        );
    });
});

describe('account subscriptions', () => {
    const transferLog = (from: string, to: string) => ({
        address: '0x89b50855aa3be2f677cd6303cec089b5f319d72a',
        topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            `0x${from.slice(2).toLowerCase().padStart(64, '0')}`,
            `0x${to.slice(2).toLowerCase().padStart(64, '0')}`,
        ],
        data: `0x${'0'.repeat(63)}5`,
        blockNumber: '0x2',
        transactionHash: TXID,
        transactionIndex: '0x0',
    });

    it('polls for account activity without a block subscription, and stays quiet about blocks', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });
        expect(jest.getTimerCount()).toBe(1);

        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(worker.rpcRequest).toHaveBeenCalled();
        expect(worker.post).not.toHaveBeenCalled();
    });

    it('notifies about a transfer that touches a subscribed account', async () => {
        const worker = createWorker({ logs: () => [transferLog(OTHER_ADDRESS, ADDRESS)] });

        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });
        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        expect(worker.post).toHaveBeenCalledWith(
            expect.objectContaining({
                type: RESPONSES.NOTIFICATION,
                payload: expect.objectContaining({
                    type: 'notification',
                    payload: expect.objectContaining({ descriptor: ADDRESS }),
                }),
            }),
        );
    });

    it('notifies once per transaction, not on every poll', async () => {
        const worker = createWorker({ logs: () => [transferLog(OTHER_ADDRESS, ADDRESS)] });

        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });

        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
        worker.mineBlock();
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

        const notifications = worker.post.mock.calls.filter(
            ([data]) => data.payload?.type === 'notification',
        );
        expect(notifications).toHaveLength(1);
    });

    it('keeps watching accounts after the block subscription is dropped', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'block' });
        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });
        expect(jest.getTimerCount()).toBe(1);

        worker.unsubscribe({ type: 'block' });

        expect(jest.getTimerCount()).toBe(1);
    });

    it('stops polling once neither blocks nor accounts are subscribed', async () => {
        const worker = createWorker();

        await worker.subscribe({ type: 'block' });
        await worker.subscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });

        worker.unsubscribe({ type: 'block' });
        worker.unsubscribe({ type: 'accounts', accounts: [{ descriptor: ADDRESS }] });

        expect(jest.getTimerCount()).toBe(0);
    });
});
