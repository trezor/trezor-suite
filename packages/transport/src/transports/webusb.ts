import { AbstractTransport } from './abstract';

import { error } from '../utils/result';
import { WRONG_ENVIRONMENT } from '../errors';

const emptyAbortable = () => ({
    promise: Promise.resolve(error({ error: WRONG_ENVIRONMENT })),
    abort: () => {},
});

const empty = () => Promise.resolve(error({ error: WRONG_ENVIRONMENT }));

const emptySync = () => error({ error: WRONG_ENVIRONMENT });

// this class loads in node environment only in case of accidental use of WebusbTransport
export class WebUsbTransport extends AbstractTransport {
    public name = 'WebUsbTransport' as const;

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
