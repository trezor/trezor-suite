/* eslint-disable no-restricted-globals */
import { aggregateBalanceHistory } from '@wallet-utils/graphUtils';

const ctx: Worker = self as any;

ctx.addEventListener('message', event => {
    const result = aggregateBalanceHistory(event.data);
    ctx.postMessage(result);
});

// // Trickery to fix TypeScript since this will be done by "worker-loader"
export default {} as typeof Worker & (new () => Worker);
