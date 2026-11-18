import { BootstrapError, getPopupErrorURL } from './bootstrap-errors';

const logger = (() => {
    let enabled = false;

    return {
        enable: () => {
            enabled = true;
        },
        log: (...args: any[]) => {
            // eslint-disable-next-line no-console
            if (enabled) console.log(...args);
        },
        error: (...args: any[]) => {
            console.error(...args);
        },
    };
})();

const IFRAME_MODE = window.parent !== window;

const BOOTSTRAP_IFRAME = '@trezor/connect-bootstrap-iframe';
const BOOTSTRAP_POPUP = '@trezor/connect-bootstrap-popup';
const PEERS = {
    HERE: IFRAME_MODE ? BOOTSTRAP_IFRAME : BOOTSTRAP_POPUP,
    BOOTSTRAP: IFRAME_MODE ? BOOTSTRAP_POPUP : BOOTSTRAP_IFRAME,
    WEB: '@trezor/connect-web',
    POPUP: '@trezor/connect-popup',
};

const HANDSHAKE_RETRY_INTERVAL = 500;
// The popup may still be loading on a slow network, but connect-web gives up on the iframe
// after 5 × 2000 ms, and it should receive this error rather than its own generic one.
const IFRAME_HANDSHAKE_TIMEOUT = 8000;
const HANDSHAKE_REQ = 'channel-handshake-request';
const HANDSHAKE_ERR = 'channel-handshake-error';
const HANDSHAKE_CONF = 'channel-handshake-confirm';
const HANDSHAKE_READY = 'channel-handshake-ready';

const getParams = () => {
    if (typeof URLSearchParams === 'undefined') {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    try {
        const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
        const debug = urlParams.get('debug');
        if (debug === '1' || debug === 'true') logger.enable();

        const channelId = urlParams.get('connect-popup-req');
        const channelName = channelId ? '@trezor/connect-popup/' + channelId : null;

        return {
            channelId,
            channelName,
            debug,
        };
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }
};

// Required in iframes embedded in 3rd party pages. BroadcastChannel is partitioned there.
// ✅ Chrome 125+ / Opera 111+
// ❌ Firefox / Safari / many WebViews / some Chromium forks
const getUnpartitionedBroadcastChannel = async (channelName: string): Promise<BroadcastChannel> => {
    let handle: { BroadcastChannel?: (name: string) => BroadcastChannel } | null;
    try {
        // @ts-expect-error - requestStorageAccess params not yet lib.dom.d.ts
        handle = await document.requestStorageAccess({ BroadcastChannel: true });
    } catch {
        throw BootstrapError.STORAGE_ACCESS_DENIED;
    }

    if (!handle || typeof handle.BroadcastChannel !== 'function') {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    try {
        return handle.BroadcastChannel(channelName);
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }
};

const getBroadcastChannel = (channelName: string) => {
    if (typeof BroadcastChannel === 'undefined') {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    try {
        return new BroadcastChannel(channelName);
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }
};

const getConfirmHandshake = (eventData: { channel: { here: string } }) => ({
    type: HANDSHAKE_CONF,
    channel: {
        here: PEERS.HERE,
        peer: eventData.channel.here,
    },
});

// @popup-only
const redirectToSuite = (errorCode?: string): void => {
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = nextUrl.pathname.replace(/\/bootstrap\.html$/, '/');

    window.location.href = errorCode
        ? getPopupErrorURL(nextUrl.toString(), errorCode)
        : nextUrl.toString();
};

// @popup-only
// Step 2. Listen for handshake from the iframe.
const handleBootstrapHandshake = (
    broadcast: BroadcastChannel,
    timeout: number = 5000,
): Promise<void> =>
    new Promise((resolve, reject) => {
        const onHandshakeRequest = (event: MessageEvent): void => {
            const channel = event.data?.channel;
            if (!channel) return;

            if (
                event.data.type === HANDSHAKE_REQ &&
                channel.here === PEERS.BOOTSTRAP &&
                channel.peer === PEERS.HERE
            ) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                clearTimeout(timer);
                broadcast.removeEventListener('message', onHandshakeRequest);
                broadcast.postMessage(getConfirmHandshake(event.data));
                resolve();
            }
        };

        broadcast.addEventListener('message', onHandshakeRequest);

        const timer = setTimeout(() => {
            broadcast.removeEventListener('message', onHandshakeRequest);
            reject(BootstrapError.HANDSHAKE_TIMEOUT);
        }, timeout);

        // BroadcastChannel does not buffer, so the iframe may have pinged before we listened.
        // Announcing ourselves makes it ping again right away. It is not a handshake request,
        // so that a Suite page still open on this channel ignores it.
        broadcast.postMessage({
            type: HANDSHAKE_READY,
            channel: { here: PEERS.HERE, peer: PEERS.BOOTSTRAP },
        });
    });

// @popup-only
// Step 1. Main bootstrap function in popup mode.
const bootstrapPopup = async (): Promise<void> => {
    let channelName;
    try {
        const params = getParams();
        channelName = params.channelName;
    } catch (error) {
        redirectToSuite(error);

        return;
    }

    logger.log(PEERS.HERE, channelName);

    if (!channelName) {
        redirectToSuite(BootstrapError.CHANNEL_ID_MISSING);

        return;
    }

    // Handle messages from 3rd party window until handshake is done.
    // This works only on limited setups: same origin or localhost.
    // Triggered by ../web.ts handshake (if iframe fails early then redirect early).
    window.addEventListener('message', event => {
        if (event.data?.type === HANDSHAKE_ERR) {
            redirectToSuite(event.data.error);
        }
    });

    try {
        const broadcast = getBroadcastChannel(channelName);
        await handleBootstrapHandshake(broadcast);
        broadcast.close();

        redirectToSuite();
    } catch (error) {
        redirectToSuite(typeof error === 'string' ? error : BootstrapError.UNKNOWN);
    }
};

// @iframe-only
// Step 3. Forward messages between suite-web and 3rd party window.
const startForwarding = (broadcast: BroadcastChannel, owner: Window, ownerOrigin: string) => {
    logger.log(PEERS.HERE, 'start forwarding');

    const onBroadcastMessage = (event: MessageEvent): void => {
        const channel = event.data?.channel;
        if (channel?.here !== PEERS.POPUP || channel.peer !== PEERS.WEB) {
            return;
        }

        logger.log(PEERS.POPUP, '→', PEERS.WEB, event.data.type);
        owner.postMessage(event.data, ownerOrigin);
    };

    const onOwnerMessage = (event: MessageEvent): void => {
        // Only accept messages from the verified owner origin.
        if (event.origin !== ownerOrigin) {
            return;
        }

        const channel = event.data?.channel;
        if (channel?.here !== PEERS.WEB || channel.peer !== PEERS.POPUP) {
            return;
        }

        logger.log(PEERS.WEB, '→', PEERS.POPUP, event.data.type);
        // Pass through the origin of the owner window, so that it can be used for security checks in the popup.
        broadcast.postMessage({ ...event.data, origin: event.origin });
    };

    // Messages from connect-popup (suite-web) addressed to connect-web (3rd party window).
    broadcast.addEventListener('message', onBroadcastMessage);

    // Messages from connect-web (3rd party window) addressed to connect-popup (suite-web).
    window.addEventListener('message', onOwnerMessage);

    // Return cleanup function to stop forwarding.
    return () => {
        logger.log(PEERS.HERE, 'stop forwarding');
        broadcast.removeEventListener('message', onBroadcastMessage);
        window.removeEventListener('message', onOwnerMessage);
    };
};

// @iframe-only
// Step 2. Handshake iframe -> popup, retried until the popup confirms. (handled by handleBootstrapHandshake)
const startBootstrapHandshake = (
    broadcast: BroadcastChannel,
    timeout: number = IFRAME_HANDSHAKE_TIMEOUT,
): { abort: () => void; promise: Promise<void> } => {
    const abortController = new AbortController();

    const { signal } = abortController;

    const promise = new Promise<void>((resolve, reject) => {
        let attempt = 0;

        const sendHandshakeRequest = () => {
            attempt++;
            logger.log(PEERS.HERE, 'handshake attempt', attempt);

            broadcast.postMessage({
                type: HANDSHAKE_REQ,
                channel: { here: PEERS.HERE, peer: PEERS.BOOTSTRAP },
            });
        };

        // Time-based, because timer throttling in the background tab stretches every retry,
        // and the whole handshake must still end before connect-web gives up.
        const retryInterval = setInterval(sendHandshakeRequest, HANDSHAKE_RETRY_INTERVAL);
        const deadline = setTimeout(() => abortController.abort(), timeout);

        // Ends the handshake in every case; after a confirmation the rejection is a no-op.
        signal.addEventListener('abort', () => {
            clearInterval(retryInterval);
            clearTimeout(deadline);
            reject(BootstrapError.HANDSHAKE_TIMEOUT);
        });

        broadcast.addEventListener(
            'message',
            (event: MessageEvent): void => {
                const channel = event.data?.channel;
                if (channel?.here !== PEERS.BOOTSTRAP || channel.peer !== PEERS.HERE) return;

                if (event.data.type === HANDSHAKE_CONF) {
                    resolve();
                    abortController.abort();
                } else if (event.data.type === HANDSHAKE_READY) {
                    // The popup has just started listening.
                    sendHandshakeRequest();
                }
            },
            { signal },
        );

        sendHandshakeRequest();
    });

    return {
        abort: () => abortController.abort(),
        promise,
    };
};

// @iframe-only
// Step 1. Main bootstrap function in iframe mode.
const bootstrapIframe = (): Promise<void> => {
    let stopForwarding: (() => void) | undefined;
    let handshakeInProgress = false;

    const sendHandshakeError = (errorCode: unknown, ownerOrigin: string) => {
        handshakeInProgress = false;

        window.parent.postMessage(
            {
                type: HANDSHAKE_ERR,
                error: typeof errorCode === 'string' ? errorCode : BootstrapError.UNKNOWN,
            },
            ownerOrigin,
        );
    };

    return new Promise<void>(resolve => {
        // Handle 3rd party window -> iframe.
        window.addEventListener('message', async (event: MessageEvent) => {
            if (event.data.channel?.here !== PEERS.WEB || event.data.channel?.peer !== PEERS.HERE) {
                return;
            }

            if (event.data.type === HANDSHAKE_REQ) {
                if (handshakeInProgress) {
                    logger.log(PEERS.HERE, 'handshake already in progress');

                    return;
                }

                handshakeInProgress = true;

                const ownerOrigin = event.origin && event.origin !== 'null' ? event.origin : null;
                if (!ownerOrigin) {
                    // This is the only place where we don't know the origin, we need to use '*' to reach the parent window.
                    // origin "null" or empty could mean that the iframe is embedded in a non-secure context (e.g. file://) or sandboxed.
                    // We can't securely communicate with the parent window, so we treat it as an error.
                    sendHandshakeError(BootstrapError.ORIGIN_MISSING, '*');

                    return;
                }

                let channelName;
                try {
                    const params = getParams();
                    channelName = params.channelName;
                } catch (error) {
                    sendHandshakeError(error, ownerOrigin);

                    return;
                }

                logger.log(PEERS.HERE, channelName);

                if (!channelName) {
                    sendHandshakeError(BootstrapError.CHANNEL_ID_MISSING, ownerOrigin);

                    return;
                }

                let broadcast: BroadcastChannel;
                try {
                    broadcast = await getUnpartitionedBroadcastChannel(channelName);
                } catch (error) {
                    sendHandshakeError(error, ownerOrigin);

                    return;
                }

                // Once the popup leaves about:blank, COOP cuts it off from connect-web. connect-web
                // holds it back until now, so it can still show a storage access denial in it.
                window.parent.postMessage(
                    { type: HANDSHAKE_READY, channel: { here: PEERS.HERE, peer: PEERS.WEB } },
                    ownerOrigin,
                );

                const bootstrapHandshake = startBootstrapHandshake(broadcast);
                try {
                    await bootstrapHandshake.promise;

                    // Restart forwarding messages between suite-web and 3rd party window (in case it was already started by a previous handshake attempt).
                    // This ensures that we are forwarding messages through the correct BroadcastChannel instance.
                    stopForwarding?.();
                    stopForwarding = startForwarding(broadcast, window.parent, ownerOrigin);

                    window.parent.postMessage(getConfirmHandshake(event.data), ownerOrigin);
                } catch (error) {
                    logger.error(PEERS.BOOTSTRAP, error);

                    bootstrapHandshake.abort();
                    broadcast.close();

                    sendHandshakeError(error, ownerOrigin);
                }

                handshakeInProgress = false;
                resolve();
            }
        });
    });
};

export const bootstrap = async (): Promise<void> => {
    if (IFRAME_MODE) {
        await bootstrapIframe();
    } else {
        await bootstrapPopup();
    }
};
