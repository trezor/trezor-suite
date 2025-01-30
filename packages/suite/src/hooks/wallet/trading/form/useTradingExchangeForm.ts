import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type {
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    FiatCurrencyCode,
} from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { isChanged } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingExchangeType, invityAPI } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { amountToSmallestUnit, formatAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import { saveQuoteRequest, saveQuotes } from 'src/actions/wallet/tradingExchangeActions';
import * as tradingExchangeActions from 'src/actions/wallet/tradingExchangeActions';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT } from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingAccount } from 'src/hooks/wallet/trading/form/common/useTradingAccount';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingExchangeQuotesFilter } from 'src/hooks/wallet/trading/form/common/useTradingExchangeQuotesFilter';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingModalCrypto } from 'src/hooks/wallet/trading/form/common/useTradingModalCrypto';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingExchangeFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingExchangeFormDefaultValues';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { useTradingRecomposeAndSign } from 'src/hooks/wallet/useTradingRecomposeAndSign';
import { UseTradingFormProps } from 'src/types/trading/trading';
import {
    TradingExchangeFormContextProps,
    TradingExchangeFormProps,
    TradingExchangeStepType,
} from 'src/types/trading/tradingForm';
import { TradeExchange } from 'src/types/wallet/tradingCommonTypes';
import type { CryptoAmountLimitProps } from 'src/utils/suite/validation';
import {
    createQuoteLink,
    getAmountLimits,
    getSuccessQuotesOrdered,
    tradingGetExchangeReceiveCryptoId,
} from 'src/utils/wallet/trading/exchangeUtils';
import {
    addIdsToQuotes,
    getTradingNetworkDecimals,
    getUnusedAddressFromAccount,
    tradingGetSuccessQuotes,
} from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingExchangeForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingExchangeFormContextProps => {
    const type = 'exchange';
    const isNotFormPage = pageType !== 'form';
    const {
        exchangeInfo,
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        tradingAccount,
        selectedQuote,
        addressVerified,
    } = useSelector(state => state.wallet.trading.exchange);
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);
    const [account, setAccount] = useTradingAccount({
        tradingAccount,
        selectedAccount,
        shouldUseTradingAccount: isPreviousRouteFromTradeSection,
    });
    const { callInProgress, timer, device, setCallInProgress, checkQuotesTimer } =
        useTradingInitializer({ selectedAccount, pageType });
    const { buildDefaultCryptoOption } = useTradingInfo();

    const dispatch = useDispatch();
    const {
        selectedFee: selectedFeeRecomposedAndSigned,
        composed,
        recomposeAndSign,
    } = useTradingRecomposeAndSign();

    const [amountLimits, setAmountLimits] = useState<CryptoAmountLimitProps | undefined>(undefined);

    const [innerQuotes, setInnerQuotes] = useState<ExchangeTrade[] | undefined>(
        tradingGetSuccessQuotes<TradingExchangeType>(quotes),
    );
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [exchangeStep, setExchangeStep] = useState<TradingExchangeStepType>('RECEIVING_ADDRESS');
    const {
        navigateToExchangeForm,
        navigateToExchangeDetail,
        navigateToExchangeOffers,
        navigateToExchangeConfirm,
    } = useTradingNavigation(account);

    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = networks[account.symbol];
    const trades = useSelector(state => state.wallet.trading.trades);
    const trade = trades.find(
        trade =>
            trade.tradeType === 'exchange' && transactionId && trade.data.orderId === transactionId,
    ) as TradeExchange | undefined;

    const { defaultCurrency, defaultValues } = useTradingExchangeFormDefaultValues(account);
    const exchangeDraftKey = 'trading-exchange';
    const { getDraft, saveDraft, removeDraft } =
        useFormDraft<TradingExchangeFormProps>(exchangeDraftKey);
    const draft = getDraft(exchangeDraftKey);
    const isDraft = !!draft;
    const getDraftUpdated = (): TradingExchangeFormProps | null => {
        if (!draft) return null;
        if (isPreviousRouteFromTradeSection) return draft;

        const defaultReceiveCryptoSelect = tradingGetExchangeReceiveCryptoId(
            defaultValues.sendCryptoSelect?.value,
            draft.receiveCryptoSelect?.value,
        );

        return {
            ...defaultValues,
            amountInCrypto: draft.amountInCrypto,
            receiveCryptoSelect: buildDefaultCryptoOption(defaultReceiveCryptoSelect),
            rateType: draft.rateType,
            exchangeType: draft.exchangeType,
        };
    };
    const draftUpdated = getDraftUpdated();
    const methods = useForm({
        mode: 'onChange',
        defaultValues: draftUpdated ?? defaultValues,
    });
    const { reset, register, getValues, setValue, formState, control } = methods;
    const values = useWatch<TradingExchangeFormProps>({ control });
    const { rateType, exchangeType, sendCryptoSelect } = getValues();
    const output = values.outputs?.[0];
    const fiatValues = useTradingFiatValues({
        sendCryptoSelect,
        fiatCurrency: output?.currency?.value as FiatCurrencyCode,
    });
    const fiatOfBestScoredQuote = innerQuotes?.[0]?.sendStringAmount
        ? toFiatCurrency(innerQuotes?.[0]?.sendStringAmount, fiatValues?.fiatRate?.rate, 2)
        : null;

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount;
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = exchangeInfo?.exchangeList?.length === 0;
    const isInitialDataLoading = !exchangeInfo?.exchangeList;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;

    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const decimals = getTradingNetworkDecimals({ sendCryptoSelect, network });

    const { cexQuotes, dexQuotes } = useTradingExchangeQuotesFilter({
        exchangeType,
        rateType,
        quotes,
        exchangeInfo,
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
        account,
        network,
        values: values as TradingExchangeFormProps,
        methods,
    });

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        network,
        quoteCryptoAmount: innerQuotes?.[0]?.sendStringAmount,
        quoteFiatAmount: fiatOfBestScoredQuote ?? '',
        inputNames: {
            cryptoInput: FORM_OUTPUT_AMOUNT,
            fiatInput: FORM_OUTPUT_FIAT,
        },
    });

    const getQuotesRequest = useCallback(async (request: ExchangeTradeQuoteRequest) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const allQuotes = await invityAPI.getExchangeQuotes(
            request,
            abortControllerRef.current.signal,
        );

        return allQuotes;
    }, []);

    const getQuoteRequestData = useCallback((): ExchangeTradeQuoteRequest | null => {
        const { outputs, receiveCryptoSelect, sendCryptoSelect } = getValues();
        const unformattedOutputAmount = outputs[0].amount ?? '';
        const sendStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, decimals)
                : unformattedOutputAmount;

        if (
            !receiveCryptoSelect?.value ||
            !sendCryptoSelect?.value ||
            !sendStringAmount ||
            Number(sendStringAmount) === 0
        ) {
            return null;
        }

        const request: ExchangeTradeQuoteRequest = {
            receive: receiveCryptoSelect.value,
            send: sendCryptoSelect.value,
            sendStringAmount,
            dex: 'enable',
        };

        return request;
    }, [getValues, decimals, shouldSendInSats]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);
            timer.loading();

            const quotesRequest = getQuoteRequestData();

            if (!quotesRequest) {
                setInnerQuotes([]);
                setIsSubmittingHelper(false);
                timer.stop();

                return;
            }

            const allQuotes = await getQuotesRequest(quotesRequest);

            if (Array.isArray(allQuotes)) {
                const currency = cryptoIdToCoinSymbol(quotesRequest.send) ?? quotesRequest.send;
                const limits = getAmountLimits({ quotes: allQuotes, currency });

                const successQuotes = addIdsToQuotes<TradingExchangeType>(
                    getSuccessQuotesOrdered(allQuotes),
                    'exchange',
                );

                setAmountLimits(limits);
                setInnerQuotes(successQuotes);
                dispatch(saveQuotes(successQuotes));
                dispatch(saveQuoteRequest(quotesRequest));

                const { setMaxOutputId } = values;

                // compose transaction only when is not computed from max balance
                // max balance has to be computed before request
                if (setMaxOutputId === undefined && !limits) {
                    composeRequest(FORM_OUTPUT_AMOUNT);
                }
            }

            setIsSubmittingHelper(false);

            timer.reset();
        },
        [
            timer,
            values,
            cryptoIdToCoinSymbol,
            getQuoteRequestData,
            getQuotesRequest,
            dispatch,
            composeRequest,
        ],
    );

    const helpers = useTradingFormActions({
        account,
        methods,
        isNotFormPage,
        draftUpdated,
        type,
        handleChange,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
        setAccountOnChange: newAccount => {
            dispatch(tradingExchangeActions.setTradingExchangeAccount(newAccount));
            setAccount(newAccount);
        },
    });

    const selectQuote = async (quote: ExchangeTrade) => {
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;
        if (quotesRequest) {
            const result = await dispatch(
                tradingExchangeActions.openTradingExchangeConfirmModal(
                    provider?.companyName,
                    quote.isDex,
                    quote.send,
                    quote.receive,
                ),
            );
            if (result) {
                dispatch(tradingExchangeActions.saveSelectedQuote(quote));

                navigateToExchangeConfirm();
                timer.stop();
            }
        }
    };

    const confirmTrade = useCallback(
        async (address: string, extraField?: string, trade?: ExchangeTrade) => {
            analytics.report({
                type: EventType.TradingConfirmTrade,
                payload: {
                    type,
                },
            });

            let ok = false;
            const { address: refundAddress } = getUnusedAddressFromAccount(account);
            if (!trade) {
                trade = selectedQuote;
            }
            if (!quotesRequest || !trade || !refundAddress) return false;

            if (trade.isDex && !trade.fromAddress) {
                trade = { ...trade, fromAddress: refundAddress };
            }

            if (!trade.quoteId) {
                return false;
            }

            setCallInProgress(true);
            dispatch(tradingExchangeActions.saveTransactionId(undefined));

            const returnUrl = await createQuoteLink(
                quotesRequest,
                account,
                { selectedFee: selectedFeeRecomposedAndSigned, composed },
                trade.quoteId,
            );

            const response = await invityAPI.doExchangeTrade({
                trade,
                receiveAddress: address,
                refundAddress,
                extraField,
                returnUrl,
            });

            if (!response) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'No response from the server',
                    }),
                );
            } else if (
                response.error ||
                !response.status ||
                !response.orderId ||
                response.status === 'ERROR'
            ) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: response.error || 'Error response from the server',
                    }),
                );
                dispatch(tradingExchangeActions.saveSelectedQuote(response));
            } else if (
                response.status === 'APPROVAL_REQ' ||
                response.status === 'APPROVAL_PENDING'
            ) {
                dispatch(tradingExchangeActions.saveSelectedQuote(response));
                setExchangeStep('SEND_APPROVAL_TRANSACTION');
                ok = true;
            } else if (response.status === 'CONFIRM') {
                dispatch(tradingExchangeActions.saveSelectedQuote(response));
                if (response.isDex) {
                    if (exchangeStep === 'RECEIVING_ADDRESS' || trade.approvalType === 'ZERO') {
                        setExchangeStep('SEND_APPROVAL_TRANSACTION');
                    } else {
                        setExchangeStep('SEND_TRANSACTION');
                    }
                } else {
                    setExchangeStep('SEND_TRANSACTION');
                }
                ok = true;
            } else {
                // CONFIRMING, SUCCESS
                dispatch(
                    tradingExchangeActions.saveTrade(
                        response,
                        selectedAccount.account,
                        new Date().toISOString(),
                    ),
                );
                dispatch(tradingExchangeActions.saveTransactionId(response.orderId));
                if (response.tradeForm?.form) {
                    dispatch(tradingCommonActions.submitRequestForm(response.tradeForm?.form));

                    return true;
                }
                if (response.status === 'LOADING') {
                    setCallInProgress(false);
                    setExchangeStep('SEND_TRANSACTION');

                    return true;
                }
                ok = true;
                navigateToExchangeDetail();
            }
            setCallInProgress(false);

            return ok;
        },
        [
            account,
            selectedQuote,
            exchangeStep,
            selectedAccount.account,
            composed,
            quotesRequest,
            selectedFeeRecomposedAndSigned,
            dispatch,
            setCallInProgress,
            navigateToExchangeDetail,
        ],
    );

    const sendDexTransaction = async () => {
        if (
            selectedQuote &&
            selectedQuote.dexTx &&
            (selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM')
        ) {
            // after discussion with 1inch, adjust the gas limit by the factor of 1.25
            // swap can use different swap paths when mining tx than when estimating tx
            // the geth gas estimate may be too low
            const result = await recomposeAndSign({
                account,
                address: selectedQuote.dexTx.to,
                amount: selectedQuote.dexTx.value,
                destinationTag: selectedQuote.partnerPaymentExtraId,
                ethereumDataHex: selectedQuote.dexTx.data,
                recalcCustomLimit: true,
                ethereumAdjustGasLimit: selectedQuote.status === 'CONFIRM' ? '1.25' : undefined,
                setMaxOutputId: values.setMaxOutputId,
            });

            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                const { txid } = result.payload;
                const quote = { ...selectedQuote };
                if (selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO') {
                    quote.receiveTxHash = txid;
                    quote.status = 'CONFIRMING';
                    dispatch(
                        tradingExchangeActions.saveTrade(
                            quote,
                            selectedAccount.account,
                            new Date().toISOString(),
                        ),
                    );
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                } else {
                    quote.approvalSendTxHash = txid;
                    quote.status = 'APPROVAL_PENDING';
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                }
            }
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Cannot send transaction, missing data',
                }),
            );
        }
    };

    const sendTransaction = async () => {
        dispatch(tradingCommonActions.setTradingModalAccount(account));

        if (selectedQuote?.isDex) {
            sendDexTransaction();

            return;
        }

        const selectedTrade = trade?.data || selectedQuote;
        // sendAddress may be set by useTradingWatchTrade hook to the trade object
        const sendAddress = selectedTrade?.sendAddress;
        if (
            selectedTrade &&
            selectedTrade.orderId &&
            sendAddress &&
            selectedTrade.sendStringAmount
        ) {
            const sendStringAmount = shouldSendInSats
                ? amountToSmallestUnit(selectedTrade.sendStringAmount, decimals)
                : selectedTrade.sendStringAmount;
            const sendPaymentExtraId =
                selectedTrade.partnerPaymentExtraId || trade?.data?.partnerPaymentExtraId;
            const result = await recomposeAndSign({
                account,
                address: sendAddress,
                amount: sendStringAmount,
                destinationTag: sendPaymentExtraId,
            });
            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                dispatch(
                    tradingExchangeActions.saveTrade(
                        selectedTrade,
                        selectedAccount.account,
                        new Date().toISOString(),
                    ),
                );
                dispatch(tradingExchangeActions.saveTransactionId(selectedTrade.orderId));
                navigateToExchangeDetail();
            }
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Cannot send transaction, missing data',
                }),
            );
        }
    };

    const goToOffers = async () => {
        await handleChange(true);

        navigateToExchangeOffers();
    };

    useTradingLoadData();
    useTradingModalCrypto({
        receiveCurrency: values.receiveCryptoSelect?.value as CryptoId | undefined,
    });

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(exchangeDraftKey, values as TradingExchangeFormProps);
            }
        },
        200,
        [
            saveDraft,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(exchangeDraftKey);

            return;
        }

        if (values.sendCryptoSelect && !values.sendCryptoSelect?.value) {
            removeDraft(exchangeDraftKey);

            return;
        }

        if (values.receiveCryptoSelect && !values.receiveCryptoSelect?.value) {
            removeDraft(exchangeDraftKey);
        }
    }, [defaultValues, values, removeDraft]);

    useEffect(() => {
        if (account.key === tradingAccount?.key) {
            setAccount(tradingAccount);
        }
    }, [account, setAccount, tradingAccount]);

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

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToExchangeForm();

            return;
        }

        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                setExchangeStep('SEND_TRANSACTION');
            }

            dispatch(tradingExchangeActions.setIsFromRedirect(false));
        }

        checkQuotesTimer(handleChange);
    }, [
        quotesRequest,
        isFromRedirect,
        trade,
        transactionId,
        isNotFormPage,
        dispatch,
        navigateToExchangeForm,
        checkQuotesTimer,
        handleChange,
    ]);

    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

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

        device,
        timer,
        callInProgress,
        exchangeInfo,
        quotes: innerQuotes,
        dexQuotes,
        cexQuotes,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        feeInfo,
        amountLimits,
        network,
        exchangeStep,
        receiveAccount,
        selectedQuote,
        addressVerified,
        shouldSendInSats,
        trade,
        setReceiveAccount,
        composeRequest,
        changeFeeLevel,
        removeDraft,
        setAmountLimits,
        goToOffers,
        setExchangeStep,
        sendTransaction,
        verifyAddress: tradingExchangeActions.verifyAddress,
        selectQuote,
        confirmTrade,
    };
};
