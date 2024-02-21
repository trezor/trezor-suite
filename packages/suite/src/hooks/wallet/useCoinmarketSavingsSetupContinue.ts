import { useCallback, useEffect } from 'react';
import type {
    SavingsSetupContinueFormState,
    SavingsSetupContinueContextValues,
    UseSavingsSetupContinueProps,
} from 'src/types/wallet/coinmarketSavingsSetupContinue';
import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CustomPaymentAmountKey } from 'src/constants/wallet/coinmarket/savings';
import { saveSavingsTradeResponse } from 'src/actions/wallet/coinmarketSavingsActions';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { isPolling } from 'src/actions/wallet/pollingActions';
import {
    calculateAnnualSavings,
    getFiatAmountEffective,
    getPaymentFrequencyOptions,
} from 'src/utils/wallet/coinmarket/savingsUtils';
import { SavingsTrade } from 'invity-api';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export const useSavingsSetupContinue = ({
    selectedAccount,
}: UseSavingsSetupContinueProps): SavingsSetupContinueContextValues => {
    const { account } = selectedAccount;
    const {
        isSavingsTradeLoading,
        isWatchingKYCStatus,
        kycFinalStatus,
        savingsInfo,
        savingsTrade,
        selectedProvider,
    } = useSelector(state => state.wallet.coinmarket.savings);
    const dispatch = useDispatch();

    const { navigateToSavingsPaymentInfo, navigateToSavingsOverview } =
        useCoinmarketNavigation(account);

    const { removeDraft } = useFormDraft('coinmarket-savings-setup-request');

    const pollingKey = `coinmarket-savings-trade/${account.descriptor}` as const;
    const isSavingsTradeLoadingEffective =
        (!savingsInfo?.savingsList?.providers || isSavingsTradeLoading) &&
        !dispatch(isPolling(pollingKey));

    useEffect(() => {
        dispatch(loadInvityData());
        removeDraft(account.descriptor);
    }, [account.descriptor, dispatch, removeDraft]);

    // NOTE: There is only one fiat currency per provider.
    const fiatCurrency = selectedProvider?.tradedFiatCurrencies[0];
    const fiatRateKey = getFiatRateKey(
        account.symbol,
        fiatCurrency?.toLowerCase() as FiatCurrencyCode,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));
    const { address: unusedAddress } = getUnusedAddressFromAccount(account);

    const paymentFrequencyOptions = getPaymentFrequencyOptions(selectedProvider);

    const paymentAmounts =
        selectedProvider?.setupPaymentAmounts.concat(CustomPaymentAmountKey) ?? [];

    const methods = useForm<SavingsSetupContinueFormState>({
        mode: 'onChange',
    });
    const { register, control, formState, setValue, reset } = methods;

    const { isValid, isSubmitting } = formState;
    const { fiatAmount, paymentFrequency, customFiatAmount, address } =
        useWatch<SavingsSetupContinueFormState>({
            control,
        });

    useEffect(() => {
        if (savingsTrade && selectedProvider) {
            let fiatAmount =
                savingsTrade.fiatStringAmount || selectedProvider.defaultPaymentAmount.toString();
            if (fiatAmount && !selectedProvider.setupPaymentAmounts.includes(fiatAmount)) {
                fiatAmount = CustomPaymentAmountKey;
            }

            reset({
                fiatAmount,
                paymentFrequency:
                    savingsTrade.paymentFrequency || selectedProvider.defaultPaymentFrequency,
                customFiatAmount: savingsTrade.fiatStringAmount || '',
                address: savingsTrade.receivingCryptoAddresses?.[0] || unusedAddress,
            });
        }
    }, [unusedAddress, reset, savingsTrade, selectedProvider]);

    // NOTE: Reset input and value for custom amount.
    useEffect(() => {
        if (fiatAmount !== CustomPaymentAmountKey && !!customFiatAmount) {
            reset({
                fiatAmount,
                paymentFrequency,
                customFiatAmount: '',
                address,
            });
        }
    }, [address, customFiatAmount, fiatAmount, paymentFrequency, reset]);

    useEffect(() => {
        if (!isWatchingKYCStatus && !address) {
            setValue('address', unusedAddress);
        }
    }, [isWatchingKYCStatus, address, setValue, unusedAddress]);

    const { annualSavingsCryptoAmount, annualSavingsFiatAmount } = calculateAnnualSavings(
        paymentFrequency,
        fiatAmount,
        customFiatAmount,
        fiatRate?.rate,
    );

    const onSubmit = useCallback(
        async ({
            customFiatAmount,
            fiatAmount,
            paymentFrequency,
        }: SavingsSetupContinueFormState) => {
            if (savingsTrade && address) {
                const trade: SavingsTrade = {
                    ...savingsTrade,
                    // User can navigate back to setup page and change already active plan. Thus we need to set the status back also.
                    status: 'SetSavingsParameters',
                    paymentFrequency,
                    fiatStringAmount: getFiatAmountEffective(fiatAmount, customFiatAmount),
                    receivingCryptoAddresses: [address],
                };
                const response = await invityAPI.doSavingsTrade({
                    trade,
                });

                if (response) {
                    dispatch(saveSavingsTradeResponse(response));
                    switch (response.trade?.status) {
                        case 'ConfirmPaymentInfo':
                            navigateToSavingsPaymentInfo();
                            break;
                        case 'Active':
                            navigateToSavingsOverview();
                            break;
                        default:
                            break;
                    }
                }
            }
        },
        [address, dispatch, navigateToSavingsOverview, navigateToSavingsPaymentInfo, savingsTrade],
    );

    const canConfirmSetup =
        !!paymentFrequency &&
        !!fiatAmount &&
        (fiatAmount !== CustomPaymentAmountKey || !!customFiatAmount) &&
        isValid &&
        !isSubmitting &&
        (!kycFinalStatus || !['Failed', 'Error'].includes(kycFinalStatus));

    const showReceivingAddressChangePaymentInfoLabel =
        !!selectedProvider?.flow.paymentInfo.showReceivingAddressChangePaymentInfo &&
        !!savingsTrade?.receivingCryptoAddresses &&
        savingsTrade.receivingCryptoAddresses.length > 0;

    return {
        ...methods,
        register,
        onSubmit,
        annualSavingsCryptoAmount,
        annualSavingsFiatAmount,
        fiatAmount,
        fiatCurrency,
        isWatchingKYCStatus,
        canConfirmSetup,
        account,
        address,
        isSubmitting,
        paymentFrequencyOptions,
        paymentAmounts,
        minimumPaymentAmountLimit: selectedProvider?.minimumPaymentAmountLimit,
        maximumPaymentAmountLimit: selectedProvider?.maximumPaymentAmountLimit,
        isSavingsTradeLoading: isSavingsTradeLoadingEffective,
        savingsTrade,
        kycFinalStatus,
        selectedProviderName: selectedProvider?.companyName,
        showReceivingAddressChangePaymentInfoLabel,
    };
};
