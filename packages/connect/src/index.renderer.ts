import { factoryPrivileged } from '@trezor/connect-common';

const dummy = (method: string) => () => {
    throw new Error(
        `TrezorConnect.${method} should never be called from electron renderer without using ipcProxy`,
    );
};

// Exported to enable using directly
const TrezorConnect = factoryPrivileged({
    on: dummy('eventEmitter.on'),
    off: dummy('eventEmitter.off'),
    removeAllListeners: dummy('eventEmitter.removeAllListeners'),
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
