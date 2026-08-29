import { RESPONSES } from '@trezor/blockchain-link-types';
import { type IntervalId } from '@trezor/type-utils';

import type { Context } from '../types';

// Solana block validity is about 60 seconds (150*400ms), so we add a bit of margin
const BLOCK_SUBSCRIBE_INTERVAL_MS = 50000;

export const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };
    const api = await connect();

    const fetchBlock = async () => {
        const {
            value: { blockhash: blockHash, lastValidBlockHeight: blockHeight },
        } = await api.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
        if (blockHeight) {
            post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'block',
                    payload: {
                        blockHeight: Number(blockHeight),
                        blockHash,
                    },
                },
            });
        }
    };
    fetchBlock();

    // the solana RPC api has subscribe method, see here: https://www.quicknode.com/docs/solana/rootSubscribe
    // but solana block height is updated so often that it slows down the whole application and overloads the the api
    // so we instead use setInterval to check for new blocks every `BLOCK_SUBSCRIBE_INTERVAL_MS`
    const interval = setInterval(fetchBlock, BLOCK_SUBSCRIBE_INTERVAL_MS);
    // we save the interval in the state so we can clear it later
    state.addSubscription('block', interval);

    return { subscribed: true };
};

export const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const interval = state.getSubscription('block') as IntervalId;
    clearInterval(interval);
    state.removeSubscription('block');
};
