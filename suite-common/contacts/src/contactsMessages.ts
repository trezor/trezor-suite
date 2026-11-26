import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hex } from '@scure/base';
import { z } from 'zod';

import { type Result, err, exhaustive, ok } from '@trezor/type-utils';
import { parseJSON } from '@trezor/utils';

import { type ContactAddressShare, parseContactAddressShare } from './contactAddressShare';
import { type ContactsHotKey, isXOnlyPublicKey } from './contactsHotKey';
import { decryptNip44, encryptNip44, getNip44ConversationKey } from './nostr/nip44';
import { type NostrEvent, finalizeNostrEvent } from './nostr/nostrEvent';
import { parseNpub } from './npub';

/**
 * Requests and replies share one regular kind (NIP-01, 1000-9999), which relays store: a contact
 * who is offline when a message is sent gets it later. Sharing the kind keeps the relay from
 * telling requests and replies apart.
 */
export const CONTACTS_MESSAGE_KIND = 7924;

/** A contact asks for an address (`npub` is theirs), or sends one their Trezor attested. */
export type ContactsMessage =
    | { type: 'AddressRequest'; npub: string; slip44: number }
    | { type: 'Address'; share: ContactAddressShare };

export type ContactsMessageError = 'NotForThisKey' | 'InvalidMessage';

const MessageTypeSchema = z.object({ t: z.enum(['req', 'addr']) });

const AddressRequestSchema = z.object({
    from: z.string(),
    slip44: z
        .number()
        .int()
        .min(0)
        .max(2 ** 32 - 1),
});

export const serializeContactsMessage = (message: ContactsMessage) => {
    switch (message.type) {
        case 'AddressRequest':
            return JSON.stringify({ t: 'req', from: message.npub, slip44: message.slip44 });
        case 'Address': {
            const { slip44, address, pubkey, signature } = message.share;

            return JSON.stringify({ t: 'addr', slip44, address, pubkey, signature });
        }
        default:
            return exhaustive(message);
    }
};

/** The message, if it is a well-formed request or an address with a valid attestation. */
export const parseContactsMessage = (text: string): Result<ContactsMessage, 'InvalidMessage'> => {
    const json = parseJSON(text);
    const messageType = MessageTypeSchema.safeParse(json);

    if (!messageType.success) {
        return err('InvalidMessage');
    }

    if (messageType.data.t === 'addr') {
        const share = parseContactAddressShare(text);

        return share.success
            ? ok({ type: 'Address', share: share.payload })
            : err('InvalidMessage');
    }

    const request = AddressRequestSchema.safeParse(json);
    const npub = request.success ? parseNpub(request.data.from) : undefined;

    if (!request.success || !npub?.success) {
        return err('InvalidMessage');
    }

    return ok({ type: 'AddressRequest', npub: npub.payload, slip44: request.data.slip44 });
};

type SealContactsMessageParams = {
    message: ContactsMessage;
    recipientHotPubkey: string;
    createdAt: number;
};

/**
 * The message as an event only the recipient's hot key can open (NIP-44 v2). It is authored by a
 * key made for this one message, so the relay cannot link it to the sender; who sent an address
 * is proven by its attestation instead, and a request needs no proof (the reply goes to the hot
 * key the requester's identity attested, never to one named in the request).
 */
export const sealContactsMessage = ({
    message,
    recipientHotPubkey,
    createdAt,
}: SealContactsMessageParams): Result<NostrEvent, 'InvalidRecipient'> => {
    if (!isXOnlyPublicKey(recipientHotPubkey)) {
        return err('InvalidRecipient');
    }

    const senderSecretKey = secp256k1.utils.randomSecretKey();
    const conversationKey = getNip44ConversationKey({
        secretKey: senderSecretKey,
        publicKey: hex.decode(recipientHotPubkey),
    });
    const content = conversationKey.success
        ? encryptNip44({
              plaintext: serializeContactsMessage(message),
              conversationKey: conversationKey.payload,
          })
        : conversationKey;

    if (!content.success) {
        return err('InvalidRecipient');
    }

    return ok(
        finalizeNostrEvent({
            draft: {
                kind: CONTACTS_MESSAGE_KIND,
                created_at: createdAt,
                tags: [['p', recipientHotPubkey]],
                content: content.payload,
            },
            secretKey: senderSecretKey,
        }),
    );
};

type OpenContactsMessageParams = {
    /** Authentic (its id and signature checked), as the relay client delivers it. */
    event: NostrEvent;
    hotKey: ContactsHotKey;
};

export const openContactsMessage = ({
    event,
    hotKey,
}: OpenContactsMessageParams): Result<ContactsMessage, ContactsMessageError> => {
    const isForThisKey = event.tags.some(
        ([name, value]) => name === 'p' && value === hotKey.pubkey,
    );

    if (event.kind !== CONTACTS_MESSAGE_KIND || !isForThisKey) {
        return err('NotForThisKey');
    }

    const conversationKey = getNip44ConversationKey({
        secretKey: hotKey.secretKey,
        publicKey: hex.decode(event.pubkey),
    });
    const plaintext = conversationKey.success
        ? decryptNip44({ payload: event.content, conversationKey: conversationKey.payload })
        : conversationKey;

    return plaintext.success ? parseContactsMessage(plaintext.payload) : err('InvalidMessage');
};
