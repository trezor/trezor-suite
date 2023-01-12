import { getWeakRandomId } from '@trezor/utils';
import { TypedEmitter } from '../types/typed-emitter';
import { Descriptor } from '../types';
import {
    EnumerateDone,
    AcquireIntent,
    ReleaseIntent,
    ReleaseDone,
    AcquireDone,
    GetPathBySession,
} from './types';
import { SessionsBackground } from './background';

type Params<T> = T & { caller?: string };

export type ClientRequest = (
    params:
        | Params<{ type: 'handshake' }>
        | Params<{ type: 'enumerateIntent'; payload: undefined }>
        | Params<{ type: 'enumerateDone'; payload: EnumerateDone }>
        | Params<{ type: 'acquireIntent'; payload: AcquireIntent }>
        | Params<{ type: 'acquireDone'; payload: AcquireDone }>
        | Params<{ type: 'releaseIntent'; payload: ReleaseIntent }>
        | Params<{ type: 'releaseDone'; payload: ReleaseDone }>
        | Params<{ type: 'getSessions'; payload: undefined }>
        | Params<{ type: 'getPathBySession'; payload: GetPathBySession }>,
) => any;

type RegisterCallbackOnDescriptorsChange = (callback: (descriptor: Descriptor[]) => any) => void;
/**
 * This class:
 * - is responsible provides unified API for communication with SessionsBackground singleton
 * - actual mean of communication should be implemented in "request" param
 */
export class SessionsClient extends TypedEmitter<{
    ['descriptors']: Descriptor[];
}> {
    // request method responsible for communication with sessions background.
    private request: ClientRequest;
    // used only for debugging - discriminating sessions clients in sessions background log
    private caller = getWeakRandomId(3);
    private ready = false;

    constructor({
        requestFn,
        registerCallbackOnDescriptorsChange,
    }: {
        requestFn: ClientRequest;
        registerCallbackOnDescriptorsChange: RegisterCallbackOnDescriptorsChange;
    }) {
        super();
        this.request = params => {
            if (!this.ready && params.type !== 'handshake') {
                throw new Error('sessions background is not available');
            }
            params.caller = this.caller;
            return requestFn(params);
        };

        registerCallbackOnDescriptorsChange(descriptors => {
            this.emit('descriptors', descriptors);
        });
    }

    async handshake() {
        // todo: add some timeout
        const res = await this.request({ type: 'handshake' });

        if (res.type === 'ack') {
            this.ready = true;
        }
        return res;
    }

    // there will be reading from usb
    enumerateIntent(): ReturnType<SessionsBackground['enumerateIntent']> {
        return this.request({ type: 'enumerateIntent', payload: undefined });
    }
    enumerateDone(payload: EnumerateDone): ReturnType<SessionsBackground['enumerateDone']> {
        return this.request({ type: 'enumerateDone', payload });
    }
    // there will be reading/writing from usb for particular path
    acquireIntent(payload: AcquireIntent): ReturnType<SessionsBackground['acquireIntent']> {
        return this.request({ type: 'acquireIntent', payload });
    }
    acquireDone(payload: AcquireDone): ReturnType<SessionsBackground['acquireDone']> {
        return this.request({ type: 'acquireDone', payload });
    }
    // there will be no activity for particular path now
    releaseIntent(payload: ReleaseIntent): ReturnType<SessionsBackground['releaseIntent']> {
        return this.request({ type: 'releaseIntent', payload });
    }
    releaseDone(payload: ReleaseDone): ReturnType<SessionsBackground['releaseIntent']> {
        return this.request({ type: 'releaseDone', payload });
    }

    getSessions(): ReturnType<SessionsBackground['getSessions']> {
        return this.request({ type: 'getSessions', payload: undefined });
    }

    getPathBySession(
        payload: GetPathBySession,
    ): Awaited<ReturnType<SessionsBackground['getPathBySession']>> {
        return this.request({ type: 'getPathBySession', payload });
    }
}
