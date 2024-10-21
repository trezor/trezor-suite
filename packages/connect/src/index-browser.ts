import { TypedError } from './constants/errors';
import { factory } from './factory';

// Throw error from each method. use @trezor/connect-web instead.
const fallback = () => {
    throw TypedError('Method_InvalidPackage');
};

const TrezorConnect = factory({
    eventEmitter: {
        on: fallback,
        off: fallback,
        removeAllListeners: fallback,
        listenerCount: fallback,
    } as any,
    manifest: fallback,
    init: fallback,
    call: fallback,
    requestLogin: fallback,
    uiResponse: fallback,
    cancel: fallback,
    dispose: fallback,
});

export default TrezorConnect;
export * from './exports';
