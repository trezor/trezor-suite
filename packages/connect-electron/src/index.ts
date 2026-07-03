import { type TrezorConnectPrivilegedAPI, factoryPrivileged } from '@trezor/connect-common';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { throwError } from '@trezor/utils';

let proxy: TrezorConnectPrivilegedAPI | undefined;

const getProxy =
    <T extends keyof TrezorConnectPrivilegedAPI>(method: T): TrezorConnectPrivilegedAPI[T] =>
    (...params: any[]) =>
        proxy
            ? // @ts-expect-error
              proxy[method](...params)
            : throwError(
                  `TrezorConnect.${method} can't be accessed before calling TrezorConnect.initIpcProxy`,
              );

const initIpcProxy = async () => {
    proxy = await createIpcProxy<TrezorConnectPrivilegedAPI>('TrezorConnect');
};

// Exported to enable using directly
const TrezorConnect = factoryPrivileged({
    on: getProxy('on'),
    off: getProxy('off'),
    removeAllListeners: getProxy('removeAllListeners'),
    init: getProxy('init'),
    call: getProxy('call'),
    updateConnectSettings: getProxy('updateConnectSettings'),
    uiResponse: getProxy('uiResponse'),
    cancel: getProxy('cancel'),
    dispose: getProxy('dispose'),
    initIpcProxy,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from '@trezor/connect/src/exports';
