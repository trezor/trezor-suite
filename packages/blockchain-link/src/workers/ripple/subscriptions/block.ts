import type { Context } from '../types';
import { onNewBlock } from './notifications';

export const subscribeBlock = async (ctx: Context) => {
    if (!ctx.state.getSubscription('ledger')) {
        const api = await ctx.connect();
        api.on('ledgerClosed', ev => onNewBlock(ctx, ev));
        ctx.state.addSubscription('ledger');
    }

    return { subscribed: true };
};

export const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('ledger')) return;
    const client = await connect();
    client.removeAllListeners('ledgerClosed');
    state.removeSubscription('ledger');
};
