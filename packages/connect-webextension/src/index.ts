// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    POPUP,
    ConnectSettings,
    Manifest,
    ConnectSettingsWebextension,
} from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import { initLog } from '@trezor/connect/src/utils/debug';
// Import as src not lib due to webpack issues with inlining content script later
import { ServiceWorkerWindowChannel } from '@trezor/connect-web/src/channels/serviceworker-window';
import { CoreInPopup } from '@trezor/connect-web/src/impl/core-in-popup';
import { InitFullSettings } from '@trezor/connect/src/types/api/init';

import { parseConnectSettings } from './connectSettings';

const _settings = parseConnectSettings();

const extendLifetime = () => {
    // Subscribing to runtime makes the Service Worker stay alive for 5 minutes instead of the default 30 seconds.
    // We could make it to be continuously alive but it is probably overkilling.
    // https://developer.chrome.com/blog/longer-esw-lifetimes
    // https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep-sw-alive
    // https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
    chrome.runtime.onMessage.addListener(() => {
        return false;
    });
};

class CoreInPopupWebextension extends CoreInPopup {
    public constructor() {
        super();
        this._settings = parseConnectSettings();

        /**
         * setup logger.
         * service worker cant communicate directly with sharedworker logger so the communication is as follows:
         * - service worker -> content script -> popup -> sharedworker
         * todo: this could be simplified by injecting additional content script into log.html
         */
        this.logger = initLog('@trezor/connect-webextension');
        this.popupManagerLogger = initLog('@trezor/connect-webextension/popupManager');
    }

    public init(settings: InitFullSettings<ConnectSettingsWebextension>): Promise<void> {
        if (settings._extendWebextensionLifetime) {
            extendLifetime();
        }

        return super.init(settings);
    }
}

const methods = new CoreInPopupWebextension();
// Bind all methods due to shadowing `this`
const TrezorConnect = factory({
    eventEmitter: methods.eventEmitter,
    init: methods.init.bind(methods),
    call: methods.call.bind(methods),
    manifest: methods.manifest.bind(methods),
    requestLogin: methods.requestLogin.bind(methods),
    uiResponse: methods.uiResponse.bind(methods),
    cancel: methods.cancel.bind(methods),
    dispose: methods.dispose.bind(methods),
});

const initProxyChannel = () => {
    const channel = new ServiceWorkerWindowChannel<{
        type: string;
        method: keyof typeof TrezorConnect;
        settings: { manifest: Manifest } & Partial<ConnectSettings>;
    }>({
        name: 'trezor-connect-proxy',
        channel: {
            here: '@trezor/connect-service-worker-proxy',
            peer: '@trezor/connect-foreground-proxy',
        },
        lazyHandshake: true,
        allowSelfOrigin: true,
    });

    let proxySettings: ConnectSettings = parseConnectSettings();

    channel.init();
    channel.on('message', message => {
        const { id, payload, type } = message;
        if (!payload) return;
        const { method, settings } = payload;

        if (type === POPUP.INIT) {
            proxySettings = parseConnectSettings({ ..._settings, ...settings });

            return;
        }

        // Core is loaded in popup and initialized every time, so we send the settings from here.
        TrezorConnect.init(proxySettings as { manifest: Manifest } & Partial<ConnectSettings>).then(
            () => {
                (TrezorConnect as any)[method](payload).then((response: any) => {
                    channel.postMessage({
                        ...response,
                        id,
                    });
                });
            },
        );
    });
};

initProxyChannel();

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
