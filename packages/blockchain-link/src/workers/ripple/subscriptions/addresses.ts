import type { Context } from '../types';
import { onTransaction } from './notifications';

export const subscribeAddresses = async (ctx: Context, addresses: string[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const api = await ctx.connect();
    const { state } = ctx;
    const uniqueAddresses = state.addAddresses(addresses);

    if (uniqueAddresses.length > 0) {
        if (!state.getSubscription('transaction')) {
            api.on('transaction', ev => onTransaction(ctx, ev));
            state.addSubscription('transaction');
        }

        await api.request({
            command: 'subscribe',
            accounts_proposed: uniqueAddresses,
        });
    }

    return { subscribed: state.getAddresses().length > 0 };
};

export const unsubscribeAddresses = async ({ state, connect }: Context, addresses?: string[]) => {
    // remove accounts
    const api = await connect();
    if (!addresses) {
        const all = state.getAddresses();
        state.removeAccounts(state.getAccounts());
        state.removeAddresses(all);
        await api.request({
            command: 'unsubscribe',
            accounts_proposed: all,
        });
    } else {
        state.removeAddresses(addresses);
        await api.request({
            command: 'unsubscribe',
            accounts_proposed: addresses,
        });
    }
    if (state.getAccounts().length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        api.connection.removeAllListeners('transaction');
        // api.connection.off('ledgerClosed', onLedgerClosed);
        state.removeSubscription('transaction');
    }
};
