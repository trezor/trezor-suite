import { factory } from '@trezor/connect/src/factory';
import { config } from '@trezor/connect/src/data/config';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import { CoreInModule } from '@trezor/connect/src/impl/core-in-module';
import type { ConnectSettingsPublic } from '@trezor/connect/src/types';
import type { ConnectFactoryDependencies } from '@trezor/connect/src/factory';
import { CoreRequestMessage, ERRORS, TRANSPORT } from '@trezor/connect/src/exports';

interface ConnectWebDynamicImplementation
    extends ConnectFactoryDependencies<ConnectSettingsPublic> {
    handleCoreMessage: (message: CoreRequestMessage) => void;
}

const impl = new TrezorConnectDynamic<
    'core-in-module',
    ConnectSettingsPublic,
    ConnectWebDynamicImplementation
>({
    implementations: [
        {
            type: 'core-in-module',
            impl: new CoreInModule(),
        },
    ],
    getInitTarget: () => 'core-in-module',
    handleErrorFallback: () => new Promise(resolve => resolve(false)),
});

const disableWebUSB = () => {
    if (!impl.lastSettings) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }

    impl.getTarget().handleCoreMessage({ type: TRANSPORT.DISABLE_WEBUSB });
};

const requestWebUSBDevice = async () => {
    await window.navigator.usb.requestDevice({ filters: config.webusb });

    impl.getTarget().handleCoreMessage({ type: TRANSPORT.REQUEST_DEVICE });
};

const TrezorConnect = factory(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        manifest: impl.manifest.bind(impl),
        requestLogin: impl.requestLogin.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {
        disableWebUSB: disableWebUSB.bind(impl),
        requestWebUSBDevice: requestWebUSBDevice.bind(impl),
    },
);

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
