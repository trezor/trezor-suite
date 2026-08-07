import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';

import type { Context } from '../types';
import { onTransaction } from './notifications';

export const subscribeAccounts = async (ctx: Context, accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    state.addAccounts(accounts);
    if (!state.getSubscription('notification')) {
        api.on('notification', ev => onTransaction(ctx, ev));
        state.addSubscription('notification');
    }

    return api.subscribeAddresses(state.getAddresses());
};

export const unsubscribeAccounts = async (
    { state, connect }: Context,
    accounts?: SubscriptionAccountInfo[],
) => {
    state.removeAccounts(accounts || state.getAccounts());

    const api = await connect();
    const subscribed = state.getAddresses();
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
