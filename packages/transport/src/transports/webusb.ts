import { AbstractTransport, AbstractTransportParams } from './abstract';

import { WRONG_ENVIRONMENT } from '../errors';
import { empty, emptySync } from '../utils/resultEmpty';

// this class loads in node environment only in case of accidental use of WebusbTransport
export class WebUsbTransport extends AbstractTransport {
    public name = 'WebUsbTransport' as const;
    public apiType = 'usb' as const;

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
    listen = emptySync;
}
