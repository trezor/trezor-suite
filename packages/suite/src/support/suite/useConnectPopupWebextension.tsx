import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WEBEXTENSION_SUITE_WEB_CHANNEL } from '@trezor/connect-common';

import {
    type ConnectPopupLink,
    type ConnectPopupMessage,
    type ConnectPopupOutgoingMessage,
    useConnectPopup,
} from './useConnectPopup';

/**
 * Minimal Chrome extension API types needed by this hook.
 * We intentionally don't add @types/chrome to the suite package since only
 * this file uses the Chrome API (when Suite Web is opened by a webextension).
 */
interface ChromeRuntime {
    sendMessage: (extensionId: string, message: Record<string, unknown>) => void;
}

declare const chrome: { runtime?: ChromeRuntime } | undefined;

const webextChannel = {
    here: WEBEXTENSION_SUITE_WEB_CHANNEL.suiteWeb,
    peer: WEBEXTENSION_SUITE_WEB_CHANNEL.webextension,
};

const postMessageToExtension = (message: ConnectPopupOutgoingMessage, extensionId: string) => {
    if (!message.channel) {
        message.channel = webextChannel;
    }

    if (!chrome?.runtime?.sendMessage) {
        return;
    }

    chrome.runtime.sendMessage(extensionId, message);
};

const getUrlHashParams = () => new URLSearchParams(window.location.hash.replace('#', '?'));

const clearUrlHash = () =>
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

export const useConnectPopupWebextension = () => {
    // Read once, so later hash writes cannot change which extension the popup answers.
    const [extensionId] = useState(() => getUrlHashParams().get('extension-id'));
    const lastProcessedMessageIdRef = useRef<number | undefined>(undefined);
    const [incomingMessages, setIncomingMessages] = useState<ConnectPopupMessage[]>([]);

    const popupLink = useMemo<ConnectPopupLink | null>(() => {
        if (!extensionId) return null;

        return {
            sendMessage: (message: ConnectPopupOutgoingMessage) => {
                postMessageToExtension(message, extensionId);
            },
            handshakeConfirmMessage: {
                type: 'channel-handshake-confirm',
                data: {
                    success: true,
                    payload: undefined,
                },
                channel: webextChannel,
            },
            origin: extensionId,
        };
    }, [extensionId]);

    const consumeMessages = useCallback(() => {
        setIncomingMessages(prev => prev.slice(1));
    }, []);

    useConnectPopup(popupLink, incomingMessages, consumeMessages);

    // Read messages from URL hash (webextension link).
    const readUrl = useCallback(() => {
        const hash = getUrlHashParams();
        const message = hash.get('message');

        // The opening extension sends its id with every message, so drop any other id or none.
        if (message && hash.get('extension-id') !== extensionId) {
            console.warn('[connect-popup] dropping a hash message with a mismatched extension-id');
            clearUrlHash();

            return;
        }

        let parsedMessage: ConnectPopupMessage | null = null;
        if (message) {
            try {
                parsedMessage = JSON.parse(decodeURIComponent(message));
            } catch {
                // Malformed message in hash — ignore.
                return;
            }
        }

        if (parsedMessage) {
            // Deduplicate using the numeric message id assigned by AbstractMessageChannel.
            // channel-handshake-request has no id (usePromise: false) and passes through
            // unconditionally — that's fine since it's idempotent by design.
            const msgId = (parsedMessage as { id?: number }).id;
            const isDuplicate = msgId !== undefined && msgId === lastProcessedMessageIdRef.current;

            if (!isDuplicate) {
                lastProcessedMessageIdRef.current = msgId;
                setIncomingMessages(prev => [...prev, parsedMessage]);
            }
            // Clean hash after reading to prevent browser history pollution.
            clearUrlHash();
        }
    }, [extensionId]);

    // Monitor URL hash changes for incoming webextension messages.
    useEffect(() => {
        if (!extensionId) {
            // Suite Web was not opened by an extension.
            return;
        }

        readUrl();

        window.addEventListener('popstate', readUrl);
        window.addEventListener('hashchange', readUrl);

        return () => {
            window.removeEventListener('popstate', readUrl);
            window.removeEventListener('hashchange', readUrl);
        };
    }, [extensionId, readUrl]);
};
