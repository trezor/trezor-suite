import { type Contact } from 'src/reducers/suite/contactsReducer';

import { parseIdentity } from './npub';

export type ContactIdentityStatus = 'empty' | 'invalid' | 'self' | 'duplicate' | 'ok';

export type ContactIdentityEvaluation = {
    /**
     * The parsed hex public key for a well-formed identity, `null` for a malformed one and
     * `undefined` while the field is empty. Only status `ok` may be submitted.
     */
    npub: string | null | undefined;
    status: ContactIdentityStatus;
};

/**
 * Classifies the identity typed into the add-contact form against the user's own identity and
 * roster, in this order: empty, invalid, self, duplicate, ok. The add-contact thunk rejects self
 * and duplicates the same way.
 */
export const evaluateContactIdentity = (
    input: string,
    {
        ownNpub,
        roster,
    }: { ownNpub: string | undefined; roster: Record<string, Contact> | undefined },
): ContactIdentityEvaluation => {
    if (input.trim() === '') return { npub: undefined, status: 'empty' };

    let npub: string;
    try {
        npub = parseIdentity(input);
    } catch {
        return { npub: null, status: 'invalid' };
    }

    if (npub === ownNpub) return { npub, status: 'self' };
    if (roster?.[npub]) return { npub, status: 'duplicate' };

    return { npub, status: 'ok' };
};
