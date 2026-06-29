import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BankAccount, SellFiatTrade, SellFiatTradeResponse } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { type TranslationKey, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectHasExperimentalFeature } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAmountLimitProps,
    type TradingSellFormProps,
    type TradingSignAndPushSendFormTransactionProps,
    type TradingTransactionSell,
    isSendRejectedError,
    selectTradingComposedTransactionInfo,
    selectTradingIsSlip24Allowed,
    selectTradingSellAmountLimits,
    selectTradingSellInfo,
    selectTradingSellIsFromRedirect,
    selectTradingSellIsLoading,
    selectTradingSellQuotesByPaymentMethod,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellTransactionId,
    selectTradingTrades,
    sellThunks,
    sellUtils,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';

import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingSellHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingSellHandleChange';
import { useTradingSellFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingSellFormDefaultValues';
import { useTradingSellFormRedirectValues } from 'src/hooks/wallet/trading/form/useTradingSellFormRedirectValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type UseTradingFormCommonProps } from 'src/types/trading/trading';
import { type TradingSellFormContextProps } from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

import { useTradingAssetDecimals } from './common/useTradingAssetDecimals';
import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingFormAccount } from './useTradingFormAccount';

export const useTradingSellForm = ({
    pageType = 'form',
}: UseTradingFormCommonProps = {}): TradingSellFormContextProps => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const type = 'sell';
    const isFormPage = pageType === 'form';
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const isLoading = useSelector(selectTradingSellIsLoading);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const sellInfo = useSelector(selectTradingSellInfo);
    const amountLimits = useSelector(selectTradingSellAmountLimits);

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { account, tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const { device } = useTradingInitializer({
        pageType,
        isLoading,
    });

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { selectedFee, composed } = composedTransactionInfo;

    // we consider this feature enabled unless disabled by message system
    const isSlip24FeatureEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.trading.slip24, true),
    );
    const isSlip24ExperimentalFeatureEnabled = useSelector(selectHasExperimentalFeature('slip24'));
    const isSlip24Active = useSelector(state =>
        selectTradingIsSlip24Allowed(
            state,
            account,
            isSlip24FeatureEnabled && isSlip24ExperimentalFeatureEnabled,
        ),
    );

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const network = networks[account.symbol];
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const localCurrencyOption = { value: baseCurrencyCode, label: baseCurrencyCode.toUpperCase() };
    const trades = useSelector(selectTradingTrades);
    const trade = trades.find(
        (trade): trade is TradingTransactionSell =>
            trade.tradeType === 'sell' && trade.key === transactionId,
    );

    const { defaultValues, defaultCountry, defaultSubdivision, defaultCurrency } =
        useTradingSellFormDefaultValues(
            accountKey,
            cryptoId,
            sellInfo?.country,
            sellInfo?.countrySubdivision,
        );
    const redirectValues = useTradingSellFormRedirectValues(isFromRedirect, quotesRequest);
    const shouldSkipInitialReset = !isFormPage;
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
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: values.sendCryptoSelect?.accountKey,
                cryptoId: values.sendCryptoSelect?.id,
            }),
        [getAssetDecimals, values.sendCryptoSelect?.accountKey, values.sendCryptoSelect?.id],
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

    useTradingClearStaleQuotes({ type, isEnabled: isFormPage, isAmountEmpty });

    const helpers = useTradingFormActions({
        account,
        methods,
        pageType,
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

    const getCommonFunctions = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;

        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;

        const returnUrl = await createQuoteLink(
            {
                ...quotesRequest,
                country: quotesRequest.country ?? quote.country,
                fiatCurrency: quotesRequest.fiatCurrency ?? quote.fiatCurrency,
                amountInCrypto: quotesRequest.amountInCrypto ?? quote.amountInCrypto,
                cryptoStringAmount: quotesRequest.cryptoStringAmount ?? quote.cryptoStringAmount,
                fiatStringAmount: quotesRequest.fiatStringAmount ?? quote.fiatStringAmount,
                cryptoCurrency: quotesRequest.cryptoCurrency ?? quote.cryptoCurrency,
                paymentMethod: quote.paymentMethod,
            },
            account,
            { selectedFee, composed },
            orderId,
        );

        const processResponseData = (response: SellFiatTradeResponse) => {
            dispatch(submitRequestForm(response.tradeForm?.form));
        };

        return {
            returnUrl,
            processResponseData,
        };
    };

    const doSellTrade = async (trade: SellFiatTrade) => {
        const commonFunctions = await getCommonFunctions(trade);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        await dispatch(
            sellThunks.handleTradeThunk({
                account,
                trade,
                returnUrl,
                processResponseData,
            }),
        );
    };

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider = sellInfo && quote.exchange ? sellInfo.providerInfos[quote.exchange] : null;

        if (!quotesRequest || !provider) return;

        analytics.report({
            type: events.tradeSellEvent.name,
            payload: {
                action: 'continue',
                step: 'sell-form',
                cryptoLabel: values.sendCryptoSelect?.displaySymbol,
                cryptoNetworkSymbol: values.sendCryptoSelect?.networkSymbol,
                cryptoContractAddress: values.sendCryptoSelect?.contractAddress ?? undefined,
                exchangeName: quote?.exchange,
                receiveMethod: values.paymentMethod?.value,
                countryOfResidence: values.countrySelect?.value,
                fractionButton: helpers.fractionButton
                    ? `${(100 / helpers.fractionButton).toString()}%`
                    : undefined,
            },
        });

        const nextStep = () => {
            dispatch(goto({ routeName: 'wallet-trading-sell-confirm' }));

            // empty quoteId means the partner requests login first, requestTrade to get login screen
            if (
                (sellInfo && sellUtils.needToRegisterOrVerifyBankAccount({ quote, sellInfo })) ||
                !quote.quoteId
            ) {
                doSellTrade(quote);
            }
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote,
                nextStep,
            }),
        );
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;

        const quote = { ...selectedQuote, bankAccount };
        const commonFunctions = await getCommonFunctions(quote);

        if (!commonFunctions) return;

        const { returnUrl, processResponseData } = commonFunctions;

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: type },
            });
        };

        await dispatch(
            sellThunks.confirmTradeThunk({
                account,
                bankAccount,
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
            }),
        );
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;

        await doSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        const nextStep = () => {
            dispatch(goto({ routeName: 'wallet-trading-sell-detail' }));
        };

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps) =>
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                }),
            ).unwrap();

        try {
            await dispatch(
                sellThunks.sendTransactionThunk({
                    account,
                    trade: trade?.data,
                    shouldSendInSats,
                    decimals,
                    formValues: values as TradingSellFormProps,
                    // TODO: slip24 - exclude from debug mode
                    isSlip24Active,
                    nextStep,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            if (!isSendRejectedError<TranslationKey>(e)) {
                return false;
            }

            if (e.type !== 'sign-transaction-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: e.type,
                        error: translationString(e.error.id, e.error.values),
                    }),
                );
            }

            return false;
        }
    };

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
        if (!shouldSkipInitialReset && sellInfo && shouldResetOnInitialSellInfoLoad.current) {
            shouldResetOnInitialSellInfoLoad.current = false;
            reset(defaultValues);
        }
    }, [reset, sellInfo, defaultValues, shouldSkipInitialReset]);

    useEffect(() => {
        // We need to clear quotes on offers page without redirecting to form page
        if (!quotesRequest && !isFormPage) {
            dispatch(goto({ routeName: 'wallet-trading-sell' }));

            return;
        }
    }, [quotesRequest, isFormPage, dispatch]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade && pageType !== 'retry') {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, pageType, dispatch]);

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
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
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
        device,
        selectedQuote,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,
        addBankAccount,
        confirmTrade,
        selectQuote,
        onQuoteSelected,
        sendTransaction,
        showReserveBanner,
        setShowReserveBanner,
        clearQuotesAndParams: () => {
            dispatch(tradingSellActions.clearQuotesAndParams());
        },
    };
};
