import { getWeakRandomId } from '@trezor/utils';
import { TypedEmitter } from '../types/typed-emitter';
import { Descriptor } from '../types';
import {
    EnumerateDoneRequest,
    AcquireIntentRequest,
    ReleaseIntentRequest,
    ReleaseDoneRequest,
    GetPathBySessionRequest,
} from './types';
import { SessionsBackground } from './background';

type RegisterCallbackOnDescriptorsChange = (callback: (descriptor: Descriptor[]) => any) => void;

/**
 * SessionsClient gives you API for communication with SessionsBackground.
 * You should provide your own communication method in requestFn param (direct module access, sharedworker messages...)
 */
export class SessionsClient extends TypedEmitter<{
    ['descriptors']: Descriptor[];
}> {
    // request method responsible for communication with sessions background.
    private request: SessionsBackground['handleMessage'];

    // used only for debugging - discriminating sessions clients in sessions background log
    private caller = getWeakRandomId(3);
    private id: number;

    constructor({
        requestFn,
        registerCallbackOnDescriptorsChange,
    }: {
        requestFn: SessionsBackground['handleMessage'];
        registerCallbackOnDescriptorsChange?: RegisterCallbackOnDescriptorsChange;
    }) {
        super();
        this.id = 0;
        this.request = params => {
            params.caller = this.caller;
            params.id = this.id;
            this.id++;
            return requestFn(params);
        };

        if (registerCallbackOnDescriptorsChange) {
            registerCallbackOnDescriptorsChange(descriptors => {
                this.emit('descriptors', descriptors);
            });
        }
    }

    handshake() {
        return this.request({ type: 'handshake' });
    }

    enumerateIntent() {
        return this.request({ type: 'enumerateIntent' });
    }
    enumerateDone(payload: EnumerateDoneRequest) {
        return this.request({ type: 'enumerateDone', payload });
    }
    acquireIntent(payload: AcquireIntentRequest) {
        return this.request({ type: 'acquireIntent', payload });
    }
    acquireDone() {
        return this.request({ type: 'acquireDone' });
    }
    releaseIntent(payload: ReleaseIntentRequest) {
        return this.request({ type: 'releaseIntent', payload });
    }
    releaseDone(payload: ReleaseDoneRequest) {
        return this.request({ type: 'releaseDone', payload });
    }
    getSessions() {
        return this.request({ type: 'getSessions' });
    }
    getPathBySession(payload: GetPathBySessionRequest) {
        return this.request({ type: 'getPathBySession', payload });
    }
}
