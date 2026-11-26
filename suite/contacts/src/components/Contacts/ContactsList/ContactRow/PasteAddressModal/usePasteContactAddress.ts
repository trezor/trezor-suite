import { useState } from 'react';

import { type ContactsError, addContactAddressThunk } from '@suite-common/contacts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UsePasteContactAddressParams = {
    npub: string;
    onSaved: () => void;
};

export const usePasteContactAddress = ({ npub, onSaved }: UsePasteContactAddressParams) => {
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    const save = async () => {
        setIsSaving(true);
        setError(undefined);

        const result = await dispatch(addContactAddressThunk({ npub, text })).unwrap();

        setIsSaving(false);

        if (result.success) {
            onSaved();
        } else {
            setError(result.error);
        }
    };

    return { text, setText, isSaving, error, save };
};
