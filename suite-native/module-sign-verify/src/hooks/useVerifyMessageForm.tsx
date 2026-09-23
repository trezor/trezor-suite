import { useState } from 'react';

import {
    MAX_LENGTH_MESSAGE,
    MAX_LENGTH_SIGNATURE,
    type VerifyMessageResult,
} from '@suite-common/sign-verify';
import { yup } from '@suite-common/validators';
import { type Account } from '@suite-common/wallet-types';
import { useForm } from '@suite-native/forms';

import { useVerifyMessage } from './useVerifyMessage';

type FormValues = {
    address: string;
    message: string;
    signature: string;
};

export const useVerifyMessageForm = (account: Account) => {
    const verifyMessage = useVerifyMessage();

    const [result, setResult] = useState<VerifyMessageResult>();

    const form = useForm<FormValues>({
        validation: yup.object({
            address: yup.string().required(),
            message: yup.string().required().max(MAX_LENGTH_MESSAGE),
            signature: yup.string().required().max(MAX_LENGTH_SIGNATURE),
        }),
        defaultValues: {
            address: '',
            message: '',
            signature: '',
        },
        mode: 'onSubmit',
    });

    const submit = form.handleSubmit(async values =>
        setResult(await verifyMessage({ account, ...values })),
    );

    const clear = () => {
        form.reset();
        setResult(undefined);
    };

    return {
        hookForm: form,
        submit,
        clear,
        isVerified: result === 'verified',
        isFailed: result === 'failed',
    };
};

export type VerifyMessageForm = ReturnType<typeof useVerifyMessageForm>;
