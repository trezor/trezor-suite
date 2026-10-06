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

// The link answers through `chrome.runtime.sendMessage`, which takes a Chromium extension id:
// 32 letters a-p.
const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

const webextChannel = {
    here: WEBEXTENSION_SUITE_WEB_CHANNEL.suiteWeb,
    peer: WEBEXTENSION_SUITE_WEB_CHANNEL.webextension,
};

const postMessageToExtension = (message: ConnectPopupOutgoingMessage, extensionId: string) => {
    if (!message.channel) {
        message.channel = webextChannel;
    }

    // `chrome?.` alone throws a ReferenceError where the global is not declared.
    const runtime = typeof chrome === 'undefined' ? undefined : chrome?.runtime;
    if (!runtime?.sendMessage) {
        return;
    }

    runtime.sendMessage(extensionId, message);
};

export const useConnectPopupWebextension = () => {
    const [extensionId, setExtensionId] = useState<string | null>(null);
    const extensionIdRef = useRef<string | null>(null);
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
            // The id comes from the URL hash, not from the browser.
            isOriginSelfDeclared: true,
        };
    }, [extensionId]);

    const consumeMessages = useCallback(() => {
        setIncomingMessages(prev => prev.slice(1));
    }, []);

    useConnectPopup(popupLink, incomingMessages, consumeMessages);

    // Read messages from URL hash (webextension link).
    const readUrl = useCallback(() => {
        const hash = new URLSearchParams(window.location.hash.replace('#', '?'));
        const hashExtensionId = hash.get('extension-id');
        const message = hash.get('message');

        // Every hash update of the link names its extension.
        if (!hashExtensionId) {
            return;
        }

        // A popup session belongs to exactly one extension. Its service worker
        // writes its own chrome.runtime.id into the hash, which never changes
        // for the session, and the popup URL it opens already carries it. Pin
        // the first valid extension id we see and reject any hash write
        // carrying a different id, so that calls and responses
        // (`chrome.runtime.sendMessage(extensionId)`) of the session stay with
        // the extension that opened it.
        if (extensionIdRef.current === null && EXTENSION_ID_PATTERN.test(hashExtensionId)) {
            extensionIdRef.current = hashExtensionId;
            setExtensionId(hashExtensionId);
        } else if (hashExtensionId !== extensionIdRef.current) {
            // Not the id of this session — drop it and clear the hash so the
            // payload does not linger in the URL bar / history entry.
            window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
            );

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
