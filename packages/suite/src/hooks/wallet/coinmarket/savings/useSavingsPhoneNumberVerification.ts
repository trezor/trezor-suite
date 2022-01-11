import { createContext, useCallback } from 'react';
import {
    SavingsPhoneNumberVerificationFormState,
    SavingsPhoneNumberVerificationContextValues,
} from '@wallet-types/coinmarket/savings/phoneNumberVerification';
import { useForm } from 'react-hook-form';
import invityAPI from '@suite-services/invityAPI';
import { useCoinmarketNavigation } from '../../useCoinmarketNavigation';
import { SavingsSelectedAccount } from '@wallet-types/coinmarket/savings';

export const SavingsPhoneNumberVerificationContext =
    createContext<SavingsPhoneNumberVerificationContextValues | null>(null);
SavingsPhoneNumberVerificationContext.displayName = 'SavingsPhoneNumberVerificationContext';

export const useSavingsPhoneNumberVerification = (
    selectedAccount: SavingsSelectedAccount,
): SavingsPhoneNumberVerificationContextValues => {
    const { navigateToSavingsKYCStart } = useCoinmarketNavigation(selectedAccount.account);
    const methods = useForm<SavingsPhoneNumberVerificationFormState>({
        mode: 'onChange',
    });
    const { register } = methods;

    const onSubmit = async () => {
        const { code } = methods.getValues();
        const response = await invityAPI.verifySmsCode(code);
        if (response) {
            if (response.status === 'Verified') {
                navigateToSavingsKYCStart();
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
