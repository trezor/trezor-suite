/* eslint-disable no-console */

interface MessageTarget {
    postMessage(message: any, targetOrigin?: string): void;
    addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
    removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

const logger = (() => {
    let enabled = false;

    return {
        enable: () => {
            enabled = true;
        },
        log: (...args: any[]) => {
            if (enabled) console.log(...args);
        },
        error: (...args: any[]) => {
            console.error(...args);
        },
    };
})();

// Required in iframes embedded in third-party pages — BroadcastChannel is partitioned there.
// ✅ Chrome 125+ / Opera 111+
// ❌ Firefox / Safari / many WebViews / some Chromium forks
const getUnpartitionedBroadcastChannel = async (channelName: string): Promise<BroadcastChannel> => {
    let handle: any;
    try {
        // @ts-expect-error
        handle = await document.requestStorageAccess({ BroadcastChannel: true });
    } catch (error) {
        throw new Error('Storage access denied: ' + error);
    }

    if (!handle || typeof handle.BroadcastChannel !== 'function') {
        throw new Error('Unpartitioned BroadcastChannel not supported');
    }

    try {
        return handle.BroadcastChannel(channelName) as BroadcastChannel;
    } catch (e) {
        throw new Error('Unpartitioned BroadcastChannel error: ' + e);
    }
};

const getParams = () => {
    if (typeof URLSearchParams === 'undefined') {
        throw new Error('URLSearchParams is not supported in this browser');
    }

    try {
        return new URLSearchParams(window.location.href.split('?')[1]);
    } catch (e) {
        throw new Error('Failed to parse URL params: ' + e);
    }
};

const appendStatus = (message: string): void => {
    const msg = document.createElement('h3');
    msg.textContent = message;
    document.body.appendChild(msg);
};

const redirectIfNeeded = (): void => {
    const url = window.location.href.replace(/\/iframe\.html/, '/');
    appendStatus('Redirecting to ' + url + ' in 3 seconds...');
    setTimeout(() => {
        window.location.href = url; // TODO: should be redirected by window.opener request
    }, 3000); // TODO: should be redirected immediately
};

const PEERS = {
    BOOTSTRAP: '@trezor/connect-bootstrap',
    WEB: '@trezor/connect-web',
    POPUP: '@trezor/connect-popup',
};

const channelData = {
    channel: {
        here: PEERS.BOOTSTRAP,
        peer: PEERS.BOOTSTRAP,
    },
    data: { success: true },
};

const HANDSHAKE_TIMEOUT = 500; // ms per attempt
const HANDSHAKE_RETRIES = 10;

// Origins are learned from event.origin during handshake — avoids cross-origin location.origin access.
const windowOrigins = new Map<Window, string>();

const updateWindowOrigin = (win: Window, origin: string): void => {
    if (origin && origin !== 'null') {
        windowOrigins.set(win, origin);
    }
};

const getWindowOrigin = (win: Window): string => windowOrigins.get(win) ?? '*';
const sendMessageToOwner = (owner: Window, message: any): void => {
    logger.log('Sending message to owner:', message);
    owner.postMessage(message, getWindowOrigin(owner));
};

const _sendError = (owner: Window, message: string): void => {
    logger.error('Iframe error:', message);
    sendMessageToOwner(owner, { type: 'IFRAME_BOOTSTRAP_ERROR', error: message });
};

const sendHandshakeConfirm = (eventData: any, target: MessageTarget): boolean => {
    if (
        eventData.type === 'channel-handshake-request' &&
        eventData.channel.peer === PEERS.BOOTSTRAP
    ) {
        logger.log('sendHandshakeConfirm:', typeof target, eventData.channel.here);
        const origin =
            target instanceof BroadcastChannel
                ? undefined
                : getWindowOrigin(target as unknown as Window);

        target.postMessage(
            {
                type: 'channel-handshake-confirm',
                channel: {
                    here: PEERS.BOOTSTRAP,
                    peer: eventData.channel.here,
                },
                data: channelData.data,
            },
            origin,
        );

        return true;
    }

    return false;
};

// Uses new Promise — cannot use async/await (setTimeout + addEventListener)
const attemptHandshake = (
    target: MessageTarget,
    listener: MessageTarget,
    attemptsLeft: number,
): Promise<void> => {
    const peer = target !== listener ? PEERS.WEB : PEERS.BOOTSTRAP;

    return new Promise((resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let timer: ReturnType<typeof setTimeout>;

        logger.log('Attempting handshake:', peer, 'attempts left:', attemptsLeft);

        const onHandshakeReply = (event: MessageEvent): void => {
            logger.log('Received handshake reply:', event.data);
            if (!event.data) return;

            if (sendHandshakeConfirm(event.data, target)) return;

            if (
                event.data.type === 'channel-handshake-confirm' &&
                event.data.channel.here === peer &&
                event.data.channel.peer === PEERS.BOOTSTRAP
            ) {
                if (!(target instanceof BroadcastChannel)) {
                    updateWindowOrigin(target as unknown as Window, event.origin);
                }
                appendStatus('Handshake successful with ' + peer);
                clearTimeout(timer);
                listener.removeEventListener('message', onHandshakeReply);
                resolve();
            }
        };

        listener.addEventListener('message', onHandshakeReply);

        const origin =
            target instanceof BroadcastChannel
                ? undefined
                : getWindowOrigin(target as unknown as Window);
        target.postMessage(
            {
                type: 'channel-handshake-request',
                channel: { here: PEERS.BOOTSTRAP, peer },
                data: channelData.data,
            },
            origin,
        );

        timer = setTimeout(() => {
            listener.removeEventListener('message', onHandshakeReply);
            if (attemptsLeft > 1) {
                resolve(attemptHandshake(target, listener, attemptsLeft - 1));
            } else {
                reject(new Error('Handshake timeout after ' + HANDSHAKE_RETRIES + ' attempts'));
            }
        }, HANDSHAKE_TIMEOUT);
    });
};

// Iframe mode only — bridges messages between BroadcastChannel and the parent frame
const startForwarding = (broadcast: BroadcastChannel, owner: Window): void => {
    logger.log('startForwarding');

    // messages from connect-popup (suite-web) addressed to connect-web (3rd party host)
    broadcast.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type === 'channel-handshake-request') {
            sendHandshakeConfirm(event.data, event.currentTarget as unknown as MessageTarget);

            return;
        }
        if (event.data.channel?.here !== PEERS.POPUP || event.data.channel?.peer !== PEERS.WEB) {
            return;
        }

        logger.log('Iframe forward to host', event.data);
        sendMessageToOwner(owner, event.data);
    });

    // messages from connect-web (3rd party host) addressed to connect-popup (suite-web)
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.data.channel?.here !== PEERS.WEB || event.data.channel?.peer !== PEERS.POPUP) {
            return;
        }

        logger.log('Iframe forward to suite-web', event.data);
        try {
            broadcast.postMessage(event.data);
        } catch (e) {
            logger.error('BroadcastChannel postMessage failed:', e);
        }
    });
};

const bootstrap = async (): Promise<void> => {
    const urlParams = getParams();
    const channelId = urlParams.get('connect-popup-req'); // TODO rename
    const channelName = '@trezor/connect-popup/' + channelId;

    if (urlParams.get('debug')) logger.enable();
    logger.log('Iframe initialized with id:', channelId, channelName);

    // ── Popup mode ────────────────────────────────────────────────────────────
    // Opened via window.open(). BroadcastChannel is unpartitioned (top-level context).
    // Owner is window.opener (the page that opened the popup).
    //
    // ── Iframe mode ───────────────────────────────────────────────────────────
    // Embedded in a third-party page. BroadcastChannel is partitioned, so we need
    // requestStorageAccess to get an unpartitioned instance.
    // Owner is window.parent (the embedding page).

    const isPopup = window.parent === window;

    let broadcast: BroadcastChannel;
    let owner: Window;

    if (isPopup) {
        if (typeof BroadcastChannel === 'undefined') {
            throw new Error('BroadcastChannel not supported');
        }
        broadcast = new BroadcastChannel(channelName);
        owner = window.opener && !window.opener.closed ? window.opener : window;
    } else {
        broadcast = await getUnpartitionedBroadcastChannel(channelName);
        owner = window.parent;
    }

    appendStatus('BroadcastChannel initialized, starting handshake...');
    logger.log('BroadcastChannel initialized. Starting handshake.');

    // Handshake 1: bootstrap ↔ popup (via BroadcastChannel)
    // Start forwarding / redirect immediately on success — don't wait for owner HS
    const bootstrapHandshakePromise = attemptHandshake(
        broadcast,
        broadcast,
        HANDSHAKE_RETRIES,
    ).then(() => {
        logger.log('Bootstrap handshake OK');
        if (isPopup) {
            redirectIfNeeded();
        } else {
            startForwarding(broadcast, owner);
        }
    });

    // Handshake 2: bootstrap ↔ owner (via window messaging)
    // Popup: owner is window.opener | Iframe: owner is window.parent
    const ownerForHandshake: Window | null = isPopup ? window.opener : window.parent;
    const ownerHandshakePromise = ownerForHandshake
        ? attemptHandshake(ownerForHandshake, window, HANDSHAKE_RETRIES).then(() =>
              logger.log('Owner handshake OK'),
          )
        : Promise.resolve();

    // After both handshakes settle, report combined status
    Promise.allSettled([bootstrapHandshakePromise, ownerHandshakePromise]).then(
        ([bootstrapResult, ownerResult]) => {
            const bootstrapOk = bootstrapResult.status === 'fulfilled';
            const ownerOk = ownerResult.status === 'fulfilled';

            if (!bootstrapOk) {
                logger.error('Bootstrap handshake failed:', bootstrapResult.reason);
                appendStatus('Handshake with bootstrap failed');
            }
            if (!ownerOk) {
                logger.error('Owner handshake failed:', ownerResult.reason);
                appendStatus('Handshake with owner failed');
            }

            if (bootstrapOk && ownerOk) {
                sendMessageToOwner(owner, { type: 'connect-popup-bootstrap-ok' });
            } else if (!bootstrapOk && ownerOk) {
                sendMessageToOwner(owner, { type: 'connect-popup-bootstrap-failed' });
            } else if (bootstrapOk && !ownerOk) {
                broadcast.postMessage({ type: 'bootstrap-failed' });
            }
        },
    );
};

bootstrap().catch(err => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Bootstrap failed:', err);
    window.parent.postMessage({ type: 'IFRAME_BOOTSTRAP_ERROR', error: message }, '*');
});
