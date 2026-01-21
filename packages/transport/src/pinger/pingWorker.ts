import type { PingWorker, PingWorkerRequest, PingWorkerResponse } from '../types';
import { ping } from './pingCommon';

setTimeout(() => {
    postMessage({ id: -1, payload: { success: true } } satisfies PingWorkerResponse);
}, 10);

onmessage = ({ data }: MessageEvent<PingWorkerRequest>) => {
    const { id, payload } = data;
    const { url } = payload;

    ping(url).then(success => {
        postMessage({ id, payload: { success } } satisfies PingWorkerResponse);
    });
};

// eslint-disable-next-line import/no-default-export
export default null as unknown as () => PingWorker
