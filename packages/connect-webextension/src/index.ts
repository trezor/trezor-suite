// note: at the moment, there is something in the root of @trezor/connect-common that pulls entire PROTO runtime, thus
// these targeted imports
import { POPUP } from '@trezor/connect-common/src/events';
import { factory } from '@trezor/connect-common/src/factory';
import { type ConnectDynamicSettings } from '@trezor/connect-common/src/impl/dynamic';
import { TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';
// Import as src not lib due to webpack issues with inlining content script later
import { ServiceWorkerWindowChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- intra-tier wiring: connect-webextension composes implementations from connect-web (see #27376)
import { CoreInSuiteDesktop } from '@trezor/connect-web/src/impl/core-in-suite-desktop';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- intra-tier wiring: connect-webextension composes implementations from connect-web (see #27376)
import { CoreInSuiteWeb } from '@trezor/connect-web/src/impl/core-in-suite-web';

const impl = new TrezorConnectDynamic({
    implementations: {
        'core-in-suite-desktop': new CoreInSuiteDesktop(),
        'core-in-suite-web': new CoreInSuiteWeb(),
    },
});

// Bind all methods due to shadowing `this`
const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    updateConnectSettings: impl.updateConnectSettings.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

const initProxyChannel = () => {
    const channel = new ServiceWorkerWindowChannel<{
        type: string;
        method: keyof typeof TrezorConnect;
        settings: ConnectDynamicSettings;
        error?: string;
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

        // Handle cancel/close before the payload guard — cancel messages
        // may carry no meaningful payload.
        if (type === POPUP.CLOSED) {
            TrezorConnect.cancel(payload?.error);

            return;
        }

        if (!payload) return;
        const { method, settings } = payload;

        if (type === POPUP.INIT) {
            proxySettings = settings;

            return;
        }

        // Core is loaded in popup and initialized every time, so we send the settings from here.
        impl.init({ env: 'webextension', ...proxySettings })
            .then(() =>
                (TrezorConnect as any)[method](payload).then((response: any) => {
                    // Response must use usePromise: false so the original
                    // message `id` from the proxy is preserved.  The default
                    // (usePromise: true) would overwrite `id` with the SW's
                    // own counter, which can desynchronize from the proxy's
                    // counter and leave the proxy's call() promise unresolved.
                    channel.postMessage(
                        {
                            ...response,
                            id,
                        },
                        { usePromise: false },
                    );
                }),
            )
            .catch((error: any) => {
                channel.postMessage(
                    {
                        success: false,
                        payload: { error: error?.message ?? String(error) },
                        id,
                    },
                    { usePromise: false },
                );
            });
    });
};

initProxyChannel();

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export type * from '@trezor/connect-common/src/types';
