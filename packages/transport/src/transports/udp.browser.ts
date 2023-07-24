import { AbstractTransport } from './abstract';

import { error } from '../utils/result';
import { WRONG_ENVIRONMENT } from '../errors';

const emptyAbortable = () => ({
    promise: Promise.resolve(error({ error: WRONG_ENVIRONMENT })),
    abort: () => {},
});

const empty = () => Promise.resolve(error({ error: WRONG_ENVIRONMENT }));

const emptySync = () => error({ error: WRONG_ENVIRONMENT });

export class UdpTransport extends AbstractTransport {
    public name = 'UdpTransport' as const;

    init = emptyAbortable;
    acquire = emptyAbortable;
    enumerate = emptyAbortable;
    call = emptyAbortable;
    receive = emptyAbortable;
    send = emptyAbortable;
    release = emptyAbortable;
    stop = empty;
    releaseDevice = empty;
    listen = emptySync;
}
