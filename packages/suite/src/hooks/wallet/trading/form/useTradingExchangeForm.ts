import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    type TradingExchangeType,
    type TradingTransactionExchange,
    cryptoIdToNetwork,
    exchangeThunks,
    getDexEstimationData,
    invityAPI,
    isSendingEvmNativeToken,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeAmountLimits,
    selectTradingExchangeInfo,
    selectTradingExchangeIsFromRedirect,
    selectTradingExchangeIsLoading,
    selectTradingExchangeQuotes,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeTransactionId,
    selectTradingTrades,
    selectTradingVerifiedAddress,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork, isAccountBasedNetwork } from '@suite-common/wallet-config';
import {
    ETHEREUM_ADJUST_GAS_LIMIT,
    fetchAndUpdateAccountThunk,
    selectAccountByKey,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingExchangeHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingExchangeHandleChange';
import { useTradingExchangeQuotesFilter } from 'src/hooks/wallet/trading/form/common/useTradingExchangeQuotesFilter';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingExchangeFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingExchangeFormDefaultValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type Dispatch } from 'src/types/suite';
import {
    type TradingExchangeConfirmTradeProps,
    type TradingExchangeFormContextProps,
} from 'src/types/trading/tradingForm';

import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingExchangeTradeRequest } from './common/useTradingExchangeTradeRequest';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingExchangeForm = (): TradingExchangeFormContextProps => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const type = 'exchange';
    const dispatch = useDispatch();
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
    const isFromRedirect = useSelector(selectTradingExchangeIsFromRedirect);
    const quotes = useSelector(selectTradingExchangeQuotes);
    const transactionId = useSelector(selectTradingExchangeTransactionId);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const amountLimits = useSelector(selectTradingExchangeAmountLimits);
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const verifiedAddress = useSelector(selectTradingVerifiedAddress);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const {
        account: formAccount,
        tradingAccountKey: accountKey,
        cryptoId,
    } = useTradingFormAccount(type);

    const trades = useSelector(selectTradingTrades);
    const trade = useMemo(
        () =>
            trades.find(
                (transaction): transaction is TradingTransactionExchange =>
                    transaction.tradeType === 'exchange' &&
                    !!transactionId &&
                    transaction.data.orderId === transactionId,
            ),
        [trades, transactionId],
    );

    const tradeSendAccount = useSelector(state => selectAccountByKey(state, trade?.sendAccountKey));
    const account = tradeSendAccount ?? formAccount;

    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    // used for disabling approve/revoke controls when
    // quotes are scheduled to refresh after changing swap form inputs
    const [isScheduledQuotesRefresh, setIsScheduledQuotesRefresh] = useState(false);
    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { device } = useTradingInitializer();

    const [isApproval, setIsApproval] = useState<boolean>(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);

    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    const { symbol } = account;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = getNetwork(account.symbol);

    const { defaultCurrency, defaultValues } = useTradingExchangeFormDefaultValues(
        accountKey,
        cryptoId,
    );

    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues,
    });

    const { reset, register, getValues, setValue, formState, control } = methods;
    const values = useWatch({ control }) as TradingExchangeFormProps;
    const { provider } = values;
    const {
        rateType,
        exchangeType,
        sendCryptoSelect,
        receiveCryptoSelect,
        transactionData,
        ethereumAdjustGasLimit,
    } = getValues();
    const output = values.outputs?.[0];
    const outputAddress = output?.address;

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'exchange',
        cryptoId: receiveCryptoSelect?.id,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
    });
    const { receiveAddress, extraField } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    useTradingFiatValues({
        cryptoId: receiveCryptoSelect?.id,
        amount: selectedQuote?.receiveStringAmount,
        fiatCurrency: output?.currency?.value || undefined,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount && !!values.receiveCryptoSelect;
    const isAmountEmpty = output?.amount === '';
    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !exchangeInfo?.providerInfos;
    const shouldResetOnInitialExchangeInfoLoad = useRef(isInitialDataLoading);

    const setAmountLimits = useCallback(
        (limits: TradingExchangeAmountLimitProps | undefined) => {
            dispatch(tradingExchangeActions.setAmountLimits(limits));
        },
        [dispatch],
    );

    const { cexQuotes, dexQuotes } = useTradingExchangeQuotesFilter({
        exchangeType,
        setValue,
    });

    const {
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
    } = useTradingComposeTransaction<TradingExchangeFormProps>({
        type: 'exchange',
        account,
        network,
        values,
        methods,
        setShowReserveBanner,
    });

    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_OUTPUT_AMOUNT,
            fiatInput: TRADING_FORM_OUTPUT_FIAT,
        },
    });

    const { handleChange } = useTradingExchangeHandleChange({
        formValues: values,
        network,
        shouldSendInSats,
        receiveAddress: tradingReceiveAddress.receiveAddress,
        receiveAccountKey: tradingReceiveAddress.selectedAccount?.key,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
        setIsScheduledQuotesRefresh,
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
            dispatch(tradingExchangeActions.setTradingAccountKey(newAccount.key));
        },
        composedLevels,
        composedTransactionInfo,
        setShowReserveBanner,
        receiveAddress: tradingReceiveAddress.receiveAddress,
    });

    const selectQuote = async (quote: ExchangeTrade) => {
        const quoteProvider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;

        analytics.report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: 'continue',
                step: 'exchange-form',
                sendCryptoLabel: sendCryptoSelect?.displaySymbol,
                sendCryptoNetworkSymbol: sendCryptoSelect?.networkSymbol,
                sendCryptoContractAddress: sendCryptoSelect?.contractAddress ?? undefined,
                receiveCryptoLabel: receiveCryptoSelect?.displaySymbol,
                receiveCryptoNetworkSymbol: receiveCryptoSelect?.networkSymbol,
                receiveCryptoContractAddress: receiveCryptoSelect?.contractAddress ?? undefined,
                exchangeType,
                exchangeName: quoteProvider?.companyName,
                rateType,
                fractionButton: helpers.fractionButton
                    ? `${(100 / helpers.fractionButton).toString()}%`
                    : undefined,
            },
        });

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote,
                nextStep: () => {
                    dispatch(goto({ routeName: 'wallet-trading-exchange-confirm' }));
                },
            }),
        );
    };

    const confirmTrade = async ({
        receiveAddress: confirmReceiveAddress,
        trade: confirmedTrade,
        approvalFlow,
        ...props
    }: TradingExchangeConfirmTradeProps): Promise<ExchangeTrade | undefined> => {
        const commonFunctions = await getTradeRequestParams(confirmedTrade);

        if (!commonFunctions) return undefined;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress: confirmReceiveAddress,
                account,
                extraField: props.extraField ?? extraField,
                trade: confirmedTrade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        ).unwrap();
    };

    const verifyAddress =
        (verifiedAccount: Account, address: string | undefined, path: string | undefined) =>
        async (innerDispatch: Dispatch) => {
            await innerDispatch(
                tradingThunks.verifyAddressThunk({
                    account: verifiedAccount,
                    address,
                    path,
                }),
            );
        };

    const confirmApproval = async ({
        trade: approvalTrade,
        receiveAddress: approvalReceiveAddress,
    }: {
        trade?: ExchangeTrade;
        receiveAddress: string;
    }) => {
        const commonFunctions = await getTradeRequestParams(approvalTrade);
        if (!commonFunctions) return undefined;
        const { processResponseData } = commonFunctions;

        return await dispatch(
            exchangeThunks.confirmApprovalThunk({
                receiveAddress: approvalReceiveAddress,
                account,
                extraField,
                trade: approvalTrade,
                processResponseData,
            }),
        ).unwrap();
    };

    const watchApproval = async ({ refreshCount }: { refreshCount: number }) => {
        if (!selectedQuote) return;

        const response = await invityAPI.watchTrade<TradingExchangeType>(
            selectedQuote,
            'exchange',
            refreshCount,
        );

        if (!response.status || response.status === selectedQuote.status) {
            return;
        }

        const updatedSelectedQuote = {
            ...selectedQuote,
            status: response.status,
            error: response.error,
            approvalType: undefined,
        };

        if (!updatedSelectedQuote.dexTx || !updatedSelectedQuote.receiveAddress) {
            return;
        }

        const newTrade = await confirmApproval({
            trade: updatedSelectedQuote,
            receiveAddress: updatedSelectedQuote.receiveAddress,
        });

        dispatch(tradingExchangeActions.saveSelectedQuote(newTrade));
        await dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    };

    const approveTransaction = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const newTrade = await confirmApproval({
            trade: { ...exchangeTrade, status: 'CONFIRM' },
            receiveAddress,
        });

        return !!newTrade;
    };

    const revokeApproval = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const approvalType: DexApprovalType = 'ZERO';
        const updatedTrade: ExchangeTrade = {
            ...exchangeTrade,
            approvalType,
            status: exchangeTrade.status === 'APPROVAL_REQ' ? 'APPROVAL_REQ' : 'CONFIRM',
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedTrade));

        const newTrade = await confirmApproval({
            trade: updatedTrade,
            receiveAddress,
        });

        return !!newTrade;
    };

    const resetSelectedOffer = useCallback(() => {
        setIsScheduledQuotesRefresh(true);
    }, []);

    const refreshQuotes = async () => {
        await handleChange();
    };

    const composeRequestRef = useCurrentRef(composeRequest);
    const fetchFeesAndCompose = useCallback(async () => {
        await dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol })).unwrap();
        composeRequestRef.current();
    }, [dispatch, account.symbol, composeRequestRef]);

    const setValueRef = useCurrentRef(setValue);
    useEffect(() => {
        const fromAddress = isAccountBasedNetwork(account.symbol) ? account.descriptor : undefined;

        setValueRef.current('fromAddress', fromAddress);
    }, [account.symbol, account.descriptor, setValueRef]);

    // set transactionData from DEX quote for correct fees fetching
    useEffect(() => {
        if (!sendCryptoSelect?.id) return;
        if (isFormLoading || isLoadingQuote) return;

        if (exchangeType !== TRADING_EXCHANGE_FORM_DEX) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const sendNetwork = cryptoIdToNetwork(sendCryptoSelect.id);
        const isEvmNativeToken = isSendingEvmNativeToken(sendCryptoSelect.id);
        const requiresApproval = sendNetwork?.networkType === 'ethereum' && !isEvmNativeToken;

        const quote = requiresApproval ? selectedQuote : dexQuotes[0];

        if (!quote?.dexTx) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const { dexTx } = quote;

        setValue('transactionData', getDexEstimationData(quote) ?? '');
        setValue(TRADING_FORM_OUTPUT_ADDRESS, dexTx.to);
        setValue('ethereumAdjustGasLimit', ETHEREUM_ADJUST_GAS_LIMIT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dexQuotes,
        selectedQuote,
        exchangeType,
        isApproval,
        sendCryptoSelect,
        isFormLoading,
        isLoadingQuote,
    ]);

    const fetchFeesAndComposeRef = useCurrentRef(fetchFeesAndCompose);
    // fetch fees when transactionData changes
    useEffect(() => {
        fetchFeesAndComposeRef.current();
    }, [transactionData, outputAddress, ethereumAdjustGasLimit, fetchFeesAndComposeRef]);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    const onQuoteSelected = useCallback(
        (quote: ExchangeTrade) => {
            const quoteProvider = quote.exchange;
            if (quoteProvider && quoteProvider !== provider) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quoteProvider);
            }

            const quoteFormType = quote.isDex
                ? TRADING_EXCHANGE_FORM_DEX
                : TRADING_EXCHANGE_FORM_CEX;
            if (quoteFormType !== exchangeType) {
                setValue(TRADING_EXCHANGE_FORM, quoteFormType);
            }
        },
        [provider, exchangeType, setValue],
    );

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('setMaxOutputId');
    }, [register]);

    // bind actual default values when we've got exchangeInfo from Invity API server
    useEffect(() => {
        if (exchangeInfo && !isInitialDataLoading && shouldResetOnInitialExchangeInfoLoad.current) {
            shouldResetOnInitialExchangeInfoLoad.current = false;
            reset(defaultValues);
        }
    }, [reset, exchangeInfo, defaultValues, isInitialDataLoading]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingExchangeActions.setTradingAccountKey(trade.sendAccountKey));
                }
            }

            dispatch(tradingExchangeActions.setIsFromRedirect(false));
        }
    }, [dispatch, isFromRedirect, trade, transactionId]);

    return {
        type,
        ...methods,
        account,

        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto,
            },
            helpers,
        },
        methods,
        device,
        exchangeInfo,
        quotes,
        dexQuotes,
        cexQuotes,
        quotesRequest,
        isComposing,
        composedLevels,
        defaultCurrency,
        feeInfo,
        amountLimits,
        network,
        receiveAccount,
        selectedQuote,
        verifiedAddress,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        setReceiveAccount,
        composeRequest,
        composedTransactionInfo,
        changeFeeLevel,
        setAmountLimits,
        onQuoteSelected,
        verifyAddress,
        selectQuote,
        confirmTrade,
        approveTransaction,
        revokeApproval,
        confirmApproval,
        watchApproval,
        refreshQuotes,
        isScheduledQuotesRefresh,
        resetSelectedOffer,
        fetchFeesAndCompose,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        isApproval,
        setIsApproval,
        showReserveBanner,
        setShowReserveBanner,
    };
};
