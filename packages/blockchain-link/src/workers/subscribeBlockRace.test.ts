import {
    subscribeBlock as blockbookSubscribeBlock,
    unsubscribeBlock as blockbookUnsubscribeBlock,
} from './blockbook/subscriptions/block';
import {
    subscribeBlock as rippleSubscribeBlock,
    unsubscribeBlock as rippleUnsubscribeBlock,
} from './ripple/subscriptions/block';
import {
    subscribeBlock as solanaSubscribeBlock,
    unsubscribeBlock as solanaUnsubscribeBlock,
} from './solana/subscriptions/block';
import { WorkerState } from './state';
import {
    subscribeBlock as stellarSubscribeBlock,
    unsubscribeBlock as stellarUnsubscribeBlock,
} from './stellar/subscriptions/block';

// Regression coverage for the race condition originally fixed in blockbook
// (commit e566cc8823, "fix(blockchain-link): fix race condition in block
// subscription"). That fix moved the subscription guard to before the
// awaited connect() call so a second concurrent subscribeBlock() call sees
// the guard is already set and bails out. ripple, solana and stellar never
// received the equivalent fix: their guard is only fully established after
// an await, so two concurrent subscribeBlock() calls both pass the guard
// check and both proceed to create a subscription/interval. Since
// WorkerState.addSubscription() is a last-write-wins overwrite, the second
// call's handle clobbers the first's, orphaning the first subscription /
// interval, which then survives unsubscribeBlock() + disconnect().

describe('subscribeBlock concurrency (blockbook / ripple / solana / stellar)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('blockbook: two concurrent subscribeBlock calls only ever connect once (already fixed)', async () => {
        const state = new WorkerState();
        let connectCalls = 0;
        const listeners: Record<string, (() => void)[]> = {};
        const api = {
            on: (event: string, cb: () => void) => {
                listeners[event] = (listeners[event] ?? []).concat(cb);
            },
            removeAllListeners: (event: string) => {
                listeners[event] = [];
            },
            subscribeBlock: () => Promise.resolve({ subscribed: true }),
            unsubscribeBlock: () => Promise.resolve({ subscribed: false }),
        };
        const connect = () => {
            connectCalls += 1;

            return Promise.resolve(api as any);
        };
        const ctx = { state, connect, post: jest.fn() } as any;

        await Promise.all([blockbookSubscribeBlock(ctx), blockbookSubscribeBlock(ctx)]);

        expect(connectCalls).toBe(1);
        expect(listeners.block).toHaveLength(1);

        await blockbookUnsubscribeBlock(ctx);
        expect(state.getSubscription('block')).toBeUndefined();
    });

    it('ripple: a concurrent subscribeBlock call self-heals (no orphaned handle, but connects twice)', async () => {
        const state = new WorkerState();
        let connectCalls = 0;
        let listenerCount = 0;
        const client = {
            on: () => {
                listenerCount += 1;
            },
            removeAllListeners: () => {
                listenerCount = 0;
            },
        };
        const connect = () => {
            connectCalls += 1;

            return Promise.resolve(client as any);
        };
        const ctx = { state, connect, post: jest.fn() } as any;

        await Promise.all([rippleSubscribeBlock(ctx), rippleSubscribeBlock(ctx)]);

        // Pre-fix: the guard is only set after the awaited connect(), so both
        // concurrent calls race past it and connect/register a listener twice.
        expect(connectCalls).toBe(1);
        expect(listenerCount).toBe(1);

        await rippleUnsubscribeBlock(ctx);
        expect(listenerCount).toBe(0);
        expect(state.getSubscription('ledger')).toBeUndefined();
    });

    it('solana: a concurrent subscribeBlock call orphans the first interval, which survives unsubscribe', async () => {
        const state = new WorkerState();
        let connectCalls = 0;
        let intervalsCreated = 0;
        const clearedIntervals: unknown[] = [];
        const realSetInterval = global.setInterval;
        const realClearInterval = global.clearInterval;
        const createdIntervalIds: unknown[] = [];

        jest.spyOn(global, 'setInterval').mockImplementation(((fn: any, ms: any) => {
            intervalsCreated += 1;
            const id = realSetInterval(fn, ms);
            createdIntervalIds.push(id);

            return id;
        }) as any);
        jest.spyOn(global, 'clearInterval').mockImplementation(((id: any) => {
            clearedIntervals.push(id);

            return realClearInterval(id);
        }) as any);

        const api = {
            rpc: {
                getLatestBlockhash: () => ({
                    send: () =>
                        Promise.resolve({
                            value: { blockhash: '0x0', lastValidBlockHeight: 1 },
                        }),
                }),
            },
        };
        const connect = () => {
            connectCalls += 1;

            return Promise.resolve(api as any);
        };
        const ctx = { state, connect, post: jest.fn() } as any;

        await Promise.all([solanaSubscribeBlock(ctx), solanaSubscribeBlock(ctx)]);

        // Pre-fix: two concurrent calls both pass the guard (only set after
        // the awaited connect()), so two intervals get created; the second
        // addSubscription('block', interval) overwrites the first's handle.
        expect(connectCalls).toBe(1);
        expect(intervalsCreated).toBe(1);
        expect(createdIntervalIds).toHaveLength(1);

        solanaUnsubscribeBlock(ctx as any);

        // Every interval that was actually created must have been cleared -
        // none should be left running after unsubscribe.
        expect(clearedIntervals.sort()).toEqual(
            [...createdIntervalIds].sort() as unknown as never[],
        );
    });

    it('stellar: a concurrent subscribeBlock call orphans the first interval, which survives unsubscribe', async () => {
        const state = new WorkerState();
        let connectCalls = 0;
        let intervalsCreated = 0;
        const clearedIntervals: unknown[] = [];
        const realSetInterval = global.setInterval;
        const realClearInterval = global.clearInterval;
        const createdIntervalIds: unknown[] = [];

        jest.spyOn(global, 'setInterval').mockImplementation(((fn: any, ms: any) => {
            intervalsCreated += 1;
            const id = realSetInterval(fn, ms);
            createdIntervalIds.push(id);

            return id;
        }) as any);
        jest.spyOn(global, 'clearInterval').mockImplementation(((id: any) => {
            clearedIntervals.push(id);

            return realClearInterval(id);
        }) as any);

        const api = {
            ledgers: () => ({
                order: () => ({
                    limit: () => ({
                        call: () =>
                            Promise.resolve({
                                records: [{ sequence: 1, hash: '0x0' }],
                            }),
                    }),
                }),
            }),
        };
        const connect = () => {
            connectCalls += 1;

            return Promise.resolve(api as any);
        };
        const ctx = { state, connect, post: jest.fn() } as any;

        await Promise.all([stellarSubscribeBlock(ctx), stellarSubscribeBlock(ctx)]);

        expect(connectCalls).toBe(1);
        expect(intervalsCreated).toBe(1);
        expect(createdIntervalIds).toHaveLength(1);

        stellarUnsubscribeBlock(ctx as any);

        expect(clearedIntervals.sort()).toEqual(
            [...createdIntervalIds].sort() as unknown as never[],
        );
    });
});
