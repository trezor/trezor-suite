import { AbstractTransport } from './abstract';
import { WRONG_ENVIRONMENT } from '../errors';
import { error } from '../utils/result';

const empty = () => Promise.resolve(error({ code: WRONG_ENVIRONMENT }));

const emptySync = () => error({ code: WRONG_ENVIRONMENT });

export class UdpTransport extends AbstractTransport {
    public name = 'UdpTransport' as const;

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
