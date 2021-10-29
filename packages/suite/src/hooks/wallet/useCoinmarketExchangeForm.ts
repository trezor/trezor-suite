import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ExchangeTradeQuoteRequest } from 'invity-api';
import { isChanged } from '@suite-utils/comparisonUtils';
import { useActions, useSelector } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { toFiatCurrency, fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import {
    ExchangeFormState,
    Props,
    AmountLimits,
    ExchangeFormContextValues,
    CRYPTO_INPUT,
    FIAT_INPUT,
    FIAT_CURRENCY,
} from '@wallet-types/coinmarketExchangeForm';
import { getComposeAddressPlaceholder } from '@wallet-utils/coinmarket/coinmarketUtils';
import { getAmountLimits, splitToFixedFloatQuotes } from '@wallet-utils/coinmarket/exchangeUtils';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import useDebounce from 'react-use/lib/useDebounce';
import { useCoinmarketExchangeFormDefaultValues } from './useCoinmarketExchangeFormDefaultValues';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';

export const ExchangeFormContext = createContext<ExchangeFormContextValues | null>(null);
ExchangeFormContext.displayName = 'CoinmarketExchangeContext';

const useExchangeState = (
    { selectedAccount, fees }: Props,
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

export const useCoinmarketExchangeForm = (props: Props): ExchangeFormContextValues => {
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

    const { selectedAccount, quotesRequest, fees, fiat, localCurrency, exchangeCoinInfo, device } =
        props;
    const { account, network } = selectedAccount;
    const { navigateToExchangeOffers } = useCoinmarketNavigation(account);
    const { symbol, networkType } = account;

    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);

    const [state, setState] = useState<ReturnType<typeof useExchangeState>>(undefined);

    const { accounts, exchangeInfo } = useSelector(state => ({
        accounts: state.wallet.accounts,
        exchangeInfo: state.wallet.coinmarket.exchange.exchangeInfo,
    }));

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
    const initState = useExchangeState(props, !!state, defaultValues);
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

    const methods = useForm<ExchangeFormState>({
        mode: 'onChange',
        shouldUnregister: false, // NOTE: tracking custom fee inputs
        defaultValues: isDraft ? draft : defaultValues,
    });
    const {
        reset,
        register,
        setValue,
        getValues,
        setError,
        clearErrors,
        formState,
        errors,
        control,
    } = methods;

    const values = useWatch<ExchangeFormState>({ control });

    useDebounce(
        () => {
            if (formState.isDirty && !formState.isValidating && Object.keys(errors).length === 0) {
                saveDraft(account.key, values as ExchangeFormState);
            }
        },
        200,
        [errors, saveDraft, account.key, values, formState],
    );

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'options', type: 'custom' });
        register({ name: 'setMaxOutputId', type: 'custom' });
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

    const updateFiatValue = useCallback(
        (amount: string) => {
            const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);
            if (!fiatRates || !fiatRates.current || !currency) return;
            const fiatValue = toFiatCurrency(amount, currency.value, fiatRates.current.rates);
            setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
        },
        [fiatRates, getValues, setValue],
    );

    const updateFiatCurrency = (currency: { label: string; value: string }) => {
        const amount = getValues(CRYPTO_INPUT) as string;
        if (!fiatRates || !fiatRates.current || !currency) return;
        const fiatValue = toFiatCurrency(amount, currency.value, fiatRates.current.rates);
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

        setValue(CRYPTO_INPUT, cryptoValue || '', { shouldValidate: true });
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);
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

        if (composed.type === 'error') {
            if (composed.errorMessage) {
                setError(CRYPTO_INPUT, {
                    type: 'compose',
                    message: composed.errorMessage as any,
                });
            }
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
    ]);

    const onSubmit = async () => {
        const formValues = getValues();
        const sendStringAmount = formValues.outputs[0].amount || '';
        const send = formValues.sendCryptoSelect.value.toUpperCase();
        if (formValues.receiveCryptoSelect) {
            const receive = formValues.receiveCryptoSelect.value;
            const request: ExchangeTradeQuoteRequest = {
                receive,
                send,
                sendStringAmount,
            };
            saveQuoteRequest(request);
            const allQuotes = await invityAPI.getExchangeQuotes(request);
            if (Array.isArray(allQuotes)) {
                const limits = getAmountLimits(allQuotes);
                if (limits) {
                    setAmountLimits(limits);
                } else {
                    const [fixedQuotes, floatQuotes] = splitToFixedFloatQuotes(
                        allQuotes,
                        exchangeInfo,
                    );
                    saveQuotes(fixedQuotes, floatQuotes);
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
        register: typedRegister,
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
