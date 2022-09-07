import EventEmitter from 'events';

import { factory } from '@trezor/connect/lib/factory';
import {
    parseConnectSettings,
    CallMethod,
    Manifest,
    ConnectSettings,
    UiResponseEvent,
    ERRORS,
    UI_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    RESPONSE_EVENT,
} from '@trezor/connect/lib/exports';
import { createDeferred, Deferred } from '@trezor/utils';

const worker = new Worker('build/trezor-connect-webworker.js' + '?' + Math.random());

let _settings = parseConnectSettings();
const eventEmitter = new EventEmitter();

let id = 0;
let requestPromise: Deferred<any> | undefined = undefined;

const call: CallMethod = async params => {
    // const params = {
    //     meow_id: 10,
    //     type: 'iframe-call',
    //     payload: {
    //         method,
    //     },
    // };
    // event: undefined
    // id: 21
    // payload: {device: {…}, useCardanoDerivation: false, method: 'checkFirmwareAuthenticity'}
    // type: "iframe-call"

    id++;
    console.log('window-to-worker request id', id, params);

    requestPromise = createDeferred(id);

    worker.postMessage({
        type: 'iframe-call',
        id,
        payload: {
            ...params,
        },
    });

    return requestPromise.promise;
};

const init = async (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    // if (worker) {
    //     throw ERRORS.TypedError('Init_AlreadyInitialized');
    // }

    _settings = parseConnectSettings({ ..._settings, ...settings });

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    // if (_settings.lazyLoad) {
    //     // reset "lazyLoad" after first use
    //     _settings.lazyLoad = false;
    //     return;
    // }

    // if (!_popupManager) {
    //     _popupManager = initPopupManager();
    // }

    worker.addEventListener('message', event => {
        if (
            event?.data?.event &&
            [DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT].includes(event.data.event)
        ) {
            eventEmitter.emit(event.data.event, event.data.payload);
        }

        if (event?.data?.event === RESPONSE_EVENT) {
            console.log('window-to-worker response', event);
            requestPromise!.resolve(event.data);
        }
    });

    // await iframe.init(_settings);
};

const manifest = (data: Manifest) => {
    _settings = parseConnectSettings({
        ..._settings,
        manifest: data,
    });
};

// export const TrezorConnect = {
//     init() {
//         console.log('init');
//     },
//     getAddress: async () => {
//         return worker.call('getAddress');
//     },
//     getFeatures: async () => {
//         return worker.call('getFeatures');
//     },
// };

const uiResponse = (response: UiResponseEvent) => {
    if (!worker) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    const { type, payload } = response;
    self.postMessage({ event: UI_EVENT, type, payload });
};

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call,
    // @ts-expect-error
    requestLogin: () => {},
    uiResponse,
    renderWebUSBButton: () => {},
    disableWebUSB: () => {},
    cancel: () => {},
    dispose: () => {},
});

export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
