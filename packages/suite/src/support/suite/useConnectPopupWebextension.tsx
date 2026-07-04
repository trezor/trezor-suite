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

/**
 * Decide what to do with a hash write, given the extension id pinned for the
 * current page load and the `extension-id` the write carries (`null` when it
 * carries none). Returns the id that stays pinned afterwards.
 *
 * Extracted from the hook so the pinning rule is covered by tests without
 * rendering the whole popup.
 */
export const resolvePinnedExtensionId = (
    pinnedExtensionId: string | null,
    hashExtensionId: string | null,
): { accept: boolean; pinnedExtensionId: string | null } => {
    if (!hashExtensionId) {
        return { accept: true, pinnedExtensionId };
    }

    if (pinnedExtensionId === null) {
        return { accept: true, pinnedExtensionId: hashExtensionId };
    }

    return { accept: hashExtensionId === pinnedExtensionId, pinnedExtensionId };
};

export const useConnectPopupWebextension = () => {
    const [extensionId, setExtensionId] = useState<string | null>(null);
    // todo: the pin below holds for one page load only. Any real navigation of
    // the popup tab (chrome.tabs.update with a different path or query, which
    // needs no extra permission) remounts the hook, and the fresh instance pins
    // whatever the new hash says. The in-flight call dies with the page, but the
    // next one is then driven by the newly pinned extension. Closing that needs
    // the per-session negotiated token described in the todo in
    // serviceworker-window-ext-connectable.ts — the tracked follow-up to this fix.
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

        // Pin the first `extension-id` seen for this page load and drop any later
        // hash write carrying a different id. The service worker writes its own
        // chrome.runtime.id, which never changes for the session, so legitimate
        // flows keep the pin. The response route is
        // `chrome.runtime.sendMessage(extensionId)`, so another extension able to
        // write this tab's hash (host_permissions for the popup origin) must not
        // be able to repoint it mid-session and receive the method result
        // (address / xpub / signed tx).
        //
        // Scope, deliberately: this pins the outbound target only. The inbound
        // hash is not authenticated — the pinned id is readable by the same
        // adversary via chrome.tabs.get().url, and a write carrying no
        // `extension-id` at all is not rejected here — so forged
        // CORE_CALLs remain possible. Closing that needs the per-session
        // negotiated token described in the todo in
        // serviceworker-window-ext-connectable.ts.
        const { accept, pinnedExtensionId } = resolvePinnedExtensionId(
            extensionIdRef.current,
            hashExtensionId,
        );

        if (!accept) {
            // Not ours — drop it and clear the hash so the payload does not
            // linger in the URL bar / history entry. The rejected id is
            // attacker-controlled, so it is deliberately not part of the
            // message; without any log at all a rejection is invisible and
            // the session just stalls until the caller times out.
            console.warn(
                '[connect-popup] dropping hash write from a foreign extension id; session is pinned',
            );
            window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
            );

            return;
        }

        if (pinnedExtensionId !== extensionIdRef.current) {
            extensionIdRef.current = pinnedExtensionId;
            setExtensionId(pinnedExtensionId);
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
