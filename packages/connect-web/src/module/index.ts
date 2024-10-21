import { factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import { CoreInModule } from '../impl/core-in-module';

const impl = new TrezorConnectDynamic<'core-in-module'>({
    implementations: [
        {
            type: 'core-in-module',
            impl: new CoreInModule(),
        },
    ],
    getInitTarget: () => 'core-in-module',
    handleErrorFallback: async () => false,
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
