import { useCallback, useEffect } from 'react';
import type {
    SavingsSetupFormState,
    SavingsSetupContextValues,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarketSavingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import invityAPI, { InitSavingsTradeRequest } from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import {
    CustomPaymentAmountKey,
    SavingsTradePollingIntervalMilliseconds,
    SavingsTradePollingMaxCount,
} from '@wallet-constants/coinmarket/savings';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as pollingActions from '@wallet-actions/pollingActions';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import regional from '@wallet-constants/coinmarket/regional';
import {
    calculateAnnualSavings,
    getPaymentFrequencyOptions,
    createReturnLink,
} from '@wallet-utils/coinmarket/savingsUtils';
import { isDesktop } from '@suite-utils/env';
import { useFormDraft } from '@wallet-hooks/useFormDraft';

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
    } = useSelector(state => ({
        fiat: state.wallet.fiat,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        supportedCountries: state.wallet.coinmarket.savings.savingsInfo?.supportedCountries,
        providers: state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
        userCountry: state.wallet.coinmarket.savings.savingsInfo?.country?.toUpperCase(),
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        isSavingsTradeLoading: state.wallet.coinmarket.savings.isSavingsTradeLoading,
    }));

    const isSavingsTradeLoadingEffective = !providers || isSavingsTradeLoading;
    const noProviders = !providers || providers.length === 0;

    const {
        submitRequestForm,
        setSelectedProvider,
        loadSavingsTrade,
        loadInvityData,
        openCoinmarketSavingsConfirmModal,
        startPolling,
    } = useActions({
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        loadInvityData: coinmarketCommonActions.loadInvityData,
        setSelectedProvider: coinmarketSavingsActions.setSelectedProvider,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
        openCoinmarketSavingsConfirmModal:
            coinmarketSavingsActions.openCoinmarketSavingsConfirmModal,
        startPolling: pollingActions.startPolling,
    });

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
                    if (savingsTrade.kycStatus === 'Failed') {
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
    const { register, control, formState, setValue, reset } = methods;

    const defaultCountryOption = regional.countriesOptions.find(
        option => option.value === userCountry,
    ) as CountryOption;

    const { isValid, isSubmitting } = formState;
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
            setSelectedProvider(provider);
            if (provider) {
                if (!fiatAmount) {
                    setValue('fiatAmount', provider.defaultPaymentAmount.toString());
                }
                if (!paymentFrequency) {
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

    const { saveDraft } = useFormDraft('coinmarket-savings-setup-request');

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
                const result = await openCoinmarketSavingsConfirmModal(
                    selectedProvider.companyName,
                );
                if (result) {
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
                        submitRequestForm(formResponse.form);

                        if (isDesktop()) {
                            // NOTE: Suite Desktop application might be still open -> start polling savings trade,
                            // so the user sees refreshed UI after successful completion of savings flow on Invity.io page,
                            // and show screen "Waiting for completion on Invity.io web page.".
                            const pollingKey =
                                `coinmarket-savings-trade/${account.descriptor}` as const;
                            startPolling(
                                pollingKey,
                                () => loadSavingsTrade(),
                                SavingsTradePollingIntervalMilliseconds,
                                SavingsTradePollingMaxCount,
                            );
                            navigateToSavingsSetupWaiting();
                        }
                    }
                } else {
                    reset(formValues);
                }
            }
        },
        [
            account.descriptor,
            account.symbol,
            loadSavingsTrade,
            navigateToSavingsSetupWaiting,
            openCoinmarketSavingsConfirmModal,
            reset,
            saveDraft,
            selectedProvider,
            startPolling,
            submitRequestForm,
        ],
    );

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const canConfirmSetup =
        !!paymentFrequency &&
        !!fiatAmount &&
        (fiatAmount !== CustomPaymentAmountKey || !!customFiatAmount) &&
        isValid &&
        !isSubmitting;

    return {
        ...methods,
        account,
        register: typedRegister,
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
