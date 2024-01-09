import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts
import {
    ERRORS,
    createErrorMessage,
    ConnectSettings,
    Manifest,
    UiResponseEvent,
    CallMethod,
} from '@trezor/connect/lib/exports';
import { factory } from '@trezor/connect/lib/factory';
import { createWorkerProxy } from '@trezor/worker-proxy';

import { parseConnectSettings } from '../connectSettings';

const eventEmitter = new EventEmitter();
let _settings = parseConnectSettings();

// TODO: type it
let _proxy: any;

const manifest = (data: Manifest) => {
    _settings = parseConnectSettings({
        ..._settings,
        manifest: data,
    });
};

const dispose = () => {
    eventEmitter.removeAllListeners();
    _settings = parseConnectSettings();

    if (_proxy) {
        _proxy.dispose();
    }
    return Promise.resolve(undefined);
};

const cancel = (error?: string) => {
    console.error(error);

    if (_proxy) {
        _proxy.cancel();
    }
};

const init = async (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    console.log('settings in init in proxy/index', settings);
    _settings = parseConnectSettings({ ..._settings, ...settings });

    if (!_proxy) {
        _proxy = await createWorkerProxy<typeof TrezorConnect>('TrezorConnect');
    }

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    if (!_settings.transports?.length) {
        _settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }

    return _proxy.init({ settings: _settings });
};

const call: CallMethod = async (params: any) => {
    try {
        const response = await _proxy[params.method](params);
        if (response) {
            return response;
        }
        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _proxy.clear();

        return createErrorMessage(error);
    }
};

const uiResponse = (response: UiResponseEvent) => {
    const { type, payload } = response;
    console.log('type', type);
    console.log('payload', payload);
    // TODO: ???
};

const renderWebUSBButton = () => {};

const requestLogin = () => {
    // todo: not supported yet
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const disableWebUSB = () => {
    // todo: not supported yet, probably not needed
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestWebUSBDevice = () => {
    // not needed - webusb pairing happens in popup
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    requestWebUSBDevice,
    cancel,
    dispose,
});

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
