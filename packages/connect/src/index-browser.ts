import { config } from './data/config';
import { TRANSPORT } from './events';
import { factory } from './factory';
import { CoreInModule } from './impl/core-in-module';

const impl = new CoreInModule();

const disableWebUSB = () => {
    impl.handleCoreMessage({ type: TRANSPORT.DISABLE_WEBUSB });
};

const requestWebUSBDevice = async () => {
    try {
        await window.navigator.usb.requestDevice({ filters: config.webusb });
        impl.handleCoreMessage({ type: TRANSPORT.REQUEST_DEVICE });
    } catch {
        // empty
    }
};

// Exported to enable using directly
const TrezorConnect = factory(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        updateConnectSettings: impl.updateConnectSettings.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {
        disableWebUSB,
        requestWebUSBDevice,
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
