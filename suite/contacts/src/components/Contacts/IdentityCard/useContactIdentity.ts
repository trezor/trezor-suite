import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type ContactsError,
    type ContactsRootState,
    loadContactIdentityThunk,
    selectContactsIdentityNpub,
} from '@suite-common/contacts';
import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

/** The selected wallet's own npub, read from its Trezor (silently) the first time it is needed. */
export const useContactIdentity = () => {
    const staticSessionId = useSelector(selectDeviceStaticSessionId);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const npub = useSelector((state: ContactsRootState) =>
        staticSessionId ? selectContactsIdentityNpub(state, staticSessionId) : undefined,
    );
    const [error, setError] = useState<ContactsError>();
    const [isShowing, setIsShowing] = useState(false);
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (!staticSessionId || !isDeviceConnected || npub !== undefined) {
            return;
        }

        dispatch(loadContactIdentityThunk({}))
            .unwrap()
            .then(result => setError(result.success ? undefined : result.error));
    }, [dispatch, staticSessionId, isDeviceConnected, npub]);

    const showOnTrezor = async () => {
        setIsShowing(true);
        const result = await dispatch(loadContactIdentityThunk({ showOnTrezor: true })).unwrap();
        setIsShowing(false);
        setError(result.success ? undefined : result.error);
    };

    return { npub, error, isShowing, showOnTrezor };
};
