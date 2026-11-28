import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';
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

// A Chromium extension is named by 32 letters from a to p, and nothing else can stand for one: not
// the origin of a website, which holds a scheme, nor a wildcard. The id is also the origin of the
// calls of its extension, so a malformed one would let a caller take the place of another. Suite
// Web cannot answer a Firefox extension at all (see `canSuiteWebReplyToExtension`).
const CHROMIUM_EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

// What the extension stamps on every message, whatever its payload.
type ExtensionMessage = {
    type?: unknown;
    id?: unknown;
    channel?: { here?: unknown; peer?: unknown };
};

const isMessageFromExtension = (message: ExtensionMessage) =>
    message.channel?.here === webextChannel.peer && message.channel?.peer === webextChannel.here;

// The types the shared popup protocol handles. The payload is that protocol's to read.
const isConnectPopupMessage = (message: ExtensionMessage): message is ConnectPopupMessage =>
    message.type === 'channel-handshake-request' ||
    message.type === POPUP.HANDSHAKE ||
    message.type === POPUP.CLOSED ||
    message.type === CORE_CALL_CANCEL ||
    message.type === CORE_CALL;

const getUrlHashParams = () => new URLSearchParams(window.location.hash.replace('#', '?'));

const getExtensionId = (hashParams: URLSearchParams): string | null => {
    const extensionId = hashParams.get('extension-id');

    return extensionId !== null && CHROMIUM_EXTENSION_ID_PATTERN.test(extensionId)
        ? extensionId
        : null;
};

// `URLSearchParams` has decoded the hash already, so decoding it again would change what the
// extension sent: `%41` into `A`, and a lone `%` would not parse at all.
const parseHashMessage = (hashMessage: string): ExtensionMessage | null => {
    try {
        return JSON.parse(hashMessage);
    } catch {
        // Malformed message in hash — ignore.
        return null;
    }
};

const clearUrlHash = () =>
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

export const useConnectPopupWebextension = () => {
    // Read once, so later hash writes cannot change which extension the popup answers.
    const [extensionId] = useState(() => getExtensionId(getUrlHashParams()));
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

        const parsedMessage = message ? parseHashMessage(message) : null;

        if (parsedMessage) {
            // Only what the extension sent over its own channel and the popup handles is passed on.
            // A message that is refused is removed from the hash like any other.
            if (isMessageFromExtension(parsedMessage) && isConnectPopupMessage(parsedMessage)) {
                // Deduplicate using the numeric message id assigned by AbstractMessageChannel.
                // channel-handshake-request has no id (usePromise: false) and passes through
                // unconditionally — that's fine since it's idempotent by design.
                const msgId = typeof parsedMessage.id === 'number' ? parsedMessage.id : undefined;
                const isDuplicate =
                    msgId !== undefined && msgId === lastProcessedMessageIdRef.current;

                if (!isDuplicate) {
                    lastProcessedMessageIdRef.current = msgId;
                    setIncomingMessages(prev => [...prev, parsedMessage]);
                }
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
