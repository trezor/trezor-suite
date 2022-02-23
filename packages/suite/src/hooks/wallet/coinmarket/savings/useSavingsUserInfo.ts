import { createContext, useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type {
    SavingsUserInfoFormState,
    SavingsUserInfoContextValues,
    UseSavingsUserInfoProps,
} from '@wallet-types/coinmarket/savings/userInfo';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions, useSelector } from '@suite-hooks';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import type { SavingsUnsupportedCountryFormState } from '@suite/types/wallet/coinmarket/savings/unsupportedCountry';
import type { Option } from '@wallet-types/coinmarketCommonTypes';
import regional from '@suite/constants/wallet/coinmarket/regional';

export const SavingsUserInfoContext = createContext<SavingsUserInfoContextValues | null>(null);
SavingsUserInfoContext.displayName = 'SavingsUserInfoContext';

export const useSavingsUserInfo = ({
    selectedAccount,
}: UseSavingsUserInfoProps): SavingsUserInfoContextValues => {
    const { invityAuthentication, country } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        country: state.wallet.coinmarket.savings.savingsInfo?.country,
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

    const { getDraft } = useFormDraft<SavingsUnsupportedCountryFormState>(
        'coinmarket-savings-unsupported-country',
    );
    const unsupportedCountryFormDraft = getDraft(selectedAccount.account.descriptor);
    const selectedCountryCode = unsupportedCountryFormDraft?.country || country;
    const defaultPhoneNumberPrefixCountryOption = regional.countriesPhoneNumberPrefixOptions.find(
        item => item.value === selectedCountryCode,
    );

    const methods = useForm<SavingsUserInfoFormState>({
        mode: 'onChange',
        defaultValues: {
            phoneNumberPrefixCountryOption: defaultPhoneNumberPrefixCountryOption,
        },
    });

    const { register, control } = methods;
    const values = useWatch<SavingsUserInfoFormState>({
        control,
        defaultValue: {
            phoneNumberPrefixCountryOption: defaultPhoneNumberPrefixCountryOption,
        },
    });

    const onSubmit = async ({
        familyName,
        givenName,
        phoneNumber,
        phoneNumberPrefixCountryOption,
    }: SavingsUserInfoFormState) => {
        if (invityAuthentication?.accountInfo?.settings) {
            const phoneNumerPrefix = regional.getPhoneNumberPrefixByCountryCode(
                phoneNumberPrefixCountryOption.value,
            );
            const phoneNumberEffective = `${phoneNumerPrefix}${phoneNumber}`;
            const response = await invityAPI.saveAccountSettings({
                ...invityAuthentication.accountInfo.settings,
                familyName,
                givenName,
                phoneNumber: phoneNumberEffective,
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
        phoneNumberPrefixCountryOption: values.phoneNumberPrefixCountryOption as Option,
    };
};
