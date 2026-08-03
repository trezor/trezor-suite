import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

export interface WebextHashUpdate {
    /** Extension id to bind for the first time, or `null` if none / already bound. */
    extensionIdToBind: string | null;
    /** Parsed incoming message, or `null` when the hash carries no message. */
    message: ConnectPopupMessage | null;
    /** When `true`, the whole hash update must be ignored. */
    reject: boolean;
}

/**
 * Parse a webextension link URL hash and decide how to react to it.
 *
 * The extension id is the destination the popup sends the operation result
 * (address/xpub/tx) back to. The legitimate opener repeats its own id in every
 * hash update, so we bind it to the first value seen and reject any later update
 * carrying a different id — a second extension holding host permissions for the
 * Suite origin can also rewrite this tab's hash via `chrome.tabs.update`, and
 * without this guard it could re-point the response route (or inject calls) to
 * itself. Kept pure so the security-critical decision is unit-testable.
 */
export const resolveWebextHashUpdate = (
    locationHash: string,
    boundExtensionId: string | null,
): WebextHashUpdate => {
    const hash = new URLSearchParams(locationHash.replace('#', '?'));
    const newExtensionId = hash.get('extension-id');

    let extensionIdToBind: string | null = null;
    if (newExtensionId) {
        if (boundExtensionId === null) {
            extensionIdToBind = newExtensionId;
        } else if (newExtensionId !== boundExtensionId) {
            return { extensionIdToBind: null, message: null, reject: true };
        }
    }

    const rawMessage = hash.get('message');
    let message: ConnectPopupMessage | null = null;
    if (rawMessage) {
        try {
            message = JSON.parse(decodeURIComponent(rawMessage));
        } catch {
            // Malformed message in hash — ignore the whole update.
            return { extensionIdToBind: null, message: null, reject: true };
        }
    }

    return { extensionIdToBind, message, reject: false };
};

export const useConnectPopupWebextension = () => {
    const [extensionId, setExtensionId] = useState<string | null>(null);
    // First extension id seen for this popup session; the response route is
    // frozen to it (see resolveWebextHashUpdate).
    const boundExtensionIdRef = useRef<string | null>(null);
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
        const { extensionIdToBind, message, reject } = resolveWebextHashUpdate(
            window.location.hash,
            boundExtensionIdRef.current,
        );

        if (reject) return;

        if (extensionIdToBind) {
            boundExtensionIdRef.current = extensionIdToBind;
            setExtensionId(extensionIdToBind);
        }

        if (message) {
            // Deduplicate using the numeric message id assigned by AbstractMessageChannel.
            // channel-handshake-request has no id (usePromise: false) and passes through
            // unconditionally — that's fine since it's idempotent by design.
            const msgId = (message as { id?: number }).id;
            const isDuplicate = msgId !== undefined && msgId === lastProcessedMessageIdRef.current;

            if (!isDuplicate) {
                lastProcessedMessageIdRef.current = msgId;
                setIncomingMessages(prev => [...prev, message]);
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
