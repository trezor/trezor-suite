import { createContext, useCallback } from 'react';
import {
    SavingsPhoneNumberVerificationFormState,
    SavingsPhoneNumberVerificationContextValues,
} from '@wallet-types/coinmarket/savings/phoneNumberVerification';
import { useForm } from 'react-hook-form';
import invityAPI from '@suite-services/invityAPI';

export const SavingsPhoneNumberVerificationContext =
    createContext<SavingsPhoneNumberVerificationContextValues | null>(null);
SavingsPhoneNumberVerificationContext.displayName = 'SavingsPhoneNumberVerificationContext';

export const useSavingsKYCStart = (): SavingsPhoneNumberVerificationContextValues => {
    const methods = useForm<SavingsPhoneNumberVerificationFormState>({
        mode: 'onChange',
    });
    const { register } = methods;

    const onSubmit = async () => {
        const { code } = methods.getValues();
        const response = await invityAPI.verifySmsCode(code);
        if (response) {
            if (response.status === 'Verified') {
                // TODO: show "upload KYC documents" component
            } else {
                // TODO: show validation error from API server or translation
            }
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
    };
};
