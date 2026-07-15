import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { SellFiatTrade } from 'invity-api';

import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAmountLimitProps,
    type TradingSellFormProps,
    selectTradingComposedTransactionInfo,
    selectTradingSellActiveTrade,
    selectTradingSellAmountLimits,
    selectTradingSellInfo,
    selectTradingSellIsFromRedirect,
    selectTradingSellIsLoading,
    selectTradingSellQuotesByPaymentMethod,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellTransactionId,
    selectTradingSendAccount,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingSellHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingSellHandleChange';
import { useTradingSellFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingSellFormDefaultValues';
import { useTradingSellFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingSellFormRedirectValues';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingSellFormContextProps } from 'src/types/trading/tradingForm';

import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingFormAccount } from './useTradingFormAccount';

export const useTradingSellForm = (): TradingSellFormContextProps => {
    const type = 'sell';
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingSellIsLoading);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const sellInfo = useSelector(selectTradingSellInfo);
    const amountLimits = useSelector(selectTradingSellAmountLimits);

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const trade = useSelector(selectTradingSellActiveTrade);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    useServerEnvironment();

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const network = networks[account.symbol];
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const localCurrencyOption = { value: baseCurrencyCode, label: baseCurrencyCode.toUpperCase() };

    const { defaultValues } = useTradingSellFormDefaultValues(
        accountKey,
        cryptoId,
        sellInfo?.country,
        sellInfo?.countrySubdivision,
    );
    const redirectValues = useTradingSellFormRedirectValues(isFromRedirect, quotesRequest);
    const shouldResetOnInitialSellInfoLoad = useRef(!sellInfo);
    const methods = useForm<TradingSellFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues ?? defaultValues,
    });
    const { register, setValue, reset, control, formState } = methods;
    const values = useWatch<TradingSellFormProps>({ control });
    const { paymentMethod, provider } = values;

    const formIsValid = Object.keys(formState.errors).length === 0;
    const output = values.outputs?.[0];
    const hasValues = !!output?.amount;
    const isAmountEmpty = output?.amount === '';
    const noProviders = Object.keys(sellInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !sellInfo?.providerInfos;

    const quotesByPaymentMethod = useSelector(state =>
        selectTradingSellQuotesByPaymentMethod(state, values?.paymentMethod?.value),
    );

    const setAmountLimits = (limits: TradingAmountLimitProps | undefined) => {
        dispatch(tradingSellActions.setAmountLimits(limits));
    };

    const {
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
    } = useTradingComposeTransaction<TradingSellFormProps>({
        type: 'sell',
        account,
        network,
        values: values as TradingSellFormProps,
        methods,
        setShowReserveBanner,
    });

    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isLoading || isComposing;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher<TradingSellFormProps>({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_OUTPUT_AMOUNT,
            fiatInput: TRADING_FORM_OUTPUT_FIAT,
        },
    });

    const { handleChange } = useTradingSellHandleChange({
        formValues: values as TradingSellFormProps,
        network,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
        setValue,
    });

    useTradingClearStaleQuotes({ type, isAmountEmpty });

    const helpers = useTradingFormActions({
        account,
        methods,
        type,
        handleChange,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
        setAccountOnChange: newAccount => {
            dispatch(tradingSellActions.setTradingAccountKey(newAccount.key));
        },
        composedLevels,
        composedTransactionInfo,
        setShowReserveBanner,
    });

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    const onQuoteSelected = useCallback(
        (quote: SellFiatTrade) => {
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

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    useEffect(() => {
        // bind actual default values when we've got sellInfo from Invity API server
        if (sellInfo && shouldResetOnInitialSellInfoLoad.current) {
            shouldResetOnInitialSellInfoLoad.current = false;
            reset(defaultValues);
        }
    }, [reset, sellInfo, defaultValues]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingSellActions.setTradingAccountKey(trade.sendAccountKey));
                }
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, dispatch]);

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto,
            },
            helpers,
        },
        ...methods,
        methods,
        account,
        sellInfo,
        quotesRequest,
        quotes: quotesByPaymentMethod,
        composedLevels,
        composedTransactionInfo,
        localCurrencyOption,
        feeInfo,
        isComposing,
        amountLimits,
        network,
        selectedQuote,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,
        onQuoteSelected,
        showReserveBanner,
        setShowReserveBanner,
        clearQuotesAndParams: () => {
            dispatch(tradingSellActions.clearQuotesAndParams());
        },
    };
};
