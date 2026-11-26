import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type ContactsError,
    type ContactsRootState,
    selectContactsIdentityNpub,
    startContactsMessagingThunk,
    stopContactsMessagingThunk,
} from '@suite-common/contacts';
import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectContactsRelayUrls } from '../../../contactsSelectors';

/**
 * Keeps the selected wallet's inbox open while the Contacts page is: it opens once the wallet's
 * npub is known (so the Trezor is asked for one thing at a time) and closes on leaving the page,
 * on another wallet, on a disconnected Trezor or on other relays.
 */
export const useContactsInbox = () => {
    const staticSessionId = useSelector(selectDeviceStaticSessionId);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const identityNpub = useSelector((state: ContactsRootState) =>
        staticSessionId ? selectContactsIdentityNpub(state, staticSessionId) : undefined,
    );
    const relayUrls = useSelector(selectContactsRelayUrls);
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (!staticSessionId || !isDeviceConnected || identityNpub === undefined) {
            return;
        }

        const start = dispatch(startContactsMessagingThunk({ relayUrls }));

        setError(undefined);
        start.then(action => {
            if (
                startContactsMessagingThunk.fulfilled.match(action) &&
                !action.payload.success &&
                action.payload.error.type !== 'Cancelled'
            ) {
                setError(action.payload.error);
            }
        });

        return () => {
            start.abort();
            dispatch(stopContactsMessagingThunk({ staticSessionId }));
        };
    }, [dispatch, staticSessionId, isDeviceConnected, identityNpub, relayUrls]);

    return { error };
};
