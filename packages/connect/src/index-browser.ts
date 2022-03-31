import { factory } from './factory';

// NOTE: This file should be used only as a dependency
// @trezor/connect-popup
// @trezor/connect-iframe
// @trezor/connect-web

// Provide fallback for missing implementation
const fallback = () => {
    throw new Error('Use @trezor/connect-web package');
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
    getSettings: fallback,
    customMessage: fallback,
    requestLogin: fallback,
    uiResponse: fallback,
    renderWebUSBButton: fallback,
    disableWebUSB: fallback,
    cancel: fallback,
    dispose: fallback,
});
export default TrezorConnect;

// NOTE: exports should be the same in here and index.ts
export * as ProtobufMessages from '@trezor/transport/lib/types/messages';
export * from './constants';
export * from './events';
export * from './types';
