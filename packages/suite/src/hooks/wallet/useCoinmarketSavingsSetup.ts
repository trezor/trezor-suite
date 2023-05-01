import { useCallback, useEffect } from 'react';
import type {
    SavingsSetupContextValues,
    SavingsSetupFormState,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarketSavingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import { InitSavingsTradeRequest } from 'invity-api';
import invityAPI, { SavingsTradeKYCFinalStatuses } from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { CustomPaymentAmountKey } from '@wallet-constants/coinmarket/savings';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as pollingActions from '@wallet-actions/pollingActions';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import regional from '@wallet-constants/coinmarket/regional';
import {
    calculateAnnualSavings,
    createReturnLink,
    getPaymentFrequencyOptions,
} from '@wallet-utils/coinmarket/savingsUtils';
import { isDesktop } from '@trezor/env-utils';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import { TypedValidationRules } from '@suite-common/wallet-types';

export const useSavingsSetup = ({
    selectedAccount,
}: UseSavingsSetupProps): SavingsSetupContextValues => {
    const { account } = selectedAccount;
    const {
        fiat,
        selectedProvider,
        providers,
        supportedCountries,
        userCountry,
        savingsTrade,
        isSavingsTradeLoading,
        formDrafts,
    } = useSelector(state => ({
        fiat: state.wallet.fiat,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        supportedCountries: state.wallet.coinmarket.savings.savingsInfo?.supportedCountries,
        providers: state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
        userCountry: state.wallet.coinmarket.savings.savingsInfo?.country?.toUpperCase(),
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        isSavingsTradeLoading: state.wallet.coinmarket.savings.isSavingsTradeLoading,
        formDrafts: state.wallet.formDrafts,
    }));

    const noProviders = !providers || providers.length === 0;

    const {
        submitRequestForm,
        setSelectedProvider,
        loadInvityData,
        openCoinmarketSavingsConfirmModal,
        isPolling,
    } = useActions({
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        loadInvityData: coinmarketCommonActions.loadInvityData,
        setSelectedProvider: coinmarketSavingsActions.setSelectedProvider,
        openCoinmarketSavingsConfirmModal:
            coinmarketSavingsActions.openCoinmarketSavingsConfirmModal,
        isPolling: pollingActions.isPolling,
    });
    const pollingKey = `coinmarket-savings-trade/${account.descriptor}` as const;
    const isSavingsTradeLoadingEffective =
        (!providers || isSavingsTradeLoading) && !isPolling(pollingKey);
    const {
        navigateToSavingsSetupContinue,
        navigateToSavingsOverview,
        navigateToSavingsPaymentInfo,
        navigateToSavingsSetupWaiting,
    } = useCoinmarketNavigation(account);

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    useEffect(() => {
        if (!isSavingsTradeLoadingEffective && savingsTrade) {
            switch (savingsTrade.status) {
                case 'KYC':
                case 'AML':
                    if (
                        savingsTrade.kycStatus &&
                        SavingsTradeKYCFinalStatuses.includes(savingsTrade.kycStatus)
                    ) {
                        navigateToSavingsSetupContinue();
                    } else {
                        navigateToSavingsSetupWaiting();
                    }
                    break;
                case 'SetSavingsParameters':
                    navigateToSavingsSetupContinue();
                    break;
                case 'Active':
                    navigateToSavingsOverview();
                    break;
                case 'ConfirmPaymentInfo':
                    navigateToSavingsPaymentInfo();
                    break;
                default:
                    break;
            }
        }
    }, [
        isSavingsTradeLoadingEffective,
        navigateToSavingsOverview,
        navigateToSavingsPaymentInfo,
        navigateToSavingsSetupContinue,
        navigateToSavingsSetupWaiting,
        savingsTrade,
    ]);

    const fiatRates = fiat.coins.find(item => item.symbol === 'btc');
    // NOTE: There is only one fiat currency per provider.
    const fiatCurrency = selectedProvider?.tradedFiatCurrencies[0];
    const { navigateToBuyForm } = useCoinmarketNavigation(account);

    const paymentFrequencyOptions = getPaymentFrequencyOptions(selectedProvider);

    const paymentAmounts =
        selectedProvider?.setupPaymentAmounts.concat(CustomPaymentAmountKey) ?? [];

    const methods = useForm<SavingsSetupFormState>({
        mode: 'onChange',
    });
    const { register, control, formState, setValue } = methods;

    const defaultCountryOption = regional.countriesOptions.find(
        option => option.value === userCountry,
    ) as CountryOption;

    const { isValid, isSubmitting, isSubmitted } = formState;
    const { fiatAmount, paymentFrequency, customFiatAmount, country } =
        useWatch<SavingsSetupFormState>({
            control,
        });

    const countryEffective = country?.value || userCountry;

    useEffect(() => {
        if (providers && !savingsTrade) {
            const provider = providers.find(provider =>
                provider.supportedCountries.includes(countryEffective || ''),
            );
            if (
                provider &&
                (!fiatAmount || !paymentFrequency || provider.name !== selectedProvider?.name)
            ) {
                setSelectedProvider(provider);
                if (!fiatAmount || !provider.setupPaymentAmounts.includes(fiatAmount)) {
                    setValue('fiatAmount', provider.defaultPaymentAmount.toString());
                }
                if (
                    !paymentFrequency ||
                    !provider.setupPaymentFrequencies.includes(paymentFrequency)
                ) {
                    setValue('paymentFrequency', provider.defaultPaymentFrequency);
                }
            }
        }
    }, [
        countryEffective,
        fiatAmount,
        paymentFrequency,
        providers,
        savingsTrade,
        selectedProvider,
        setSelectedProvider,
        setValue,
    ]);

    const { getDraft, saveDraft, removeDraft } = useFormDraft('coinmarket-savings-setup-request');

    useEffect(() => {
        const requestForm = getDraft(account.descriptor) as Parameters<typeof submitRequestForm>[0];
        if (isDesktop() && requestForm && isSubmitted) {
            submitRequestForm(requestForm);
            navigateToSavingsSetupWaiting();
        }
    }, [
        account.descriptor,
        submitRequestForm,
        navigateToSavingsSetupWaiting,
        formDrafts,
        getDraft,
        isSubmitted,
    ]);

    const { annualSavingsCryptoAmount, annualSavingsFiatAmount } = calculateAnnualSavings(
        paymentFrequency,
        fiatAmount,
        customFiatAmount,
        fiatCurrency,
        fiatRates?.current,
    );

    const onSubmit = useCallback(
        async (formValues: SavingsSetupFormState) => {
            const { customFiatAmount, fiatAmount, paymentFrequency, country } = formValues;
            if (selectedProvider && country) {
                if (await openCoinmarketSavingsConfirmModal(selectedProvider.companyName)) {
                    const savingsParameters: InitSavingsTradeRequest = {
                        amount: customFiatAmount || fiatAmount,
                        exchange: selectedProvider.name,
                        fiatCurrency: selectedProvider.tradedFiatCurrencies[0],
                        paymentFrequency,
                        cryptoCurrency: account.symbol.toUpperCase(),
                        country: country.value,
                        returnUrl: await createReturnLink(),
                    };
                    const formResponse = await invityAPI.initSavingsTrade(savingsParameters);
                    if (formResponse?.form) {
                        // NOTE: Edge case handling: User while on Invity web page, can open Suite.
                        // Suite will redirect the user to "waiting" page where is button,
                        // which leads to Invity web page again in case that user
                        // closed Invity web page before the savings flow was finished.
                        saveDraft(account.descriptor, formResponse.form);
                        if (!isDesktop()) {
                            submitRequestForm(formResponse?.form);
                        }
                    }
                } else {
                    removeDraft(account.descriptor);
                }
            }
        },
        [
            account.descriptor,
            account.symbol,
            openCoinmarketSavingsConfirmModal,
            removeDraft,
            saveDraft,
            selectedProvider,
            submitRequestForm,
        ],
    );

    const canConfirmSetup =
        !!countryEffective &&
        !!paymentFrequency &&
        !!fiatAmount &&
        (fiatAmount !== CustomPaymentAmountKey || !!customFiatAmount) &&
        isValid &&
        !isSubmitting;

    return {
        ...methods,
        account,
        register: register as (rules?: TypedValidationRules) => (ref: any) => void,
        onSubmit,
        defaultPaymentFrequency: selectedProvider?.defaultPaymentFrequency,
        defaultFiatAmount: selectedProvider?.defaultPaymentAmount?.toString(),
        annualSavingsCryptoAmount,
        annualSavingsFiatAmount,
        fiatAmount,
        fiatCurrency,
        canConfirmSetup,
        isSubmitting,
        paymentFrequencyOptions,
        paymentAmounts,
        minimumPaymentAmountLimit: selectedProvider?.minimumPaymentAmountLimit,
        maximumPaymentAmountLimit: selectedProvider?.maximumPaymentAmountLimit,
        supportedCountries,
        isProviderSelected: !!selectedProvider,
        handleOneTimeBuyLinkButtonClick: navigateToBuyForm,
        isSavingsTradeLoading: isSavingsTradeLoadingEffective,
        noProviders,
        userCountry,
        defaultCountryOption,
    };
};
