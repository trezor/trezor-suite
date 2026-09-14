import { type ReactNode, useEffect, useRef } from 'react';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';

import { useSendForm } from '../hooks/useSendForm';
import { getOutputFieldName } from '../utils';

type SendFormProviderProps = {
    accountKey: AccountKey;
    children: ReactNode;
    initialAddress?: string;
    initialAmount?: string;
    tokenContract?: TokenAddress;
};

export const SendFormProvider = ({
    accountKey,
    children,
    initialAddress,
    initialAmount,
    tokenContract,
}: SendFormProviderProps) => {
    const sendForm = useSendForm(accountKey, tokenContract);
    const initialValuesApplied = useRef(false);

    useEffect(() => {
        if (initialValuesApplied.current || !sendForm) return;

        initialValuesApplied.current = true;
        if (initialAddress) {
            sendForm.form.setValue(getOutputFieldName(0, 'address'), initialAddress, {
                shouldValidate: true,
            });
        }
        if (initialAmount) {
            sendForm.form.setValue(getOutputFieldName(0, 'amount'), initialAmount, {
                shouldValidate: true,
            });
        }
    }, [sendForm, initialAddress, initialAmount]);

    if (!sendForm) return null;

    const { form } = sendForm;

    return <Form form={form}>{children}</Form>;
};
