import { ERRORS } from './constants';
import { config } from './data/config';
import { TRANSPORT } from './events';
import { CoreRequestMessage } from './events/core';
import { type ConnectFactoryDependencies, factory } from './factory';
import { CoreInModule } from './impl/core-in-module';
import { TrezorConnectDynamic } from './impl/dynamic';
import { type ConnectSettingsPublic } from './types';

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
    handleBeforeCall: () => new Promise(resolve => resolve()),
    handleErrorFallback: () => new Promise(resolve => resolve(false)),
});

const disableWebUSB = () => {
    if (!impl.lastSettings) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }

    impl.getTarget().handleCoreMessage({ type: TRANSPORT.DISABLE_WEBUSB });
};

const requestWebUSBDevice = async () => {
    try {
        await window.navigator.usb.requestDevice({ filters: config.webusb });
        impl.getTarget().handleCoreMessage({ type: TRANSPORT.REQUEST_DEVICE });
    } catch {
        // empty
    }
};

const TrezorConnect = factory(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        setTransports: impl.setTransports.bind(impl),
        manifest: impl.manifest.bind(impl),
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

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        impl.dispose();
    });
}
