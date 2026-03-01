import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    ConnectPopupLink,
    ConnectPopupMessage,
    ConnectPopupOutgoingMessage,
    useConnectPopup,
} from './useConnectPopup';

/**
 * Minimal Chrome extension API types needed by this hook.
 * We intentionally don't add @types/chrome to the suite package since only
 * this file uses the Chrome API (when Suite Web is opened by a webextension).
 */
interface ChromeRuntime {
    sendMessage: (extensionId: string, message: Record<string, unknown>) => void;
    lastError?: { message: string };
}

declare const chrome: { runtime?: ChromeRuntime } | undefined;

const webextChannel = {
    here: '@trezor/suite-web',
    peer: '@trezor/connect-webextension-externally-connectable',
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

export const useConnectPopupWebextension = () => {
    const [extensionId, setExtensionId] = useState<string | null>(null);
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
        const hash = new URLSearchParams(window.location.hash.replace('#', '?'));
        const newExtensionId = hash.get('extension-id');
        const message = hash.get('message');
        let parsedMessage: ConnectPopupMessage | null = null;
        if (message) {
            try {
                parsedMessage = JSON.parse(decodeURIComponent(message));
            } catch {
                // Malformed message in hash — ignore.
                return;
            }
        }

        if (newExtensionId) {
            setExtensionId(newExtensionId);
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
            window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
            );
        }
    }, []);

    // Monitor URL hash changes for incoming webextension messages.
    useEffect(() => {
        readUrl();

        window.addEventListener('popstate', readUrl);
        window.addEventListener('hashchange', readUrl);

        return () => {
            window.removeEventListener('popstate', readUrl);
            window.removeEventListener('hashchange', readUrl);
        };
    }, [readUrl]);
};
