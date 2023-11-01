import { AbstractTransport } from './abstract';

import { WRONG_ENVIRONMENT } from '../errors';
import { empty, emptyAbortable, emptySync } from '../utils/resultEmpty';

// this class loads in node environment only in case of accidental use of WebBluetoothTransport
export class WebBluetoothTransport extends AbstractTransport {
    public name = 'WebBluetoothTransport' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
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
