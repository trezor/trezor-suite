import { InitFullSettings } from '@trezor/connect/src/types/api/init';
import { initLog } from '@trezor/connect/src/utils/debug';
import { CoreInPopup } from '@trezor/connect-web/src/impl/core-in-popup';
import { CoreInSuiteDesktop } from '@trezor/connect-web/src/impl/core-in-suite-desktop';

import { parseConnectSettings } from './connectSettings';
import { ConnectSettingsWebextension } from './proxy';

const extendLifetime = () => {
    // Subscribing to runtime makes the Service Worker stay alive for 5 minutes instead of the default 30 seconds.
    // We could make it to be continuously alive but it is probably overkilling.
    // https://developer.chrome.com/blog/longer-esw-lifetimes
    // https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep-sw-alive
    // https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
    chrome.runtime.onMessage.addListener(() => false);
};

export class CoreInPopupWebextension extends CoreInPopup {
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

export class CoreInSuiteDesktopWebextension extends CoreInSuiteDesktop {
    public init(settings: InitFullSettings<ConnectSettingsWebextension>): Promise<void> {
        if (settings._extendWebextensionLifetime) {
            extendLifetime();
        }

        return super.init(settings);
    }
}
