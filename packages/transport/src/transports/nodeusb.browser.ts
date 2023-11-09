import { AbstractTransport, AbstractTransportParams } from './abstract';

import { WRONG_ENVIRONMENT } from '../errors';
import { empty, emptyAbortable, emptySync } from '../utils/resultEmpty';

// this class loads in browser environment only in case of accidental use of NodeUsbTransport

export class NodeUsbTransport extends AbstractTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params?: AbstractTransportParams) {
        super(params);
        console.error(WRONG_ENVIRONMENT);
    }

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
