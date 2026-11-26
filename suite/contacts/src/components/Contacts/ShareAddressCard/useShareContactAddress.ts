import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type ContactAddressShare,
    type ContactsError,
    serializeContactAddressShare,
} from '@suite-common/contacts';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectContactShareableAccounts } from '../../../contactsSelectors';
import { shareContactAddressThunk } from '../../../shareContactAddressThunk';

/** Shares one address at a time and keeps the last share for the user to copy. */
export const useShareContactAddress = () => {
    const accounts = useSelector(selectContactShareableAccounts);
    const [pickedAccountKey, setPickedAccountKey] = useState<AccountKey>();
    const [isSharing, setIsSharing] = useState(false);
    const [share, setShare] = useState<ContactAddressShare>();
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    const accountKey =
        accounts.find(account => account.key === pickedAccountKey)?.key ?? accounts[0]?.key;

    const shareAddress = async () => {
        if (accountKey === undefined) {
            return;
        }

        setIsSharing(true);
        setError(undefined);
        setShare(undefined);

        const result = await dispatch(shareContactAddressThunk({ accountKey })).unwrap();

        setIsSharing(false);

        if (result.success) {
            setShare(result.payload);
        } else {
            setError(result.error);
        }
    };

    return {
        accounts,
        accountKey,
        setAccountKey: setPickedAccountKey,
        isSharing,
        share,
        shareText: share ? serializeContactAddressShare(share) : undefined,
        error,
        shareAddress,
    };
};
