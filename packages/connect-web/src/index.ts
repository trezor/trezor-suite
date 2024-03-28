import { methods as TrezorConnectIframe } from './impl/iframe';
import { methods as TrezorConnectCoreInPopup } from './impl/core-in-popup';
import type { ConnectSettings } from '@trezor/connect/src/types';
import { factory } from '@trezor/connect/src/factory';

let useCoreInPopup = false;

// Proxy method to select the correct implementation
const selectMethodImpl =
    <
        T extends Exclude<
            keyof typeof TrezorConnectCoreInPopup & keyof typeof TrezorConnectIframe,
            'eventEmitter'
        >,
    >(
        method: T,
    ) =>
    (
        ...args: Parameters<(typeof TrezorConnectCoreInPopup)[T]>
    ): ReturnType<(typeof TrezorConnectCoreInPopup)[T]> => {
        console.log('TrezorConnect', useCoreInPopup ? 'core' : 'popup', method, args);
        const fn = useCoreInPopup ? TrezorConnectCoreInPopup[method] : TrezorConnectIframe[method];

        // @ts-expect-error problem for a future me
        return fn(...args);
    };

const TrezorConnect = factory({
    init: (settings: Partial<ConnectSettings> = {}) => {
        useCoreInPopup = settings?.useCoreInPopup === true;

        return selectMethodImpl('init')(settings);
    },
    manifest: selectMethodImpl('manifest'),
    call: selectMethodImpl('call'),
    requestLogin: selectMethodImpl('requestLogin'),
    uiResponse: selectMethodImpl('uiResponse'),
    renderWebUSBButton: selectMethodImpl('renderWebUSBButton'),
    disableWebUSB: selectMethodImpl('disableWebUSB'),
    requestWebUSBDevice: selectMethodImpl('requestWebUSBDevice'),
    cancel: selectMethodImpl('cancel'),
    dispose: selectMethodImpl('dispose'),
    // It's not really used in core-in-popup mode, so we always use iframe's eventEmitter
    eventEmitter: TrezorConnectIframe.eventEmitter,
});

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
