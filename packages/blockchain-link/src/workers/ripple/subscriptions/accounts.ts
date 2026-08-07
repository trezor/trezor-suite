import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';

import type { Context } from '../types';
import { unsubscribeAddresses } from './addresses';
import { onTransaction } from './notifications';

export const subscribeAccounts = async (ctx: Context, accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    const prevAddresses = state.getAddresses();
    state.addAccounts(accounts);
    const uniqueAddresses = state.getAddresses().filter(a => !prevAddresses.includes(a));
    if (uniqueAddresses.length > 0) {
        if (!state.getSubscription('notification')) {
            api.on('transaction', ev => onTransaction(ctx, ev));
            state.addSubscription('notification');
        }
        await api.request({
            command: 'subscribe',
            accounts_proposed: uniqueAddresses,
        });
    }

    return { subscribed: state.getAddresses().length > 0 };
};

export const unsubscribeAccounts = async (ctx: Context, accounts?: SubscriptionAccountInfo[]) => {
    const { state } = ctx;
    const prevAddresses = state.getAddresses();
    state.removeAccounts(accounts || state.getAccounts());
    const addresses = state.getAddresses();
    const uniqueAddresses = prevAddresses.filter(a => !addresses.includes(a));
    await unsubscribeAddresses(ctx, uniqueAddresses);
};
