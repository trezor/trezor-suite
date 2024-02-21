import { useCallback, useEffect } from 'react';
import type {
    SavingsSetupContextValues,
    SavingsSetupFormState,
    UseSavingsSetupProps,
} from 'src/types/wallet/coinmarketSavingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import { InitSavingsTradeRequest } from 'invity-api';
import invityAPI, { SavingsTradeKYCFinalStatuses } from 'src/services/suite/invityAPI';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { CustomPaymentAmountKey } from 'src/constants/wallet/coinmarket/savings';
import {
    openCoinmarketSavingsConfirmModal,
    setSelectedProvider,
} from 'src/actions/wallet/coinmarketSavingsActions';
import {
    loadInvityData,
    submitRequestForm,
} from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { isPolling } from 'src/actions/wallet/pollingActions';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import regional from 'src/constants/wallet/coinmarket/regional';
import {
    calculateAnnualSavings,
    createReturnLink,
    getPaymentFrequencyOptions,
} from 'src/utils/wallet/coinmarket/savingsUtils';
import { isDesktop } from '@trezor/env-utils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export const useSavingsSetup = ({
    selectedAccount,
}: UseSavingsSetupProps): SavingsSetupContextValues => {
    const { account } = selectedAccount;
    const selectedProvider = useSelector(state => state.wallet.coinmarket.savings.selectedProvider);
    const supportedCountries = useSelector(
        state => state.wallet.coinmarket.savings.savingsInfo?.supportedCountries,
    );
    const providers = useSelector(
        state => state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    );
    const userCountry = useSelector(state =>
        state.wallet.coinmarket.savings.savingsInfo?.country?.toUpperCase(),
    );
    const savingsTrade = useSelector(state => state.wallet.coinmarket.savings.savingsTrade);
    const isSavingsTradeLoading = useSelector(
        state => state.wallet.coinmarket.savings.isSavingsTradeLoading,
    );
    const formDrafts = useSelector(state => state.wallet.formDrafts);
    const dispatch = useDispatch();

    const noProviders = !providers || providers.length === 0;

    const pollingKey = `coinmarket-savings-trade/${account.descriptor}` as const;
    const isSavingsTradeLoadingEffective =
        (!providers || isSavingsTradeLoading) && !dispatch(isPolling(pollingKey));
    const {
        navigateToSavingsSetupContinue,
        navigateToSavingsOverview,
        navigateToSavingsPaymentInfo,
        navigateToSavingsSetupWaiting,
    } = useCoinmarketNavigation(account);

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);

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

    // NOTE: There is only one fiat currency per provider.
    const fiatCurrency = selectedProvider?.tradedFiatCurrencies[0];
    const fiatRateKey = getFiatRateKey('btc', fiatCurrency?.toLowerCase() as FiatCurrencyCode);
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));
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
                dispatch(setSelectedProvider(provider));
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
        dispatch,
        fiatAmount,
        paymentFrequency,
        providers,
        savingsTrade,
        selectedProvider,
        setValue,
    ]);

    const { getDraft, saveDraft, removeDraft } = useFormDraft('coinmarket-savings-setup-request');

    useEffect(() => {
        const requestForm = getDraft(account.descriptor) as Parameters<typeof submitRequestForm>[0];
        if (isDesktop() && requestForm && isSubmitted) {
            dispatch(submitRequestForm(requestForm));
            navigateToSavingsSetupWaiting();
        }
    }, [
        account.descriptor,
        dispatch,
        navigateToSavingsSetupWaiting,
        formDrafts,
        getDraft,
        isSubmitted,
    ]);

    const { annualSavingsCryptoAmount, annualSavingsFiatAmount } = calculateAnnualSavings(
        paymentFrequency,
        fiatAmount,
        customFiatAmount,
        fiatRate?.rate,
    );

    const onSubmit = useCallback(
        async (formValues: SavingsSetupFormState) => {
            const { customFiatAmount, fiatAmount, paymentFrequency, country } = formValues;
            if (selectedProvider && country) {
                if (
                    await dispatch(openCoinmarketSavingsConfirmModal(selectedProvider.companyName))
                ) {
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
                            dispatch(submitRequestForm(formResponse?.form));
                        }
                    }
                } else {
                    removeDraft(account.descriptor);
                }
            }
        },
        [account.descriptor, account.symbol, dispatch, removeDraft, saveDraft, selectedProvider],
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
        register,
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
