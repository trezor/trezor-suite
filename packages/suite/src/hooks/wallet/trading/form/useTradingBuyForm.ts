import { useCallback, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BuyTrade } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { goto } from '@suite/router';
import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAmountLimitProps,
    type TradingBuyFormProps,
    isCountrySubdivisionEmpty,
    mapFiatCurrencyCodeToBaseCurrencyCode,
    selectTradingBuyAmountLimits,
    selectTradingBuyInfo,
    selectTradingBuyIsFromRedirect,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotesByPaymentMethod,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingVerifiedAddress,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isChanged } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingBuyHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingBuyHandleChange';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingBuyFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormDefaultValues';
import { useTradingBuyFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormRedirectValues';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type Dispatch } from 'src/types/suite';
import { type TradingBuyFormContextProps } from 'src/types/trading/tradingForm';

import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingFiatValues } from './common/useTradingFiatValues';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingBuyForm = (): TradingBuyFormContextProps => {
    const type = 'buy';
    const dispatch = useDispatch();

    const buyInfo = useSelector(selectTradingBuyInfo);
    const isFromRedirect = useSelector(selectTradingBuyIsFromRedirect);
    const quotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const amountLimits = useSelector(selectTradingBuyAmountLimits);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const verifiedAddress = useSelector(selectTradingVerifiedAddress);

    useServerEnvironment();

    const { account, cryptoId } = useTradingFormAccount(type);

    const shouldResetOnInitialBuyInfoLoad = useRef(!buyInfo);

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

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
    const { formState, reset, setValue, handleSubmit, control } = methods;
    const values = useWatch({ control }) as TradingBuyFormProps;
    const { paymentMethod, provider } = values;
    const previousValues = useRef<TradingBuyFormProps | null>(null);

    const isAmountEmpty = !values.fiatInput && !values.cryptoInput;

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'buy',
        cryptoId: values.cryptoSelect?.id,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
    });

    const { receiveAddress } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    const noProviders = buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFormLoading = formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const quotesByPaymentMethod = useSelector(state =>
        selectTradingBuyQuotesByPaymentMethod(state, values?.paymentMethod?.value),
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network = getNetwork(
        values.cryptoSelect?.networkSymbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
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
        baseToggleAmountInCrypto();
    };

    const { handleChange } = useTradingBuyHandleChange({
        formValues: values,
        network,
        shouldSendInSats,
        setValue,
    });

    const verifyAddress =
        (verifyAccount: Account, address: string | undefined, path: string | undefined) =>
        async (verifyDispatch: Dispatch) => {
            await verifyDispatch(
                tradingThunks.verifyAddressThunk({
                    account: verifyAccount,
                    address,
                    path,
                }),
            );
        };

    useEffect(() => {
        setValue('receiveAddress', receiveAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receiveAddress]);

    const onQuoteSelected = useCallback(
        (quote: BuyTrade) => {
            const quoteProvider = quote.exchange;
            const quotePaymentMethod = quote.paymentMethod;

            if (quoteProvider && quoteProvider !== provider) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quoteProvider);
            }

            if (quotePaymentMethod && paymentMethod?.value !== quotePaymentMethod) {
                setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                    value: quotePaymentMethod,
                    label: quote.paymentMethodName ?? quotePaymentMethod,
                });
            }
        },
        [paymentMethod, provider, setValue],
    );

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            if (
                isChanged(previousValues.current?.fiatInput, values.fiatInput) ||
                isChanged(previousValues.current?.cryptoInput, values.cryptoInput)
            ) {
                handleSubmit(() => {
                    handleChange();
                })();

                previousValues.current = values;
            }
        },
        500,
        [previousValues, values.fiatInput, values.cryptoInput, handleChange, handleSubmit],
    );

    useTradingClearStaleQuotes({ type, isAmountEmpty });

    // call change handler on every change of select inputs
    useEffect(() => {
        if (!values.cryptoSelect || !values.countrySelect || !values.currencySelect) {
            return;
        }

        if (
            isCountrySubdivisionEmpty(
                values.countrySelect?.value,
                values.countrySubdivisionSelect?.value,
            )
        ) {
            return;
        }

        if (
            isChanged(previousValues.current?.cryptoSelect, values.cryptoSelect) ||
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(
                previousValues.current?.countrySubdivisionSelect,
                values.countrySubdivisionSelect,
            ) ||
            isChanged(previousValues.current?.currencySelect, values.currencySelect) ||
            isChanged(previousValues.current?.receiveAddress, values?.receiveAddress) ||
            isChanged(previousValues.current?.cryptoSelect.id, values?.cryptoSelect.id)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit]);

    useEffect(() => {
        // bind actual default values when we've got buyInfo from Invity API server
        if (buyInfo && shouldResetOnInitialBuyInfoLoad.current) {
            shouldResetOnInitialBuyInfoLoad.current = false;
            const currentReceiveAddress = values.receiveAddress;
            reset({
                ...defaultValues,
                receiveAddress: currentReceiveAddress,
            });
        }
    }, [reset, buyInfo, defaultValues, values.receiveAddress]);

    useEffect(() => {
        if (isFromRedirect && quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
        }
    }, [isFromRedirect, quotesRequest, dispatch]);

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
        account,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        verifiedAddress,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        selectedQuote,
        tradingReceiveAddress,
        isAmountEmpty,
        onQuoteSelected,
        verifyAddress,
        setAmountLimits: (limits: TradingAmountLimitProps | undefined) => {
            dispatch(tradingBuyActions.setAmountLimits(limits));
        },
        clearQuotesAndParams: () => {
            dispatch(tradingBuyActions.clearQuotesAndParams());
        },
    };
};
