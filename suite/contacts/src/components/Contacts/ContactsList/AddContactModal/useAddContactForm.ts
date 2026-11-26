import { useState } from 'react';

import {
    type ContactsError,
    addContactThunk,
    parseNpub,
    validateContactName,
} from '@suite-common/contacts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export type AddContactStep = 'editing' | 'confirming' | 'queued';

type UseAddContactFormParams = {
    onAdded: () => void;
};

export const useAddContactForm = ({ onAdded }: UseAddContactFormParams) => {
    const [npub, setNpub] = useState('');
    const [name, setName] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [step, setStep] = useState<AddContactStep>('editing');
    const [error, setError] = useState<ContactsError>();
    const { dispatch } = useServices(injectDispatch);

    const npubResult = parseNpub(npub);
    const nameResult = validateContactName(name);
    // Show field errors only once the user typed something or tried to submit.
    const npubError = (isSubmitted || npub !== '') && !npubResult.success;
    const nameError =
        (isSubmitted || name !== '') && !nameResult.success ? nameResult.error : undefined;

    const submit = async () => {
        setIsSubmitted(true);

        if (!npubResult.success || !nameResult.success) {
            return;
        }

        setError(undefined);
        setStep('confirming');
        const result = await dispatch(addContactThunk({ npub, name })).unwrap();

        if (!result.success) {
            setError(result.error);
            setStep('editing');

            return;
        }

        if (result.payload === 'queued') {
            setStep('queued');

            return;
        }

        onAdded();
    };

    return {
        npub,
        setNpub,
        name,
        setName,
        npubError,
        nameError,
        canonicalNpub: npubResult.success ? npubResult.payload : undefined,
        step,
        error,
        submit,
    };
};
