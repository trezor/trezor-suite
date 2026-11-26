import {
    type ContactAddressShare,
    type ContactsError,
    type ContactsMessagingServiceDeps,
    fetchContactHotKeyThunk,
    sendContactAddressThunk,
} from '@suite-common/contacts';
import { type AccountKey } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';
import { type Result } from '@trezor/type-utils';

import {
    type ShareContactAddressThunkState,
    shareContactAddressThunk,
} from './shareContactAddressThunk';

type AnswerAddressRequestThunkParams = {
    /** The requester's npub. */
    npub: string;
    accountKey: AccountKey;
};

type AnswerAddressRequestThunkState = ShareContactAddressThunkState;

type AnswerAddressRequestThunkDeps = ContactsMessagingServiceDeps;

/**
 * Answers a contact's request with the account's next fresh address, attested on the Trezor. The
 * requester's hot key is looked up first, so no address is handed out to someone unreachable.
 */
export const answerAddressRequestThunk = createThunk<
    Result<ContactAddressShare, ContactsError>,
    AnswerAddressRequestThunkParams,
    { state: AnswerAddressRequestThunkState; extra: AnswerAddressRequestThunkDeps }
>('@suite/contacts/answerAddressRequestThunk', async ({ npub, accountKey }, { dispatch }) => {
    const recipientHotPubkey = await dispatch(fetchContactHotKeyThunk({ npub })).unwrap();

    if (!recipientHotPubkey.success) {
        return recipientHotPubkey;
    }

    const shared = await dispatch(shareContactAddressThunk({ accountKey })).unwrap();

    if (!shared.success) {
        return shared;
    }

    const sent = await dispatch(
        sendContactAddressThunk({
            npub,
            recipientHotPubkey: recipientHotPubkey.payload,
            share: shared.payload,
        }),
    ).unwrap();

    return sent.success ? shared : sent;
});
