// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import { ConnectSettingsWebextension, POPUP } from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import { ConnectDynamicSettings, TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
// Import as src not lib due to webpack issues with inlining content script later
import { ServiceWorkerWindowChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window';
import { CoreInSuiteDesktop } from '@trezor/connect-web/src/impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from '@trezor/connect-web/src/impl/core-in-suite-web';

const impl = new TrezorConnectDynamic<
    'core-in-suite-desktop' | 'core-in-suite-web',
    ConnectSettingsWebextension
>({
    implementations: [
        {
            type: 'core-in-suite-desktop',
            impl: new CoreInSuiteDesktop(),
        },
        {
            type: 'core-in-suite-web',
            impl: new CoreInSuiteWeb(),
        },
    ],
    getInitTarget: ({ coreMode }: ConnectSettingsWebextension) => {
        if (coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else {
            return 'core-in-suite-web';
        }
    },
    handleBeforeInit: ({ _extendWebextensionLifetime }: ConnectSettingsWebextension) => {
        if (_extendWebextensionLifetime) {
            // Subscribing to runtime makes the Service Worker stay alive for 5 minutes instead of the default 30 seconds.
            // We could make it to be continuously alive but it is probably overkilling.
            // https://developer.chrome.com/blog/longer-esw-lifetimes
            // https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep-sw-alive
            // https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
            chrome.runtime.onMessage.addListener(() => false);
        }
    },
    handleBeforeCall: async ({ coreMode }: ConnectSettingsWebextension = {}) => {
        // Always try if desktop is available again
        if (coreMode === 'suite-desktop' || coreMode === 'auto' || coreMode === undefined) {
            await impl.switchTarget('core-in-suite-desktop');
        }
    },
    handleErrorFallback: async errorCode => {
        // Handle desktop errors
        if (
            impl.getTargetType() === 'core-in-suite-desktop' &&
            errorCode === 'Desktop_ConnectionMissing'
        ) {
            await impl.switchTarget('core-in-suite-web');

            return true;
        }

        return false;
    },
});

// Bind all methods due to shadowing `this`
const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    setTransports: impl.setTransports.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

const initProxyChannel = () => {
    const channel = new ServiceWorkerWindowChannel<{
        type: string;
        method: keyof typeof TrezorConnect;
        settings: ConnectDynamicSettings & ConnectSettingsWebextension;
    }>({
        name: 'trezor-connect-proxy',
        channel: {
            here: '@trezor/connect-service-worker-proxy',
            peer: '@trezor/connect-foreground-proxy',
        },
        lazyHandshake: true,
        allowSelfOrigin: true,
    });

    let proxySettings: ConnectDynamicSettings & ConnectSettingsWebextension;

    channel.init();
    channel.on('message', message => {
        const { id, payload, type } = message;
        if (!payload) return;
        const { method, settings } = payload;

        if (type === POPUP.INIT) {
            proxySettings = settings;

            return;
        }

        // Core is loaded in popup and initialized every time, so we send the settings from here.
        impl.init({ env: 'webextension', ...proxySettings }).then(() => {
            (TrezorConnect as any)[method](payload).then((response: any) => {
                channel.postMessage({
                    ...response,
                    id,
                });
            });
        });
    });
};

initProxyChannel();

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/src/exports';
