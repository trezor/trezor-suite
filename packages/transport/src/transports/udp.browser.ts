import { AbstractTransport } from './abstract';

import { error } from '../utils/result';
import { WRONG_ENVIRONMENT } from '../errors';

const empty = () => Promise.resolve(error({ error: WRONG_ENVIRONMENT }));

const emptySync = () => error({ error: WRONG_ENVIRONMENT });

export class UdpTransport extends AbstractTransport {
    public name = 'UdpTransport' as const;
    public apiType = 'udp' as const;

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
