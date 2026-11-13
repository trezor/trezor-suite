import type { Context } from '../types';
import { onNewBlock } from './notifications';

export const subscribeBlock = async (ctx: Context) => {
    if (!ctx.state.getSubscription('ledger')) {
        // Claim the subscription synchronously before the awaited connect() so a
        // concurrent subscribeBlock() call sees the guard already set and bails
        // out, instead of both calls racing past the guard and connecting/
        // registering a listener twice (see e566cc8823 for the same fix in blockbook).
        ctx.state.addSubscription('ledger');
        const api = await ctx.connect();
        api.on('ledgerClosed', ev => onNewBlock(ctx, ev));
    }

    return { subscribed: true };
};

export const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('ledger')) return;
    const client = await connect();
    client.removeAllListeners('ledgerClosed');
    state.removeSubscription('ledger');
};
