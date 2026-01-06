import { ERRORS } from './constants';
import { config } from './data/config';
import { CallMethodPayload, TRANSPORT, createErrorMessage } from './events';
import { factory } from './factory';
import { CoreInModule } from './impl/core-in-module';
import type { ConnectSettingsPublic, Manifest } from './types';
import { type InitFullSettings } from './types/api/init';
import { SetTransports } from './types/api/setTransports';

let lastSettings: InitFullSettings<ConnectSettingsPublic> | undefined;
const impl = new CoreInModule();

const manifest = (m: Manifest) => {
    lastSettings = { ...lastSettings, m } as typeof lastSettings;

    impl.manifest(m);
};

const dispose = () => {
    impl.eventEmitter.removeAllListeners();

    return impl.dispose();
};

const init = async (settings: InitFullSettings<ConnectSettingsPublic>) => {
    if (!settings?.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }
    // Save settings for later use
    lastSettings = settings;

    return await impl.init(lastSettings);
};

const call = async (params: CallMethodPayload) => {
    try {
        const response = await impl.call(params);

        return response;
    } catch (error) {
        // Don't throw but return error payload
        return createErrorMessage(error);
    }
};

const setTransports = ({ transports }: SetTransports) => {
    lastSettings = { ...lastSettings, transports } as typeof lastSettings;
    impl.setTransports({ transports });
};

const uiResponse = (params: any) => impl.uiResponse(params);

const cancel = (error?: string) => impl.cancel(error);

const disableWebUSB = () => {
    if (!lastSettings) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }

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

const TrezorConnect = factory(
    {
        eventEmitter: impl.eventEmitter,
        init,
        call,
        setTransports,
        manifest,
        uiResponse,
        cancel,
        dispose,
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
    window.addEventListener('beforeunload', dispose);
}
