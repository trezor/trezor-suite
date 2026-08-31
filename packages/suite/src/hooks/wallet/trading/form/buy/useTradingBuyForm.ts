import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { useSelector } from '@suite-common/redux-utils';
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
    selectTradingBuyInfo,
    selectTradingBuyIsFromRedirect,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    tradingBuyActions,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';

import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingBuyFormContextProps } from 'src/types/trading/tradingForm';

import { useBuyFlow } from './useBuyFlow';
import { useBuyQuotes } from './useBuyQuotes';
import { useTradingBuyFormDefaultValues } from './useTradingBuyFormDefaultValues';
import { useTradingBuyFormRedirectValues } from './useTradingBuyFormRedirectValues';
import { useTradingFiatValues } from '../common/useTradingFiatValues';
import { useTradingFormReset } from '../common/useTradingFormReset';
import { useTradingFormAccount } from '../useTradingFormAccount';
import { useTradingReceiveAddress } from '../useTradingReceiveAddress';

export const useTradingBuyForm = (): TradingBuyFormContextProps => {
    const type = 'buy';
    const dispatch = useDispatch();

    const buyInfo = useSelector(selectTradingBuyInfo);
    const isFromRedirect = useSelector(selectTradingBuyIsFromRedirect);
    const quotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const amountLimits = useSelector(selectTradingBuyAmountLimits);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    useServerEnvironment();

    const { account, cryptoId } = useTradingFormAccount(type);

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
    const redirectValues = useTradingBuyFormRedirectValues(isFromRedirect, quotesRequest);
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues || defaultValues,
    });
    const { formState, reset, setValue, getValues, clearErrors, control } = methods;
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

    const { toggleAmountInCrypto: baseToggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_CRYPTO_INPUT,
            fiatInput: TRADING_FORM_FIAT_INPUT,
        },
    });

    const toggleAmountInCrypto = () => {
        setValue(TRADING_FORM_CRYPTO_INPUT, '');
        setValue(TRADING_FORM_FIAT_INPUT, '');
        clearErrors([TRADING_FORM_CRYPTO_INPUT, TRADING_FORM_FIAT_INPUT]);
        baseToggleAmountInCrypto();
    };

    const { isScheduledQuotesRefresh } = useBuyQuotes({ methods, network, shouldSendInSats });

    const isFormLoading = isFormLoadingBase || isScheduledQuotesRefresh;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    useEffect(() => {
        setValue('receiveAddress', receiveAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveAddress]);

    useBuyFlow({ isFromRedirect, quotesRequest, isAmountEmpty });

    useTradingFormReset({
        isInfoReady: !!buyInfo,
        reset,
        defaultValues,
        getPreservedValues: () => ({ receiveAddress: getValues('receiveAddress') }),
    });

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,
                toggleAmountInCrypto,
            },
        },
        ...methods,
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
