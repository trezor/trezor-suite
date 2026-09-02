import type { Context } from '../types';
import { onNewFiatRates } from './notifications';

export const subscribeFiatRates = async (ctx: Context, currency?: string) => {
    const api = await ctx.connect();
    if (!ctx.state.getSubscription('fiatRates')) {
        ctx.state.addSubscription('fiatRates');
        api.on('fiatRates', ev => onNewFiatRates(ctx, ev));
    }

    return api.subscribeFiatRates(currency);
};

export const unsubscribeFiatRates = async ({ state, connect }: Context) => {
    if (!state.getSubscription('fiatRates')) return { subscribed: false };
    const api = await connect();
    api.removeAllListeners('fiatRates');
    state.removeSubscription('fiatRates');

    return api.unsubscribeFiatRates();
};
