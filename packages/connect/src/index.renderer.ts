import { factory } from '@trezor/connect-common';

const dummy = (method: string) => () => {
    throw new Error(
        `TrezorConnect.${method} should never be called from electron renderer without using ipcProxy`,
    );
};

// Exported to enable using directly
const TrezorConnect = factory({
    eventEmitter: {
        on: dummy('eventEmitter.on'),
        removeListener: dummy('eventEmitter.removeListener'),
        removeAllListeners: dummy('eventEmitter.removeAllListeners'),
    } as any,
    init: dummy('init'),
    call: dummy('call'),
    updateConnectSettings: dummy('updateConnectSettings'),
    uiResponse: dummy('uiResponse'),
    cancel: dummy('cancel'),
    dispose: dummy('dispose'),
});

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
