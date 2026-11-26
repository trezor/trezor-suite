import { type StaticSessionId } from '@trezor/connect';

import { type ContactsHotKey } from './contactsHotKey';
import { ContactsMessenger, type ReceivedContactsMessage } from './contactsMessenger';
import { type CreateRelaySocket } from './nostr/relayClient';
import { RelayPool } from './nostr/relayPool';

export type ContactsMessagingDeps = {
    createRelaySocket: CreateRelaySocket;
};

type StartContactsMessengerParams = {
    staticSessionId: StaticSessionId;
    relayUrls: string[];
    identityPubkey: string;
    hotKey: ContactsHotKey;
    onMessage: (received: ReceivedContactsMessage) => void;
    onStatusChange: (connectedRelayCount: number) => void;
};

/** What a wallet's messenger offers once its inbox is open. */
export type WalletContactsMessenger = Pick<
    ContactsMessenger,
    'hotPubkey' | 'fetchHotKey' | 'isHotKeyAttested' | 'publishHotKeyAttestation' | 'send'
>;

/**
 * The selected wallet's contacts messenger. There is at most one, so Suite holds one wallet's hot
 * key and talks to the relays for one wallet at a time; starting another stops the previous.
 */
export type ContactsMessaging = {
    start: (params: StartContactsMessengerParams) => WalletContactsMessenger;
    get: (staticSessionId: StaticSessionId) => WalletContactsMessenger | undefined;
    stop: (staticSessionId: StaticSessionId) => void;
};

export type ContactsMessagingDep = {
    contactsMessaging: ContactsMessaging;
};

type RunningMessenger = {
    staticSessionId: StaticSessionId;
    messenger: ContactsMessenger;
};

export const createContactsMessaging = (deps: ContactsMessagingDeps): ContactsMessaging => {
    let running: RunningMessenger | undefined;

    const stopRunning = () => {
        running?.messenger.close();
        running = undefined;
    };

    return {
        start: params => {
            stopRunning();

            const pool = new RelayPool({
                urls: params.relayUrls,
                createSocket: deps.createRelaySocket,
            });
            const messenger = new ContactsMessenger({
                pool,
                identityPubkey: params.identityPubkey,
                hotKey: params.hotKey,
            });

            pool.onStatusChange = params.onStatusChange;
            messenger.subscribeInbox(params.onMessage);
            running = { staticSessionId: params.staticSessionId, messenger };

            return messenger;
        },
        get: staticSessionId =>
            running?.staticSessionId === staticSessionId ? running.messenger : undefined,
        stop: staticSessionId => {
            if (running?.staticSessionId === staticSessionId) stopRunning();
        },
    };
};
