import { config } from '@trezor/connect/src/data/config';
import { suggestBridgeInstaller } from '@trezor/connect/src/data/transportInfo';
import { suggestUdevInstaller } from '@trezor/connect/src/data/udevInfo';
import {
    CoreEventMessage,
    CoreRequestMessage,
    ERRORS,
    TRANSPORT,
    TRANSPORT_EVENT,
} from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import type { ConnectFactoryDependencies } from '@trezor/connect/src/factory';
import { CoreInModule } from '@trezor/connect/src/impl/core-in-module';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import type { ConnectSettingsPublic } from '@trezor/connect/src/types';
import { getInstallerPackage } from '@trezor/connect-common';
import { cloneObject } from '@trezor/utils';

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
            impl: new CoreInModule((message: CoreEventMessage) => {
                if (message.event === TRANSPORT_EVENT) {
                    // note: udev and bridge are part of the event already emitted from "core" but without "preferred" field set
                    const platform = getInstallerPackage();
                    message.payload.bridge = cloneObject(suggestBridgeInstaller(platform));
                    message.payload.udev = cloneObject(suggestUdevInstaller(platform));
                }

                return message;
            }),
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
        setTransports: impl.setTransports.bind(impl),
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

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        impl.dispose();
    });
}
