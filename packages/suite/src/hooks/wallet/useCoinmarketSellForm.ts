import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { SellFiatTradeQuoteRequest } from 'invity-api';
import { useActions, useSelector } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { isChanged } from '@suite-utils/comparisonUtils';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import {
    SellFormState,
    Props,
    AmountLimits,
    SellFormContextValues,
    CRYPTO_INPUT,
    FIAT_INPUT,
    OUTPUT_AMOUNT,
    FIAT_CURRENCY_SELECT,
} from '@wallet-types/coinmarketSellForm';
import {
    getComposeAddressPlaceholder,
    mapTestnetSymbol,
} from '@wallet-utils/coinmarket/coinmarketUtils';
import { getAmountLimits, processQuotes } from '@wallet-utils/coinmarket/sellUtils';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import useDebounce from 'react-use/lib/useDebounce';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import { useCoinmarketSellFormDefaultValues } from './useCoinmarketSellFormDefaultValues';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';

export const SellFormContext = createContext<SellFormContextValues | null>(null);
SellFormContext.displayName = 'CoinmarketSellContext';

const useSellState = (
    { selectedAccount, fees }: Props,
    currentState: boolean,
    defaultFormValues?: SellFormState,
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

export const useCoinmarketSellForm = (props: Props): SellFormContextValues => {
    const {
        saveQuoteRequest,
        saveQuotes,
        clearQuotes,
        saveTrade,
        saveComposedTransactionInfo,
        loadInvityData,
    } = useActions({
        saveQuoteRequest: coinmarketSellActions.saveQuoteRequest,
        saveQuotes: coinmarketSellActions.saveQuotes,
        clearQuotes: coinmarketSellActions.clearQuotes,
        saveTrade: coinmarketSellActions.saveTrade,
        saveComposedTransactionInfo: coinmarketCommonActions.saveComposedTransactionInfo,
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { selectedAccount, quotesRequest, fees, fiat, localCurrency, exchangeCoinInfo, device } =
        props;
    const { account, network } = selectedAccount;
    const { navigateToSellOffers } = useCoinmarketNavigation(account);
    const { symbol, networkType } = account;

    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const symbolForFiat = mapTestnetSymbol(symbol);
    const fiatRates = fiat.coins.find(item => item.symbol === symbolForFiat);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    const [state, setState] = useState<ReturnType<typeof useSellState>>(undefined);
    const [activeInput, setActiveInput] = useState<typeof FIAT_INPUT | typeof CRYPTO_INPUT>(
        FIAT_INPUT,
    );
    const { accounts, sellInfo } = useSelector(state => ({
        accounts: state.wallet.accounts,
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
    }));

    const { saveDraft, getDraft, removeDraft } = useFormDraft<SellFormState>('coinmarket-sell');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { defaultCountry, defaultCurrency, defaultValues } = useCoinmarketSellFormDefaultValues(
        account.symbol,
        sellInfo,
        state?.formValues?.outputs[0].address,
    );

    // throttle initial state calculation
    const initState = useSellState(props, !!state, defaultValues);

    useEffect(() => {
        const setStateAsync = async (initState: ReturnType<typeof useSellState>) => {
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

    const methods = useForm<SellFormState>({
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
        trigger,
        control,
        errors,
        formState,
    } = methods;

    const values = useWatch<SellFormState>({ control });

    useDebounce(
        () => {
            if (formState.isDirty && !formState.isValidating && Object.keys(errors).length === 0) {
                saveDraft(selectedAccount.account.key, values as SellFormState);
            }
        },
        200,
        [errors, saveDraft, selectedAccount.account.key, values, formState],
    );

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'options', type: 'custom' });
        register({ name: 'outputs', type: 'custom' });
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

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);
    const isLoading = !sellInfo?.sellList || !state?.formValues?.outputs[0].address;
    const noProviders =
        sellInfo?.sellList?.providers.length === 0 ||
        !sellInfo?.supportedCryptoCurrencies.has(account.symbol);

    // sub-hook, FeeLevels handler
    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    // watch change in crypto amount and recalculate fees on change
    const onCryptoAmountChange = useCallback(
        (amount: string) => {
            setValue(FIAT_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors(FIAT_INPUT);
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            composeRequest();
        },
        [clearErrors, composeRequest, setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const onFiatAmountChange = useCallback(
        (amount: string) => {
            setValue(CRYPTO_INPUT, '', { shouldDirty: true });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors(CRYPTO_INPUT);
            const currency: typeof defaultCurrency | undefined = getValues(FIAT_CURRENCY_SELECT);
            if (!fiatRates || !fiatRates.current || !currency) return;

            const cryptoValue = fromFiatCurrency(
                amount,
                currency.value.toLowerCase(),
                fiatRates.current.rates,
                network.decimals,
            );
            setValue(OUTPUT_AMOUNT, cryptoValue || '', { shouldDirty: true });
            composeRequest(FIAT_INPUT);
        },
        [setValue, clearErrors, getValues, fiatRates, network.decimals, composeRequest],
    );

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];
        if (!composed) return;

        if (composed.type === 'error' && composed.errorMessage && activeInput === CRYPTO_INPUT) {
            setError(CRYPTO_INPUT, {
                type: 'compose',
                message: composed.errorMessage as any,
            });
        }
        // set calculated and formatted "max" value to `Amount` input
        else if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(CRYPTO_INPUT, composed.max, { shouldValidate: true, shouldDirty: true });
                clearErrors(CRYPTO_INPUT);
            }
            saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed });
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [
        clearErrors,
        composedLevels,
        getValues,
        saveComposedTransactionInfo,
        setError,
        setValue,
        selectedFee,
        activeInput,
    ]);

    const onSubmit = async () => {
        const formValues = getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount = formValues.cryptoInput;
        const amountInCrypto = !fiatStringAmount;
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto,
            cryptoCurrency: formValues.cryptoCurrencySelect.value.toUpperCase(),
            fiatCurrency: formValues.fiatCurrencySelect.value.toUpperCase(),
            country: formValues.countrySelect.value,
            cryptoStringAmount,
            fiatStringAmount,
        };
        saveQuoteRequest(request);
        const allQuotes = await invityAPI.getSellQuotes(request);
        if (Array.isArray(allQuotes)) {
            const limits = getAmountLimits(request, allQuotes);
            if (limits) {
                setAmountLimits(limits);
                trigger([CRYPTO_INPUT, FIAT_INPUT]);
            } else {
                const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                saveQuotes(quotes, alternativeQuotes);
                navigateToSellOffers();
            }
        } else {
            clearQuotes();
            navigateToSellOffers();
        }
    };

    const handleClearFormButtonClick = useCallback(() => {
        removeDraft(account.key);
        reset(defaultValues);
        composeRequest();
    }, [account.key, removeDraft, reset, defaultValues, composeRequest]);

    return {
        ...methods,
        account,
        defaultCountry,
        defaultCurrency,
        onSubmit,
        register: typedRegister,
        sellInfo,
        changeFeeLevel,
        saveQuoteRequest,
        saveQuotes,
        quotesRequest,
        composedLevels,
        localCurrencyOption,
        exchangeCoinInfo,
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
        onCryptoAmountChange,
        onFiatAmountChange,
        handleClearFormButtonClick,
        formState,
        isDraft,
        activeInput,
        setActiveInput,
    };
};

export const useCoinmarketSellFormContext = () => {
    const context = useContext(SellFormContext);
    if (context === null) throw Error('SellFormContext used without Context');
    return context;
};
