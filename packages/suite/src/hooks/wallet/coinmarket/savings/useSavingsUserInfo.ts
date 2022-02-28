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
    const { accountSettings, country } = useSelector(state => ({
        accountSettings: state.wallet.coinmarket.invityAuthentication?.accountInfo?.settings,
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
        item =>
            (accountSettings?.phoneNumberPrefix &&
                item.label.endsWith(accountSettings?.phoneNumberPrefix)) ||
            item.value === selectedCountryCode,
    );

    const methods = useForm<SavingsUserInfoFormState>({
        mode: 'onChange',
        defaultValues: {
            givenName: accountSettings?.givenName,
            familyName: accountSettings?.familyName,
            phoneNumber: accountSettings?.phoneNumber?.replace(
                regional.getPhoneNumberPrefixByCountryCode(selectedCountryCode) || '',
                '',
            ),
            phoneNumberPrefixCountryOption: defaultPhoneNumberPrefixCountryOption,
        },
    });

    const { register, control, trigger, formState } = methods;
    const { isDirty } = formState;
    const { phoneNumberPrefixCountryOption } = useWatch<SavingsUserInfoFormState>({
        control,
        defaultValue: {
            phoneNumberPrefixCountryOption: defaultPhoneNumberPrefixCountryOption,
        },
    });

    useEffect(() => {
        if (phoneNumberPrefixCountryOption && isDirty) {
            trigger('phoneNumber');
        }
    }, [phoneNumberPrefixCountryOption, trigger, isDirty]);

    const onSubmit = async ({
        familyName,
        givenName,
        phoneNumber,
        phoneNumberPrefixCountryOption,
    }: SavingsUserInfoFormState) => {
        if (accountSettings) {
            const phoneNumberPrefix = regional.getPhoneNumberPrefixByCountryCode(
                phoneNumberPrefixCountryOption.value,
            );
            const response = await invityAPI.saveAccountSettings({
                ...accountSettings,
                familyName,
                givenName,
                phoneNumberPrefix,
                // trim all white spaces
                phoneNumber: phoneNumber.replace(/\s+/g, ''),
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
        phoneNumberPrefixCountryOption: phoneNumberPrefixCountryOption as Option,
    };
};
