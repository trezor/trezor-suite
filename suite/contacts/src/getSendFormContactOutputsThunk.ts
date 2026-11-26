import {
    type ContactsError,
    type GetContactOutputsThunkState,
    getContactOutputsThunk,
} from '@suite-common/contacts';
import { type ContactOutputAttestation } from '@suite-common/wallet-core';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { type PROTO } from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';
import { type Result, ok } from '@trezor/type-utils';

import { type ContactsAvailabilityRootState, selectIsContactsAvailable } from './contactsSelectors';

type GetSendFormContactOutputsThunkParams = {
    accountKey: AccountKey;
    formState: FormState;
    paymentRequests?: PROTO.PaymentRequest[];
};

export type GetSendFormContactOutputsThunkState = ContactsAvailabilityRootState &
    GetContactOutputsThunkState;

/**
 * The contact attestations a send form's transaction is signed with. A replacement keeps the
 * outputs it replaces and a trading payment request covers every output, so neither gets any.
 */
export const getSendFormContactOutputsThunk = createThunk<
    Result<ContactOutputAttestation[], ContactsError>,
    GetSendFormContactOutputsThunkParams,
    { state: GetSendFormContactOutputsThunkState }
>(
    '@suite/contacts/getSendFormContactOutputsThunk',
    async ({ accountKey, formState, paymentRequests }, { dispatch, getState }) => {
        if (
            !selectIsContactsAvailable(getState()) ||
            formState.rbfParams !== undefined ||
            (paymentRequests?.length ?? 0) > 0
        ) {
            return ok([]);
        }

        const outputAddresses = formState.outputs
            .filter(output => output.type === 'payment' && output.address !== '')
            .map(output => output.address);

        const contactOutputs = await dispatch(
            getContactOutputsThunk({ accountKey, outputAddresses }),
        ).unwrap();

        return contactOutputs;
    },
);
