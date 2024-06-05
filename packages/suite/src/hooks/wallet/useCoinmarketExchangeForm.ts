import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { ExchangeTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import {
    amountToSatoshi,
    toFiatCurrency,
    formatAmount,
    fromFiatCurrency,
    getFeeLevels,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { isChanged } from '@suite-common/suite-utils';
import { selectDevice, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    clearQuotes,
    saveQuoteRequest,
    saveQuotes,
} from 'src/actions/wallet/coinmarketExchangeActions';
import {
    loadInvityData,
    saveComposedTransactionInfo,
} from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    ExchangeFormState,
    ExchangeFormContextValues,
    CRYPTO_INPUT,
    FIAT_INPUT,
    FIAT_CURRENCY,
    UseCoinmarketExchangeFormProps,
} from 'src/types/wallet/coinmarketExchangeForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { getAmountLimits, splitToQuoteCategories } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import type { AppState } from 'src/types/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CryptoAmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

import { useCoinmarketExchangeFormDefaultValues } from './useCoinmarketExchangeFormDefaultValues';
import { useCompose } from './form/useCompose';
import { useFees } from './form/useFees';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { TokenAddress } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

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
    const [state, setState] = useState<ReturnType<typeof useExchangeState>>(undefined);

    const accounts = useSelector(state => state.wallet.accounts);
    const { exchangeInfo, quotesRequest } = useSelector(state => state.wallet.coinmarket.exchange);
    const { symbolsInfo } = useSelector(state => state.wallet.coinmarket.info);
    const device = useSelector(selectDevice);
    const localCurrency = useSelector(selectLocalCurrency);
    const fees = useSelector(state => state.wallet.fees);
    const dispatch = useDispatch();
    const addressDisplayType = useSelector(selectAddressDisplayType);

    const { account, network } = selectedAccount;
    const { navigateToExchangeOffers } = useCoinmarketNavigation(account);
    const { symbol, networkType } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);

    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

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

    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;

    useEffect(() => {
        const setStateAsync = async (
            initState: NonNullable<ReturnType<typeof useExchangeState>>,
        ) => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );
            if (initState?.formValues && address) {
                initState.formValues.outputs[0].address = address;

                setState(initState);
            }
        };

        if (!state && initState) {
            setStateAsync(initState);
        }
    }, [state, initState, account, network, device, accounts, chunkify, exchangeInfo?.sellSymbols]);

    const methods = useForm({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });
    const { reset, register, setValue, getValues, setError, clearErrors, formState, control } =
        methods;

    const values = useWatch({ control });

    const { outputs } = getValues();

    const token = outputs?.[0]?.token;

    const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);

    const fiatRateKey = getFiatRateKey(
        symbol,
        currency?.value as FiatCurrencyCode,
        token as TokenAddress,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);

            return;
        }

        if (values.sendCryptoSelect && !values.sendCryptoSelect?.cryptoSymbol) {
            removeDraft(account.key);

            return;
        }

        if (values.receiveCryptoSelect && !values.receiveCryptoSelect?.cryptoSymbol) {
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

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
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
            isComposing,
        ],
    );

    const [amountLimits, setAmountLimits] = useState<CryptoAmountLimits | undefined>(undefined);

    const { translationString } = useTranslation();

    const updateFiatValue = useCallback(
        (amount: string) => {
            const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);
            if (!fiatRate?.rate || !currency) return;
            const cryptoAmount =
                amount && shouldSendInSats ? formatAmount(amount, network.decimals) : amount;
            const fiatValue = toFiatCurrency(cryptoAmount, fiatRate.rate, 2);
            setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
        },
        [shouldSendInSats, fiatRate, getValues, network.decimals, setValue],
    );

    const updateFiatCurrency = (currency: { label: string; value: string }, rate: number) => {
        if (!rate || !currency) return;
        const amount = getValues(CRYPTO_INPUT) as string;
        const formattedAmount = new BigNumber(
            shouldSendInSats ? formatAmount(amount, network.decimals) : amount,
        );
        if (
            formattedAmount &&
            !formattedAmount.isNaN() &&
            formattedAmount.gt(0) // formatAmount() returns '-1' on error
        ) {
            const fiatValueBigNumber = formattedAmount.multipliedBy(rate);

            setValue(FIAT_INPUT, fiatValueBigNumber.toFixed(2), {
                shouldValidate: true,
            });
        }
    };

    const updateSendCryptoValue = (amount: string, decimals: number) => {
        const currency: { value: string; label: string } | undefined = getValues(FIAT_CURRENCY);
        if (!fiatRate?.rate || !currency) return;
        const cryptoValue = fromFiatCurrency(amount, decimals, fiatRate.rate);
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
        exchangeInfo?.exchangeList?.length === 0 ||
        !exchangeInfo?.sellSymbols.has(networkToCryptoSymbol(account.symbol)!);

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
                type: COMPOSE_ERROR_TYPES.COMPOSE,
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
            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit);
        }
    }, [
        clearErrors,
        composedLevels,
        dispatch,
        getValues,
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
        if (formValues.receiveCryptoSelect) {
            const request: ExchangeTradeQuoteRequest = {
                receive: formValues.receiveCryptoSelect.cryptoSymbol!,
                send: formValues.sendCryptoSelect.cryptoSymbol!,
                sendStringAmount,
                dex: 'enable',
            };
            dispatch(saveQuoteRequest(request));
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
                    dispatch(saveQuotes(fixedQuotes, floatQuotes, dexQuotes));
                    navigateToExchangeOffers();
                }
            } else {
                dispatch(clearQuotes());
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
        register,
        exchangeInfo,
        symbolsInfo,
        changeFeeLevel,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        updateFiatCurrency,
        updateSendCryptoValue,
        feeInfo,
        composeRequest,
        fiatRate,
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
