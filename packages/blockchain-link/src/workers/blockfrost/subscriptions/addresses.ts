import type { Context } from '../types';
import { onTransaction } from './notifications';

export const subscribeAddresses = async (ctx: Context, addresses: string[]) => {
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
    const socket = await connect();
    // remove accounts
    if (!addresses) {
        state.removeAccounts(state.getAccounts());
    }
    const subscribed = state.removeAddresses(addresses || state.getAddresses());
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeAllListeners('notification');
        state.removeSubscription('notification');

        return socket.unsubscribeAddresses();
    }

    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};
