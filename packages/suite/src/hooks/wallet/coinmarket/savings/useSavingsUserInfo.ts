import { createContext, useCallback, useEffect } from 'react';
import {
    SavingsUserInfoFormState,
    SavingsUserInfoContextValues,
    UseSavingsUserInfoProps,
} from '@wallet-types/coinmarket/savings/userInfo';
import { useForm } from 'react-hook-form';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions, useSelector } from '@suite-hooks';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';

export const SavingsUserInfoContext = createContext<SavingsUserInfoContextValues | null>(null);
SavingsUserInfoContext.displayName = 'SavingsUserInfoContext';

export const useSavingsUserInfo = ({
    selectedAccount,
}: UseSavingsUserInfoProps): SavingsUserInfoContextValues => {
    const { invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    const { navigateToInvityPhoneNumberVerification } = useInvityNavigation(
        selectedAccount.account,
    );

    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const methods = useForm<SavingsUserInfoFormState>({
        mode: 'onChange',
    });
    const { register } = methods;

    const onSubmit = async () => {
        if (invityAuthentication?.accountInfo?.settings) {
            const { familyName, givenName, phoneNumber } = methods.getValues();
            const response = await invityAPI.saveAccountSettings({
                ...invityAuthentication.accountInfo.settings,
                familyName,
                givenName,
                phoneNumber,
            });
            if (!response?.error) {
                const sendVerificationSmsResponse = await invityAPI.sendVerificationSms();
                if (sendVerificationSmsResponse?.status === 'SmsQueued') {
                    navigateToInvityPhoneNumberVerification();
                } else {
                    // TODO: stay and show error
                }
            }
        }
    };

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
    };
};
