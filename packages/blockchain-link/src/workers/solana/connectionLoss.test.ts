import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import solanaRuntime from '@trezor/network-solana/runtime';
import type { SolanaAPI } from '@trezor/network-solana/types';

import { BlockchainLink } from '../../index';

import SolanaWorker from './index';

const descriptor = '2MLmmoKgCrxVEzMeGatnjdABYS5RXsQSNikcWrmnvQna';

const SUBSCRIPTIONS_PER_ACCOUNT = 1 + Object.keys(tokenProgramsInfo).length;

// @solana/kit is not a dependency here, and its isSolanaError only reads the name and the code,
// so SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED (8190003) is reproduced by hand.
// subscribeWithClosingChannel asserts the production predicate still recognises it.
const channelClosedError = Object.assign(new Error('WebSocket connection closed'), {
    name: 'SolanaError',
    context: { __code: 8190003 },
});

const subscribeWithClosingChannel = async () => {
    const { isConnectionClosedError } = await solanaRuntime();
    expect(isConnectionClosedError(channelClosedError)).toBe(true);

    const subscriptions: string[] = [];
    let closing = true;
    let refusing = false;

    const channel = (label: string) => ({
        subscribe: () => {
            subscriptions.push(label);
            if (refusing) {
                refusing = false;

                return Promise.reject(new Error('subscribe refused'));
            }

            return Promise.resolve({
                async *[Symbol.asyncIterator]() {
                    if (closing) throw channelClosedError;
                    // a channel that holds delivers nothing in these tests
                    yield await new Promise<never>(() => {});
                },
            });
        },
    });

    const api = {
        rpcSubscriptions: {
            accountNotifications: (address: string) => channel(address),
            programNotifications: (programId: string) => channel(programId),
        },
    } as unknown as SolanaAPI;

    const worker = SolanaWorker();
    let connections = 0;
    worker.tryConnect = () => {
        connections += 1;

        return Promise.resolve(api);
    };

    const blockchain = new BlockchainLink({
        name: 'Solana',
        worker: () => worker,
        server: ['dummyUrl'],
        debug: false,
    });

    const disconnected = jest.fn();
    blockchain.on('disconnected', disconnected);

    const account = { descriptor } as SubscriptionAccountInfo;
    const subscribed = blockchain.subscribe({ type: 'accounts', accounts: [account] });
    // the worker handshake is on a 10 ms timer, and the channel closes right after subscribing
    await jest.advanceTimersByTimeAsync(20);
    await subscribed;

    return {
        blockchain,
        account,
        disconnected,
        subscriptions,
        holdChannel: () => {
            closing = false;
        },
        refuseNextSubscribe: () => {
            refusing = true;
        },
        getConnections: () => connections,
    };
};

describe('solana worker connection loss', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // reproduce-fresh.har: every subscription channel closed within about 1.3 s of subscribing,
    // and each close was escalated into a full backend teardown — 15 reconnects and 14 rebuilt
    // workers in 21 s, every rebuild refetching the token definitions and re-syncing all accounts
    // with an empty cache. The JSON-RPC transport is plain HTTP and stays usable throughout.
    it('does not report a disconnect when only a subscription channel closes', async () => {
        const { blockchain, disconnected } = await subscribeWithClosingChannel();

        expect(disconnected).not.toHaveBeenCalled();

        blockchain.dispose();
    });

    it('keeps the RPC connection when a subscription channel closes', async () => {
        const { blockchain, account, getConnections } = await subscribeWithClosingChannel();

        const subscribed = blockchain.subscribe({ type: 'accounts', accounts: [account] });
        await jest.advanceTimersByTimeAsync(0);
        await subscribed;

        expect(getConnections()).toBe(1);

        blockchain.dispose();
    });

    it('resubscribes the accounts on the same connection', async () => {
        const { blockchain, subscriptions, holdChannel, getConnections } =
            await subscribeWithClosingChannel();

        expect(subscriptions).toHaveLength(SUBSCRIPTIONS_PER_ACCOUNT);

        holdChannel();
        await jest.advanceTimersByTimeAsync(1000);

        expect(subscriptions).toHaveLength(2 * SUBSCRIPTIONS_PER_ACCOUNT);
        expect(getConnections()).toBe(1);

        blockchain.dispose();
    });

    it('waits longer before each attempt while the channel keeps closing', async () => {
        const { blockchain, subscriptions } = await subscribeWithClosingChannel();

        await jest.advanceTimersByTimeAsync(1000);
        expect(subscriptions).toHaveLength(2 * SUBSCRIPTIONS_PER_ACCOUNT);

        await jest.advanceTimersByTimeAsync(1000);
        expect(subscriptions).toHaveLength(2 * SUBSCRIPTIONS_PER_ACCOUNT);

        await jest.advanceTimersByTimeAsync(1000);
        expect(subscriptions).toHaveLength(3 * SUBSCRIPTIONS_PER_ACCOUNT);

        blockchain.dispose();
    });

    it('retries the same accounts after a failed attempt', async () => {
        const { blockchain, subscriptions, refuseNextSubscribe, holdChannel } =
            await subscribeWithClosingChannel();

        refuseNextSubscribe();
        await jest.advanceTimersByTimeAsync(1000);
        expect(subscriptions).toHaveLength(SUBSCRIPTIONS_PER_ACCOUNT + 1);

        holdChannel();
        await jest.advanceTimersByTimeAsync(2000);
        expect(subscriptions.filter(subscription => subscription === descriptor)).toHaveLength(3);

        blockchain.dispose();
    });
});
