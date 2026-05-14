import { AbstractTransport, type AbstractTransportParams } from './abstract';
import { WRONG_ENVIRONMENT } from '../errors';
import { empty, emptySync } from '../utils/resultEmpty';

// this class loads in React Native environment only in case of accidental use of NodeUsbTransport

export class NodeUsbTransport extends AbstractTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        super(params);
        console.error(WRONG_ENVIRONMENT);
    }

    init = empty;
    acquire = empty;
    enumerate = empty;
    call = empty;
    receive = empty;
    send = empty;
    release = empty;
    stop = empty;
    releaseDevice = empty;
    releaseSync = emptySync;
    listen = emptySync;
}
