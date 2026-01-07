import { InitFullSettings } from '@trezor/connect/src/types/api/init';
import { CoreInSuiteDesktop } from '@trezor/connect-web/src/impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from '@trezor/connect-web/src/impl/core-in-suite-web';

import { ConnectSettingsWebextension } from './proxy';

const extendLifetime = () => {
    // Subscribing to runtime makes the Service Worker stay alive for 5 minutes instead of the default 30 seconds.
    // We could make it to be continuously alive but it is probably overkilling.
    // https://developer.chrome.com/blog/longer-esw-lifetimes
    // https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep-sw-alive
    // https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
    chrome.runtime.onMessage.addListener(() => false);
};

export class CoreInSuiteDesktopWebextension extends CoreInSuiteDesktop {
    public init(settings: InitFullSettings<ConnectSettingsWebextension>): Promise<void> {
        if (settings._extendWebextensionLifetime) {
            extendLifetime();
        }

        return super.init(settings);
    }
}

export class CoreInSuiteWebWebextension extends CoreInSuiteWeb {
    public init(settings: InitFullSettings<ConnectSettingsWebextension>): Promise<void> {
        if (settings._extendWebextensionLifetime) {
            extendLifetime();
        }

        return super.init(settings);
    }
}
