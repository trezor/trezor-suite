import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { ExchangeTradeQuoteRequest } from 'invity-api';
import { isChanged } from 'src/utils/suite/comparisonUtils';
import { useActions, useSelector, useTranslation } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    amountToSatoshi,
    toFiatCurrency,
    formatAmount,
    fromFiatCurrency,
    getFeeLevels,
} from '@suite-common/wallet-utils';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    ExchangeFormState,
    AmountLimits,
    ExchangeFormContextValues,
    CRYPTO_INPUT,
    FIAT_INPUT,
    FIAT_CURRENCY,
    UseCoinmarketExchangeFormProps,
} from 'src/types/wallet/coinmarketExchangeForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { getAmountLimits, splitToQuoteCategories } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import useDebounce from 'react-use/lib/useDebounce';
import { useCoinmarketExchangeFormDefaultValues } from './useCoinmarketExchangeFormDefaultValues';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import type { AppState } from 'src/types/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useDidUpdate } from '@trezor/react-utils';
import { SuiteUseFormRegister } from '@suite-common/wallet-types';

export const ExchangeFormContext = createContext<ExchangeFormContextValues | null>(null);
ExchangeFormContext.displayName = 'CoinmarketExchangeContext';

const useExchangeState = (
    selectedAccount: UseCoinmarketExchangeFormProps['selectedAccount'],
    fees: AppState['wallet']['fees'],
    currentState: boolean,
    defaultFormValues?: ExchangeFormState,
) => {
    // do not calculate if currentState is already set (prevent re-renders)
    if (selectedAccount.status !== 'loaded' || currentState) return;

    const { account, network } = selectedAccount;
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

    return {
        account,
        network,
        feeInfo,
        formValues: defaultFormValues,
    };
};

export const useCoinmarketExchangeForm = ({
    selectedAccount,
}: UseCoinmarketExchangeFormProps): ExchangeFormContextValues => {
    const {
        saveQuoteRequest,
        saveQuotes,
        clearQuotes,
        saveTrade,
        saveComposedTransactionInfo,
        loadInvityData,
    } = useActions({
        saveQuoteRequest: coinmarketExchangeActions.saveQuoteRequest,
        saveQuotes: coinmarketExchangeActions.saveQuotes,
        clearQuotes: coinmarketExchangeActions.clearQuotes,
        saveTrade: coinmarketExchangeActions.saveTrade,
        saveComposedTransactionInfo: coinmarketCommonActions.saveComposedTransactionInfo,
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const [state, setState] = useState<ReturnType<typeof useExchangeState>>(undefined);

    const {
        accounts,
        exchangeInfo,
        quotesRequest,
        exchangeCoinInfo,
        fiat,
        device,
        localCurrency,
        fees,
    } = useSelector(state => ({
        accounts: state.wallet.accounts,
        exchangeInfo: state.wallet.coinmarket.exchange.exchangeInfo,
        quotesRequest: state.wallet.coinmarket.exchange.quotesRequest,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
        fiat: state.wallet.fiat,
        device: state.suite.device,
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
    }));

    const { account, network } = selectedAccount;
    const { navigateToExchangeOffers } = useCoinmarketNavigation(account);
    const { symbol, networkType } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);

    const { getDraft, saveDraft, removeDraft } =
        useFormDraft<ExchangeFormState>('coinmarket-exchange');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { defaultCurrency, defaultValues } = useCoinmarketExchangeFormDefaultValues(
        account.symbol,
        localCurrency,
        exchangeInfo,
        state?.formValues?.outputs[0].address,
    );

    // throttle initial state calculation
    const initState = useExchangeState(selectedAccount, fees, !!state, defaultValues);
    useEffect(() => {
        const setStateAsync = async (initState: ReturnType<typeof useExchangeState>) => {
            const address = await getComposeAddressPlaceholder(account, network, device, accounts);
            if (initState?.formValues && address) {
                initState.formValues.outputs[0].address = address;
                setState(initState);
            }
        };

        if (!state && initState) {
            setStateAsync(initState);
        }
    }, [state, initState, account, network, device, accounts]);

    const methods = useForm({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });
    const { reset, register, setValue, getValues, setError, clearErrors, formState, control } =
        methods;

    const values = useWatch({ control });

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0
            ) {
                saveDraft(account.key, values as ExchangeFormState);
            }
        },
        200,
        [
            saveDraft,
            account.key,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
        ],
    );

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('setMaxOutputId');
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, isDraft, defaultValues]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useCompose({
        ...methods,
        state,
    });

    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);

    const { translationString } = useTranslation();

    const updateFiatValue = useCallback(
        (amount: string) => {
            const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);
            if (!fiatRates || !fiatRates.current || !currency) return;
            const cryptoAmount =
                amount && shouldSendInSats ? formatAmount(amount, network.decimals) : amount;
            const fiatValue = toFiatCurrency(cryptoAmount, currency.value, fiatRates.current.rates);
            setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
        },
        [shouldSendInSats, fiatRates, getValues, network.decimals, setValue],
    );

    const updateFiatCurrency = (currency: { label: string; value: string }) => {
        if (!fiatRates || !fiatRates.current || !currency) return;
        const amount = getValues(CRYPTO_INPUT) as string;
        const cryptoAmount =
            amount && shouldSendInSats ? formatAmount(amount, network.decimals) : amount;
        const fiatValue = toFiatCurrency(cryptoAmount, currency.value, fiatRates.current.rates);
        if (fiatValue) {
            setValue(FIAT_INPUT, fiatValue, { shouldValidate: true });
        }
    };

    const updateSendCryptoValue = (amount: string, decimals: number) => {
        const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);
        if (!fiatRates || !fiatRates.current || !currency) return;
        const cryptoValue = fromFiatCurrency(
            amount,
            currency.value,
            fiatRates.current.rates,
            decimals,
        );
        const formattedCryptoValue =
            cryptoValue && shouldSendInSats
                ? amountToSatoshi(cryptoValue, network.decimals)
                : cryptoValue || '';

        setValue(CRYPTO_INPUT, formattedCryptoValue, { shouldValidate: true });
    };

    const isLoading =
        !exchangeInfo?.exchangeList ||
        exchangeInfo?.exchangeList.length === 0 ||
        !state?.formValues?.outputs[0].address;

    const noProviders =
        exchangeInfo?.exchangeList?.length === 0 || !exchangeInfo?.sellSymbols.has(account.symbol);

    // sub-hook, FeeLevels handler
    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];
        if (!composed) return;

        if (composed.type === 'error' && composed.errorMessage) {
            setError(CRYPTO_INPUT, {
                type: 'compose',
                message: translationString(composed.errorMessage.id, composed.errorMessage.values),
            });
        }
        // set calculated and formatted "max" value to `Amount` input
        else if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(CRYPTO_INPUT, composed.max, { shouldValidate: true });
                updateFiatValue(composed.max);
                clearErrors(CRYPTO_INPUT);
            }
            saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed });
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit);
        }
    }, [
        clearErrors,
        composedLevels,
        getValues,
        saveComposedTransactionInfo,
        setError,
        setValue,
        updateFiatValue,
        selectedFee,
        translationString,
    ]);

    useDidUpdate(() => {
        const cryptoInputValue = getValues(CRYPTO_INPUT) as string;
        if (!cryptoInputValue) {
            return;
        }
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
        const cryptoAmount = conversion(cryptoInputValue, network.decimals);
        setValue(CRYPTO_INPUT, cryptoAmount, {
            shouldValidate: true,
            shouldDirty: true,
        });
        updateFiatValue(cryptoAmount);
    }, [shouldSendInSats]);

    const onSubmit = async () => {
        const formValues = getValues();
        const unformattedOutputAmount = formValues.outputs[0].amount || '';
        const sendStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, network.decimals)
                : unformattedOutputAmount;
        const send = formValues.sendCryptoSelect.value.toUpperCase();
        if (formValues.receiveCryptoSelect) {
            const receive = formValues.receiveCryptoSelect.value;
            const request: ExchangeTradeQuoteRequest = {
                receive,
                send,
                sendStringAmount,
                dex: 'enable',
            };
            saveQuoteRequest(request);
            const allQuotes = await invityAPI.getExchangeQuotes(request);
            if (Array.isArray(allQuotes)) {
                const limits = getAmountLimits(allQuotes);
                if (limits) {
                    setAmountLimits(limits);
                } else {
                    const [fixedQuotes, floatQuotes, dexQuotes] = splitToQuoteCategories(
                        allQuotes,
                        exchangeInfo,
                    );
                    saveQuotes(fixedQuotes, floatQuotes, dexQuotes);
                    navigateToExchangeOffers();
                }
            } else {
                clearQuotes();
                navigateToExchangeOffers();
            }
        }
    };

    const handleClearFormButtonClick = useCallback(() => {
        removeDraft(account.key);
        reset(defaultValues);
        composeRequest();
    }, [removeDraft, account.key, reset, defaultValues, composeRequest]);

    return {
        ...methods,
        account,
        onSubmit,
        updateFiatValue,
        register: register as SuiteUseFormRegister<ExchangeFormState>,
        exchangeInfo,
        changeFeeLevel,
        saveQuoteRequest,
        saveQuotes,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        exchangeCoinInfo,
        updateFiatCurrency,
        updateSendCryptoValue,
        saveTrade,
        feeInfo,
        composeRequest,
        fiatRates,
        isComposing,
        amountLimits,
        setAmountLimits,
        isLoading,
        noProviders,
        network,
        removeDraft,
        formState,
        handleClearFormButtonClick,
        isDraft,
    };
};

export const useCoinmarketExchangeFormContext = () => {
    const context = useContext(ExchangeFormContext);
    if (context === null) throw Error('ExchangeFormContext used without Context');
    return context;
};
