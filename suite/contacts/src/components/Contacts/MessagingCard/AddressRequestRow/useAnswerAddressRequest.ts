import { useState } from 'react';

import { type ContactsError, dismissContactAddressRequestThunk } from '@suite-common/contacts';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { answerAddressRequestThunk } from '../../../../answerAddressRequestThunk';

type UseAnswerAddressRequestParams = {
    npub: string;
    slip44: number;
    /** With the address that went to the requester. */
    onSent: (address: string) => void;
};

export const useAnswerAddressRequest = ({
    npub,
    slip44,
    onSent,
}: UseAnswerAddressRequestParams) => {
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    const send = async (accountKey: AccountKey) => {
        setIsSending(true);
        setError(undefined);

        const result = await dispatch(answerAddressRequestThunk({ npub, accountKey })).unwrap();

        setIsSending(false);

        if (result.success) {
            onSent(result.payload.address);
        } else {
            setError(result.error);
        }
    };

    const dismiss = () => dispatch(dismissContactAddressRequestThunk({ npub, slip44 }));

    return { isSending, error, send, dismiss };
};
