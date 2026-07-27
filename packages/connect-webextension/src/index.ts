import {
    CORE_CALL_CANCEL,
    type ConnectDynamicSettings,
    POPUP,
    ServiceWorkerWindowChannel,
    TrezorConnectDynamic,
    type TrezorConnectPublicAPI,
    factoryPublic,
} from '@trezor/connect-common';
import { CoreInSuiteDesktop, CoreInSuiteWeb } from '@trezor/connect-web';

const impl = new TrezorConnectDynamic({
    implementations: {
        'core-in-suite-desktop': new CoreInSuiteDesktop(),
        'core-in-suite-web': new CoreInSuiteWeb(),
    },
});

// Bind all methods due to shadowing `this`
const TrezorConnect: TrezorConnectPublicAPI<ConnectDynamicSettings> = factoryPublic(impl);

const initProxyChannel = () => {
    const channel = new ServiceWorkerWindowChannel<{
        type: string;
        method: keyof typeof TrezorConnect;
        settings: ConnectDynamicSettings;
        reason?: string;
        // We need `error` field for backward compatibility, for connect10 with older clients.
        error?: string;
        callId?: string;
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

        // Handle cancel before the payload guard — cancel messages may
        // carry no meaningful payload.
        if (type === POPUP.CLOSED) {
            TrezorConnect.cancel({ reason: payload?.error, callId: payload?.callId });

            return;
        }
        if (type === CORE_CALL_CANCEL) {
            TrezorConnect.cancel({ reason: payload?.reason, callId: payload?.callId });

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
export * from '@trezor/connect-common';
