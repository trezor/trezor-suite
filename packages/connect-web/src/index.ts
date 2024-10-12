import { factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import { CoreInIframe } from './impl/core-in-iframe';
import { CoreInPopup } from './impl/core-in-popup';
import { getEnv } from './connectSettings';

/**
 * Implementation of TrezorConnect that can dynamically switch between iframe and core-in-popup implementations
 */

const impl = new TrezorConnectDynamic({
    implementations: [
        {
            type: 'iframe',
            impl: new CoreInIframe(),
        },
        {
            type: 'core-in-popup',
            impl: new CoreInPopup(),
        },
    ],
    getEnv,
});

const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    manifest: impl.manifest.bind(impl),
    requestLogin: impl.requestLogin.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    renderWebUSBButton: impl.renderWebUSBButton.bind(impl),
    disableWebUSB: impl.disableWebUSB.bind(impl),
    requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
