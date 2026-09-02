import type { Context } from '../types';
import { onNewBlock } from './notifications';

export const subscribeBlock = async (ctx: Context) => {
    if (ctx.state.getSubscription('block')) return { subscribed: true };
    ctx.state.addSubscription('block');
    const api = await ctx.connect();
    api.on('block', ev => onNewBlock(ctx, ev));

    return api.subscribeBlock();
};

export const unsubscribeBlock = async ({ state, connect }: Context) => {
    if (!state.getSubscription('block')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('block');
    state.removeSubscription('block');

    return api.unsubscribeBlock();
};
