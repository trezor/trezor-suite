import { useState } from 'react';

import {
    type ContactWardStatus,
    type ContactsError,
    removeContactThunk,
    showContactOnTrezorThunk,
    writeContactToTrezorThunk,
} from '@suite-common/contacts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { type Result, exhaustive } from '@trezor/type-utils';

export type ContactRowAction = 'show' | 'writeAgain' | 'remove';

export type ContactRowOutcome =
    { type: 'error'; error: ContactsError } | { type: 'queued' } | { type: 'done' };

const getOutcome = (result: Result<ContactWardStatus | void, ContactsError>): ContactRowOutcome => {
    if (!result.success) {
        return { type: 'error', error: result.error };
    }

    return result.payload === 'queued' ? { type: 'queued' } : { type: 'done' };
};

/** One device action at a time per contact, with what came of the last one. */
export const useContactRowActions = (npub: string) => {
    const [pendingAction, setPendingAction] = useState<ContactRowAction>();
    const [outcome, setOutcome] = useState<ContactRowOutcome>();
    const { dispatch } = useServices(injectDispatch);

    const dispatchAction = (action: ContactRowAction) => {
        switch (action) {
            case 'show':
                return dispatch(showContactOnTrezorThunk({ npub })).unwrap();
            case 'writeAgain':
                return dispatch(writeContactToTrezorThunk({ npub })).unwrap();
            case 'remove':
                return dispatch(removeContactThunk({ npub })).unwrap();
            default:
                return exhaustive(action);
        }
    };

    const run = async (action: ContactRowAction) => {
        setPendingAction(action);
        setOutcome(undefined);

        const result = await dispatchAction(action);

        setPendingAction(undefined);
        setOutcome(getOutcome(result));
    };

    return { pendingAction, outcome, run };
};
