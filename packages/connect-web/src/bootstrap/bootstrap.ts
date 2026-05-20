import { BootstrapError } from './bootstrap-errors';

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

const HANDSHAKE_TIMEOUT = 5000;
const HANDSHAKE_REQ = 'channel-handshake-request';
const HANDSHAKE_ERR = 'channel-handshake-error';
const HANDSHAKE_CONF = 'channel-handshake-confirm';

const HEARTBEAT_INTERVAL = 2000;

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

const getWorkerUrl = () =>
    window.location.origin +
    `${process.env.ASSET_PREFIX || ''}/js/workers/connect-popup-shared-worker.js`.replace(
        /\/+/g,
        '/',
    );

// Required in iframes embedded in 3rd party pages. BroadcastChannel is partitioned there.
// ✅ Chrome 125+ / Opera 111+
// ❌ Firefox / Safari / many WebViews / some Chromium forks
const getUnpartitionedSharedWorker = async (): Promise<SharedWorker> => {
    let handle: { SharedWorker?: (url: string | URL) => SharedWorker } | null = null;
    try {
        // @ts-expect-error - requestStorageAccess params not yet lib.dom.d.ts
        handle = await document.requestStorageAccess({ SharedWorker: true });
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    if (!handle || typeof handle.SharedWorker !== 'function') {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    try {
        return handle.SharedWorker(getWorkerUrl());
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }
};

const getSharedWorker = () => {
    if (typeof SharedWorker === 'undefined') {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }

    try {
        return new SharedWorker(getWorkerUrl());
    } catch {
        throw BootstrapError.ENV_NOT_SUPPORTED;
    }
};

interface PopupChannel {
    port: MessagePort;
    close: () => void;
}

const connectToChannel = (worker: SharedWorker, channelName: string): PopupChannel => {
    // if (typeof SharedWorker === 'undefined') {
    //     throw BootstrapError.ENV_NOT_SUPPORTED;
    // }

    // const worker = new SharedWorker(getWorkerUrl(), { name: '@trezor/connect-popup' });
    worker.port.start();
    worker.port.postMessage({ type: 'channel-join', channelId: channelName });

    const heartbeatInterval = setInterval(() => {
        worker.port.postMessage({ type: 'heartbeat' });
    }, HEARTBEAT_INTERVAL);

    return {
        port: worker.port,
        close: () => {
            clearInterval(heartbeatInterval);
            worker.port.postMessage({ type: 'channel-leave' });
            worker.port.close();
        },
    };
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
    const currentUrl = new URL(window.location.href);
    const nextUrl = new URL(currentUrl.toString());
    nextUrl.pathname = nextUrl.pathname.replace(/\/bootstrap\.html$/, '/');

    if (errorCode) {
        nextUrl.search = '';
        nextUrl.searchParams.set('connect-popup-err', errorCode);
    } else {
        nextUrl.search = currentUrl.search;
    }

    // window.location.href = nextUrl.toString();
    const div = document.createElement('div');
    div.innerHTML = `<a href="${nextUrl.toString()}">Redirecting...</a>`;
    document.body.appendChild(div);
};

// @popup-only
// Step 2. Listen for handshake from the iframe.
const handleBootstrapHandshake = (port: MessagePort, timeout: number = 5000): Promise<void> =>
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
                port.removeEventListener('message', onHandshakeRequest);
                port.postMessage(getConfirmHandshake(event.data));
                resolve();
            }
        };

        port.addEventListener('message', onHandshakeRequest);

        const timer = setTimeout(() => {
            port.removeEventListener('message', onHandshakeRequest);
            reject(BootstrapError.HANDSHAKE_TIMEOUT);
        }, timeout);
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

    let channel: PopupChannel | undefined;
    try {
        const worker = getSharedWorker();
        channel = connectToChannel(worker, channelName);
        await handleBootstrapHandshake(channel.port);
        channel.close();

        redirectToSuite();
    } catch (error) {
        channel?.close();
        redirectToSuite(typeof error === 'string' ? error : BootstrapError.UNKNOWN);
    }
};

// @iframe-only
// Step 3. Forward messages between suite-web and 3rd party window.
const startForwarding = (port: MessagePort, owner: Window, ownerOrigin: string) => {
    logger.log(PEERS.HERE, 'start forwarding');

    const onPortMessage = (event: MessageEvent): void => {
        if (event.data?.type === 'peer-disconnected') {
            logger.log(PEERS.HERE, 'peer disconnected');
            owner.postMessage(
                {
                    type: 'popup-closed',
                    channel: { here: PEERS.POPUP, peer: PEERS.WEB },
                },
                ownerOrigin,
            );

            return;
        }

        const channel = event.data?.channel;
        if (!channel || channel.here !== PEERS.POPUP || channel.peer !== PEERS.WEB) {
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
        if (!channel || channel.here !== PEERS.WEB || channel.peer !== PEERS.POPUP) {
            return;
        }

        logger.log(PEERS.WEB, '→', PEERS.POPUP, event.data.type);
        // Pass through the origin of the owner window, so that it can be used for security checks in the popup.
        port.postMessage({ ...event.data, origin: event.origin });
    };

    // Messages from connect-popup (suite-web) addressed to connect-web (3rd party window).
    port.addEventListener('message', onPortMessage);

    // Messages from connect-web (3rd party window) addressed to connect-popup (suite-web).
    window.addEventListener('message', onOwnerMessage);

    // Return cleanup function to stop forwarding.
    return () => {
        logger.log(PEERS.HERE, 'stop forwarding');
        port.removeEventListener('message', onPortMessage);
        window.removeEventListener('message', onOwnerMessage);
    };
};

// @iframe-only
// Step 2. Handshake iframe -> popup using iterative retry. (handled by handleBootstrapHandshake)
const startBootstrapHandshake = (
    port: MessagePort,
    maxAttempts: number = 5,
): { abort: () => void; promise: Promise<void> } => {
    const abortController = new AbortController();

    const promise = new Promise<void>((resolve, reject) => {
        let attempt = 0;
        let timer: ReturnType<typeof setTimeout>;

        const tryOnce = () => {
            attempt++;

            logger.log(PEERS.HERE, 'handshake attempt', attempt, 'of', maxAttempts);

            const onHandshakeConfirm = (event: MessageEvent): void => {
                const channel = event.data?.channel;
                if (!channel) return;

                if (
                    event.data.type === HANDSHAKE_CONF &&
                    channel.here === PEERS.BOOTSTRAP &&
                    channel.peer === PEERS.HERE
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    cleanup();
                    resolve();
                }
            };

            const cleanup = () => {
                clearTimeout(timer);
                port.removeEventListener('message', onHandshakeConfirm);
            };

            abortController.signal.addEventListener('abort', () => {
                cleanup();
                reject(BootstrapError.HANDSHAKE_TIMEOUT);
            });

            port.addEventListener('message', onHandshakeConfirm);

            port.postMessage({
                type: HANDSHAKE_REQ,
                channel: { here: PEERS.HERE, peer: PEERS.BOOTSTRAP },
            });

            timer = setTimeout(() => {
                port.removeEventListener('message', onHandshakeConfirm);
                if (attempt < maxAttempts) {
                    tryOnce();
                } else {
                    reject(BootstrapError.HANDSHAKE_TIMEOUT);
                }
            }, HANDSHAKE_TIMEOUT);
        };

        tryOnce();
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

                let channel: PopupChannel;
                try {
                    const worker = await getUnpartitionedSharedWorker();
                    channel = connectToChannel(worker, channelName);
                } catch (error) {
                    sendHandshakeError(error, ownerOrigin);

                    return;
                }

                const bootstrapHandshake = startBootstrapHandshake(channel.port);
                try {
                    await bootstrapHandshake.promise;

                    // Restart forwarding messages between suite-web and 3rd party window (in case it was already started by a previous handshake attempt).
                    // This ensures that we are forwarding messages through the correct SharedWorker port.
                    stopForwarding?.();
                    stopForwarding = startForwarding(channel.port, window.parent, ownerOrigin);

                    window.parent.postMessage(getConfirmHandshake(event.data), ownerOrigin);
                } catch (error) {
                    logger.error(PEERS.BOOTSTRAP, error);

                    bootstrapHandshake.abort();
                    channel.close();

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
