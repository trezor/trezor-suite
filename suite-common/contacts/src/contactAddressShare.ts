import { z } from 'zod';

import { type Result, err, ok } from '@trezor/type-utils';
import { parseJSON } from '@trezor/utils';

import { type ContactAttestation, verifyContactAttestation } from './contactAttestation';
import { encodeNpub } from './npub';

/**
 * What a receiver hands a payer: an attested address of theirs, with their npub for the payer to
 * match against the contact. It is plain text, so it can travel through any chat.
 */
export type ContactAddressShare = ContactAttestation & { npub: string };

export type ContactAddressShareError = 'NotAnAddressShare' | 'InvalidAttestation' | 'NpubMismatch';

// Extra fields are ignored, so the reply of the nostr exchange (`{ t: 'addr', … }`) pastes as is.
const ContactAddressShareSchema = z.object({
    npub: z.string().optional(),
    pubkey: z.string(),
    slip44: z.number(),
    address: z.string(),
    signature: z.string(),
});

export const serializeContactAddressShare = ({
    npub,
    pubkey,
    slip44,
    address,
    signature,
}: ContactAddressShare) => JSON.stringify({ npub, pubkey, slip44, address, signature });

/** The share in `text`, if its attestation is valid; the npub is derived from the signing key. */
export const parseContactAddressShare = (
    text: string,
): Result<ContactAddressShare, ContactAddressShareError> => {
    const parsed = ContactAddressShareSchema.safeParse(parseJSON(text.trim()));

    if (!parsed.success) {
        return err('NotAnAddressShare');
    }

    const attestation: ContactAttestation = {
        pubkey: parsed.data.pubkey.toLowerCase(),
        slip44: parsed.data.slip44,
        address: parsed.data.address,
        signature: parsed.data.signature.toLowerCase(),
    };

    if (!verifyContactAttestation(attestation)) {
        return err('InvalidAttestation');
    }

    const npub = encodeNpub(attestation.pubkey);

    if (!npub.success) {
        return err('InvalidAttestation');
    }

    if (parsed.data.npub !== undefined && parsed.data.npub.toLowerCase() !== npub.payload) {
        return err('NpubMismatch');
    }

    return ok({ ...attestation, npub: npub.payload });
};
