import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    type TradingAmountLimitProps,
    type TradingBuyFormProps,
    mapFiatCurrencyCodeToBaseCurrencyCode,
    selectTradingBuyAmountLimits,
    selectTradingBuyFormValues,
    selectTradingBuyInfo,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { useTradingAmountUnitSync } from 'src/hooks/wallet/trading/form/common/useTradingAmountUnitSync';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingBuyFormContextProps } from 'src/types/trading/tradingForm';

import { useBuyQuotes } from './useBuyQuotes';
import { useTradingBuyFormDefaultValues } from './useTradingBuyFormDefaultValues';
import { useTradingClearStaleQuotes } from '../common/useTradingClearStaleQuotes';
import { useTradingFiatValues } from '../common/useTradingFiatValues';
import { useTradingFormReset } from '../common/useTradingFormReset';
import { useTradingFormAccount } from '../useTradingFormAccount';
import { useTradingReceiveAddress } from '../useTradingReceiveAddress';

export const useTradingBuyForm = (): TradingBuyFormContextProps => {
    // React Compiler: react-hook-form edits `formState.errors` in place, so the object keeps one
    // identity until the next `reset` and a compiled `Object.keys` of it -- this form's or the
    // receive-address form's -- is never recomputed, the freeze the exchange and sell forms opt out
    // of. This hook was skipped only as a side effect of the `react-hooks/exhaustive-deps`
    // suppression below, so tidying that away would have shipped it. Remove once form validity
    // derives from a value that changes identity when an error is added or cleared.
    'use no memo';

    const type = 'buy';
    const { dispatch } = useServices(injectDispatch);

    const buyInfo = useSelector(selectTradingBuyInfo);
    const quotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const savedFormValues = useSelector(selectTradingBuyFormValues);
    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const amountLimits = useSelector(selectTradingBuyAmountLimits);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    useServerEnvironment();

    const { cryptoId } = useTradingFormAccount(type);

    const fiatTradingValuesParams = selectedQuote
        ? {
              cryptoId: selectedQuote.receiveCurrency,
              amount: selectedQuote.receiveAmount?.toString(),
              fiatCurrency: mapFiatCurrencyCodeToBaseCurrencyCode(selectedQuote.fiatCurrency),
          }
        : {
              cryptoId: quotesRequest?.receiveCurrency,
              amount: quotesRequest?.cryptoStringAmount,
              fiatCurrency: mapFiatCurrencyCodeToBaseCurrencyCode(quotesRequest?.fiatCurrency),
          };
    useTradingFiatValues(fiatTradingValuesParams);

    const { defaultValues } = useTradingBuyFormDefaultValues(cryptoId, buyInfo);
    const initialValues = savedFormValues ?? defaultValues;
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: initialValues,
    });
    const { formState, reset, setValue, getValues, control } = methods;
    // Watch only those values that are relevant in render function
    const [cryptoSelect, fiatInput, cryptoInput, currencySelect] = useWatch({
        control,
        name: [
            TRADING_FORM_CRYPTO_CURRENCY_SELECT,
            TRADING_FORM_FIAT_INPUT,
            TRADING_FORM_CRYPTO_INPUT,
            TRADING_FORM_FIAT_CURRENCY_SELECT,
        ],
    });

    const isAmountEmpty = !fiatInput && !cryptoInput;

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'buy',
        cryptoId: cryptoSelect?.id,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
    });

    const { receiveAddress } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    const noProviders = buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (fiatInput || cryptoInput) && !!currencySelect?.value;
    const isFormLoadingBase = formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;

    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network = getNetwork(cryptoSelect?.networkSymbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY);
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(
        cryptoSelect?.networkSymbol,
    );

    useTradingAmountUnitSync({
        networkSymbol: cryptoSelect?.networkSymbol,
        methods,
        cryptoInputName: TRADING_FORM_CRYPTO_INPUT,
    });

    const { isScheduledQuotesRefresh } = useBuyQuotes({ methods, network, shouldSendInSats });

    const isFormLoading = isFormLoadingBase || isScheduledQuotesRefresh;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    useEffect(() => {
        setValue('receiveAddress', receiveAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveAddress]);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useTradingClearStaleQuotes({ type, isAmountEmpty });

    useTradingFormReset({
        isInfoReady: !!buyInfo,
        reset,
        defaultValues: initialValues,
        getPreservedValues: () => ({ receiveAddress: getValues('receiveAddress') }),
    });

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,
            },
        },
        ...methods,
        // The spread copies react-hook-form's ref object, whose `formState` is replaced by a
        // new proxy on every update. Naming it puts a moving dependency in the compiler's guard,
        // so this context value is rebuilt when validation state changes.
        formState,
        methods,
        amountLimits,
        network,
        tradingReceiveAddress,
        isAmountEmpty,
        setAmountLimits: (limits: TradingAmountLimitProps | undefined) => {
            dispatch(tradingBuyActions.setAmountLimits(limits));
        },
    };
};
