/* eslint-disable no-restricted-globals */
import { aggregateBalanceHistory } from '@wallet-utils/graphUtils';

const ctx: Worker = self as any;

interface CustomMessageEvent extends MessageEvent {
    data: {
        history: any;
        groupBy: any;
        type: any;
    };
}

ctx.addEventListener('message', (event: CustomMessageEvent) => {
    const result = aggregateBalanceHistory(event.data.history, event.data.groupBy, event.data.type);
    ctx.postMessage(result);
});

// // Trickery to fix TypeScript since this will be done by "worker-loader"
export default {} as typeof Worker & (new () => Worker);
