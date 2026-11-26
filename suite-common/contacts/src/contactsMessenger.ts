import { type Result, err, ok } from '@trezor/type-utils';

import {
    CONTACTS_HOT_KEY_ATTESTATION_KIND,
    type ContactsHotKey,
    getAttestedHotKey,
} from './contactsHotKey';
import {
    CONTACTS_MESSAGE_KIND,
    type ContactsMessage,
    openContactsMessage,
    sealContactsMessage,
} from './contactsMessages';
import { type NostrEvent, parseNostrEvent } from './nostr/nostrEvent';
import { type RelayPool } from './nostr/relayPool';

// How far back the inbox reaches. Relays keep messages, so a contact may answer while the wallet
// is offline; older ones are not shown again after every restart of the inbox.
export const CONTACTS_INBOX_WINDOW_SECONDS = 14 * 24 * 60 * 60;
const INBOX_LIMIT = 200;
// A relay keeps one replaceable event per author; a few allow for relays that keep more.
const HOT_KEY_ATTESTATION_LIMIT = 5;

export type ReceivedContactsMessage = {
    message: ContactsMessage;
    /** When the sender says it sent the message, in seconds. */
    createdAt: number;
};

type ContactsMessengerParams = {
    pool: RelayPool;
    /** The wallet's identity, x-only hex. */
    identityPubkey: string;
    hotKey: ContactsHotKey;
};

type SendParams = {
    recipientHotPubkey: string;
    message: ContactsMessage;
};

const getNowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * A wallet's contacts messages over nostr relays: its inbox on its hot key, the attestation of
 * that key, and sealed messages to contacts' hot keys. It holds the hot key, so it lives only
 * while the wallet's inbox is open.
 */
export class ContactsMessenger {
    readonly hotPubkey: string;

    private readonly pool: RelayPool;
    private readonly identityPubkey: string;
    private readonly hotKey: ContactsHotKey;

    constructor({ pool, identityPubkey, hotKey }: ContactsMessengerParams) {
        this.pool = pool;
        this.identityPubkey = identityPubkey;
        this.hotKey = hotKey;
        this.hotPubkey = hotKey.pubkey;
    }

    subscribeInbox(onMessage: (received: ReceivedContactsMessage) => void) {
        return this.pool.subscribe({
            filters: [
                {
                    kinds: [CONTACTS_MESSAGE_KIND],
                    '#p': [this.hotKey.pubkey],
                    since: getNowSeconds() - CONTACTS_INBOX_WINDOW_SECONDS,
                    limit: INBOX_LIMIT,
                },
            ],
            onEvent: event => {
                // Anyone can write to the hot key; what does not open is dropped.
                const message = openContactsMessage({ event, hotKey: this.hotKey });

                if (message.success) {
                    onMessage({ message: message.payload, createdAt: event.created_at });
                }
            },
        });
    }

    /** The hot key the identity attested last, as the relays have it. */
    async fetchHotKey(identityPubkey: string) {
        const events = await this.pool.query({
            filters: [
                {
                    kinds: [CONTACTS_HOT_KEY_ATTESTATION_KIND],
                    authors: [identityPubkey],
                    limit: HOT_KEY_ATTESTATION_LIMIT,
                },
            ],
        });

        return getAttestedHotKey({ events, identityPubkey });
    }

    /** Whether contacts find this hot key for the wallet's identity. */
    async isHotKeyAttested() {
        return (await this.fetchHotKey(this.identityPubkey)) === this.hotKey.pubkey;
    }

    /** Publishes the identity's attestation of the hot key, as the Trezor signed it. */
    async publishHotKeyAttestation(
        event: NostrEvent,
    ): Promise<Result<void, 'InvalidAttestation' | 'NotDelivered'>> {
        const attestation = parseNostrEvent(event);
        const hotPubkey = attestation
            ? getAttestedHotKey({ events: [attestation], identityPubkey: this.identityPubkey })
            : undefined;

        if (!attestation || hotPubkey !== this.hotKey.pubkey) {
            return err('InvalidAttestation');
        }

        return (await this.pool.publish(attestation)) ? ok() : err('NotDelivered');
    }

    async send({
        recipientHotPubkey,
        message,
    }: SendParams): Promise<Result<void, 'InvalidRecipient' | 'NotDelivered'>> {
        const event = sealContactsMessage({
            message,
            recipientHotPubkey,
            createdAt: getNowSeconds(),
        });

        if (!event.success) {
            return event;
        }

        return (await this.pool.publish(event.payload)) ? ok() : err('NotDelivered');
    }

    close() {
        this.pool.close();
        this.hotKey.secretKey.fill(0);
    }
}
