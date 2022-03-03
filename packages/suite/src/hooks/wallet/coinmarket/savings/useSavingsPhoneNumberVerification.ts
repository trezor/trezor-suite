import { createContext, useCallback, useContext, useEffect } from 'react';
import {
    SavingsPhoneNumberVerificationFieldValues,
    SavingsPhoneNumberVerificationContextValues,
    UseSavingsPhoneNumberVerificationProps,
} from '@wallet-types/coinmarket/savings/phoneNumberVerification';
import { useForm } from 'react-hook-form';
import invityAPI from '@suite-services/invityAPI';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions, useSelector } from '@suite-hooks';

export const SavingsPhoneNumberVerificationContext =
    createContext<SavingsPhoneNumberVerificationContextValues | null>(null);
SavingsPhoneNumberVerificationContext.displayName = 'SavingsPhoneNumberVerificationContext';

export const useSavingsPhoneNumberVerification = ({
    selectedAccount,
}: UseSavingsPhoneNumberVerificationProps): SavingsPhoneNumberVerificationContextValues => {
    const { phoneNumberPrefix, phoneNumber } = useSelector(state => ({
        phoneNumberPrefix:
            state.wallet.coinmarket.invityAuthentication?.accountInfo?.settings?.phoneNumberPrefix,
        phoneNumber:
            state.wallet.coinmarket.invityAuthentication?.accountInfo?.settings?.phoneNumber,
    }));
    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { navigateToInvityKYCStart, navigateToInvityUserInfo } = useInvityNavigation(
        selectedAccount.account,
    );
    const methods = useForm<SavingsPhoneNumberVerificationFieldValues>({
        mode: 'onChange',
    });
    const { register, setError, clearErrors, reset, errors } = methods;

    const onSubmit = async (fieldValues: SavingsPhoneNumberVerificationFieldValues) => {
        clearErrors();
        const code = Object.values(fieldValues).join('');
        const response = await invityAPI.verifySmsCode(code);
        if (response) {
            // TODO: Conditions has to be based on errorCode instead of error.
            if (
                response.status === 'Verified' ||
                response.error === 'Account phone number already verified.'
            ) {
                navigateToInvityKYCStart();
                return;
            }
            if (response.error === 'Verification code is invalid.') {
                setError('codeDigitIndex0', {
                    message: 'TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_IS_INVALID',
                });
                reset(fieldValues, {
                    errors: true,
                });
            }
        } else {
            setError('codeDigitIndex0', {
                message: 'TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_ERROR',
            });
            reset(fieldValues, {
                errors: true,
            });
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);
    const error = Object.values(errors).find(error => error.message);
    const handlePhoneNumberChange = useCallback(() => {
        navigateToInvityUserInfo();
    }, [navigateToInvityUserInfo]);

    return {
        ...methods,
        register: typedRegister,
        error,
        onSubmit,
        phoneNumber: `${phoneNumberPrefix} ${phoneNumber}`,
        handlePhoneNumberChange,
    };
};

export const useSavingsPhoneNumberVerificationContext = () => {
    const context = useContext(SavingsPhoneNumberVerificationContext);
    if (context === null) throw Error('SavingsPhoneNumberVerificationContext used without Context');
    return context;
};
