// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    ConnectSettings,
    ConnectSettingsPublic,
    ConnectSettingsWebextension,
    Manifest,
    POPUP,
} from '@trezor/connect/src/exports';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
// Import as src not lib due to webpack issues with inlining content script later
import { ServiceWorkerWindowChannel } from '@trezor/connect-web/src/channels/serviceworker-window';

import { parseConnectSettings } from './connectSettings';
import { CoreInPopupWebextension, CoreInSuiteDesktopWebextension } from './impl';

const _settings = parseConnectSettings();

const impl = new TrezorConnectDynamic<
    'core-in-popup' | 'core-in-suite-desktop',
    ConnectSettingsWebextension,
    ConnectFactoryDependencies<ConnectSettingsWebextension>
>({
    implementations: [
        {
            type: 'core-in-popup',
            impl: new CoreInPopupWebextension(),
        },
        {
            type: 'core-in-suite-desktop',
            impl: new CoreInSuiteDesktopWebextension(),
        },
    ],
    getInitTarget: (settings: Partial<ConnectSettingsPublic & ConnectSettingsWebextension>) => {
        if (settings.coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else {
            return 'core-in-popup';
        }
    },
    handleBeforeCall: async () => {
        // Always try if desktop is available again
        const isCoreModeDesktop = impl.lastSettings?.coreMode === 'suite-desktop';
        const isCoreModeAuto =
            impl.lastSettings?.coreMode === 'auto' || impl.lastSettings?.coreMode === undefined;
        if (isCoreModeDesktop || isCoreModeAuto) {
            await impl.switchTarget('core-in-suite-desktop');
        }
    },
    handleErrorFallback: async errorCode => {
        // Handle desktop errors
        if (
            impl.getTargetType() === 'core-in-suite-desktop' &&
            errorCode === 'Desktop_ConnectionMissing'
        ) {
            await impl.switchTarget('core-in-popup');

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
    manifest: impl.manifest.bind(impl),
    requestLogin: impl.requestLogin.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
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
        TrezorConnect.init(
            proxySettings as { manifest: Manifest } & Partial<
                ConnectSettingsPublic & ConnectSettingsWebextension
            >,
        ).then(() => {
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
