import type { Context } from '../types';
import { onMempoolTx } from './notifications';

export const subscribeMempool = async (ctx: Context) => {
    const api = await ctx.connect();
    if (!ctx.state.getSubscription('mempool')) {
        ctx.state.addSubscription('mempool');
        api.on('mempool', ev => onMempoolTx(ctx, ev));
    }

    return api.subscribeMempool();
};

export const unsubscribeMempool = async ({ state, connect }: Context) => {
    if (!state.getSubscription('mempool')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('mempool');
    state.removeSubscription('mempool');

    return api.unsubscribeMempool();
};
