import type { Context } from '../types';
import { onTransaction } from './notifications';

export const subscribeAddresses = async (ctx: Context, addresses: string[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    state.addAddresses(addresses);
    if (!state.getSubscription('notification')) {
        api.on('notification', ev => onTransaction(ctx, ev));
        state.addSubscription('notification');
    }

    return api.subscribeAddresses(state.getAddresses());
};

export const unsubscribeAddresses = async ({ state, connect }: Context, addresses?: string[]) => {
    const api = await connect();
    // remove accounts
    if (!addresses) {
        state.removeAccounts(state.getAccounts());
    }
    const subscribed = state.removeAddresses(addresses || state.getAddresses());
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.removeAllListeners('notification');
        state.removeSubscription('notification');

        return api.unsubscribeAddresses();
    }

    // subscribe remained addresses
    return api.subscribeAddresses(subscribed);
};
