import { useState } from 'react';

import { type ContactsError, requestContactAddressThunk } from '@suite-common/contacts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export type RequestContactAddressOutcome =
    { type: 'error'; error: ContactsError } | { type: 'sent' };

/** One request at a time per contact, with what came of the last one. */
export const useRequestContactAddress = (npub: string) => {
    const [pendingSlip44, setPendingSlip44] = useState<number>();
    const [outcome, setOutcome] = useState<RequestContactAddressOutcome>();
    const { dispatch } = useServices(injectDispatch);

    const request = async (slip44: number) => {
        setPendingSlip44(slip44);
        setOutcome(undefined);

        const result = await dispatch(requestContactAddressThunk({ npub, slip44 })).unwrap();

        setPendingSlip44(undefined);
        setOutcome(result.success ? { type: 'sent' } : { type: 'error', error: result.error });
    };

    return { pendingSlip44, outcome, request };
};
