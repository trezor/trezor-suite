// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import { POPUP } from '@trezor/connect/src/exports';
import { factory } from '@trezor/connect/src/factory';
import { ConnectDynamicSettings, TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
// Import as src not lib due to webpack issues with inlining content script later
import { ServiceWorkerWindowChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window';
import { CoreInSuiteDesktop } from '@trezor/connect-web/src/impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from '@trezor/connect-web/src/impl/core-in-suite-web';

const impl = new TrezorConnectDynamic<'core-in-suite-desktop' | 'core-in-suite-web'>({
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
    getInitTarget: (coreMode: ConnectDynamicSettings['coreMode']) => {
        if (coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else {
            return 'core-in-suite-web';
        }
    },
    handleBeforeCall: async (coreMode: ConnectDynamicSettings['coreMode']) => {
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
        settings: ConnectDynamicSettings;
    }>({
        name: 'trezor-connect-proxy',
        channel: {
            here: '@trezor/connect-service-worker-proxy',
            peer: '@trezor/connect-foreground-proxy',
        },
        lazyHandshake: true,
        allowSelfOrigin: true,
    });

    let proxySettings: ConnectDynamicSettings;

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
