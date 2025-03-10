import { Deferred, createDeferred } from '@trezor/utils';

import { error, success } from './result';
import { ABORTED_BY_SIGNAL } from '../errors';
import { ResultWithTypedError } from '../types';

type ReadResult = ResultWithTypedError<Buffer, typeof ABORTED_BY_SIGNAL>;

export const readMessageBuffer = () => {
    const readBuffer: Record<string, Buffer[]> = {};
    const readRequests: Record<string, Deferred<ReadResult>> = {};

    const onMessage = (path: string, data: Buffer) => {
        if (readRequests[path]) {
            // message received AFTER read request, resolve pending response
            readRequests[path].resolve(success(data));
            delete readRequests[path];
        } else {
            // message received BEFORE read request, put chunk into buffer and wait for read request
            if (!readBuffer[path]) {
                readBuffer[path] = [];
            }
            readBuffer[path].push(data);
        }
    };

    const read = (path: string, signal?: AbortSignal) => {
        const bufferMessage = readBuffer[path]?.shift();
        if (bufferMessage) {
            return Promise.resolve(success(bufferMessage));
        }

        if (readRequests[path]) {
            return readRequests[path].promise;
        }

        const dfd = createDeferred<ReadResult>();
        readRequests[path] = dfd;

        const abortListener = () => {
            dfd.resolve(error({ error: ABORTED_BY_SIGNAL }));
        };
        signal?.addEventListener('abort', abortListener);

        return dfd.promise.finally(() => {
            signal?.removeEventListener('abort', abortListener);
            delete readRequests[path];
        });
    };

    return {
        onMessage,
        read,
    };
};
