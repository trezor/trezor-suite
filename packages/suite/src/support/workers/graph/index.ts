/*
    It's crucial to import directly from the 'utilsWorker' file. 
    Otherwise, '@trezor/connect' would end up being bundled into the worker, which will break graph on dashboard.
*/
import { aggregateBalanceHistory } from 'src/utils/wallet/graph/utilsWorker';

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
