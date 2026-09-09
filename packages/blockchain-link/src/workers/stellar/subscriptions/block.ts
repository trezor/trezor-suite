import { RESPONSES } from '@trezor/blockchain-link-types';
import stellar from '@trezor/network-stellar/runtime';
import { type IntervalId } from '@trezor/type-utils';

import type { Context } from '../types';

// Stellar typically produces a new block every 5 seconds.
// Our requirements for real-time updates are not high; let us update every 15 seconds.
const BLOCK_SUBSCRIBE_INTERVAL_MS = 1000 * 15;

export const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };
    const api = await connect();
    const { createStellarDataSource } = await stellar();

    // Through the data source, so the poll reads the head from whichever backend serves it
    // cheaply: `getLatestLedger` ships the whole ledger close meta, which at this interval is
    // megabytes an hour of payload Suite never looks at.
    const dataSource = createStellarDataSource(api);

    const fetchBlock = async () => {
        const { sequence: blockHeight, hash: blockHash } = await dataSource.readLatestLedger();
        post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'block',
                payload: {
                    blockHeight,
                    blockHash,
                },
            },
        });
    };
    fetchBlock();

    const interval = setInterval(fetchBlock, BLOCK_SUBSCRIBE_INTERVAL_MS);
    // we save the interval in the state so we can clear it later
    state.addSubscription('block', interval);

    return { subscribed: true };
};

export const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return { subscribed: false };

    const interval = state.getSubscription('block') as IntervalId;
    clearInterval(interval);
    state.removeSubscription('block');

    return { subscribed: false };
};
