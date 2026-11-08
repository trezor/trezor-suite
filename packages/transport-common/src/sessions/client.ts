import { TypedEmitter, getWeakRandomId } from '@trezor/utils';

import { type Descriptor } from '../types';
import {
    type AcquireDoneRequest,
    type AcquireIntentRequest,
    type EnumerateDoneRequest,
    type GetPathBySessionRequest,
    type HandleMessageParams,
    type ReleaseDoneRequest,
    type ReleaseIntentRequest,
    type SessionsBackgroundInterface,
} from './types';

/**
 * SessionsClient gives you API for communication with SessionsBackground.
 * You should provide your own communication method in requestFn param (direct module access, sharedworker messages...)
 */
export class SessionsClient extends TypedEmitter<{
    descriptors: Descriptor[];
    releaseRequest: Descriptor;
}> {
    // used only for debugging - discriminating sessions clients in sessions background log
    private caller = getWeakRandomId(3);
    private id;
    private background;
    private readonly onDescriptors = (descriptors: Descriptor[]) =>
        this.emit('descriptors', descriptors);
    private readonly onReleaseRequest = (descriptor: Descriptor) =>
        this.emit('releaseRequest', descriptor);

    constructor(background: SessionsBackgroundInterface) {
        super();
        this.id = 0;
        this.background = background;
        background.on('descriptors', this.onDescriptors);
        background.on('releaseRequest', this.onReleaseRequest);
    }

    public setBackground(background: SessionsBackgroundInterface) {
        this.background.dispose();

        this.id = 0;
        this.background = background;
        background.on('descriptors', this.onDescriptors);
        background.on('releaseRequest', this.onReleaseRequest);
    }

    private request<M extends HandleMessageParams>(params: M) {
        return this.background.handleMessage({ ...params, caller: this.caller, id: this.id++ });
    }

    public handshake() {
        return this.request({ type: 'handshake' });
    }
    public enumerateDone(payload: EnumerateDoneRequest) {
        return this.request({ type: 'enumerateDone', payload });
    }
    public acquireIntent(payload: AcquireIntentRequest) {
        return this.request({ type: 'acquireIntent', payload });
    }
    public acquireDone(payload: AcquireDoneRequest) {
        return this.request({ type: 'acquireDone', payload });
    }
    public releaseIntent(payload: ReleaseIntentRequest) {
        return this.request({ type: 'releaseIntent', payload });
    }
    public releaseDone(payload: ReleaseDoneRequest) {
        return this.request({ type: 'releaseDone', payload });
    }
    public getSessions() {
        return this.request({ type: 'getSessions' });
    }
    public getPathBySession(payload: GetPathBySessionRequest) {
        return this.request({ type: 'getPathBySession', payload });
    }
    public dispose() {
        this.background.off('descriptors', this.onDescriptors);
        this.background.off('releaseRequest', this.onReleaseRequest);
        this.removeAllListeners('descriptors');
        this.removeAllListeners('releaseRequest');

        return this.request({ type: 'dispose' });
    }
}
