import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BankAccount, CryptoId, SellFiatTrade, SellFiatTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { isChanged } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingSellType,
    TradingTransactionSell,
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getTradingPaymentMethods,
    getTradingQuotesByPaymentMethod,
    getUnusedAddressFromAccount,
    invityAPI,
    tradingGetSuccessQuotes,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { amountToSmallestUnit, formatAmount } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as routerActions from 'src/actions/suite/routerActions';
import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import * as tradingInfoActions from 'src/actions/wallet/tradingInfoActions';
import * as tradingSellActions from 'src/actions/wallet/tradingSellActions';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_PAYMENT_METHOD_SELECT,
} from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingAccountKey } from 'src/hooks/wallet/trading/form/common/useTradingAccountKey';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingSellFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingSellFormDefaultValues';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { useTradingRecomposeAndSign } from 'src/hooks/wallet/useTradingRecomposeAndSign';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    TradingAccountOptionsGroupOptionProps,
    UseTradingFormProps,
} from 'src/types/trading/trading';
import {
    TradingSellFormContextProps,
    TradingSellFormProps,
    TradingSellStepType,
} from 'src/types/trading/tradingForm';
import type { AmountLimitProps } from 'src/utils/suite/validation';
import { createQuoteLink, getAmountLimits } from 'src/utils/wallet/trading/sellUtils';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingSellForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingSellFormContextProps => {
    const type = 'sell';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const {
        sellInfo,
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        tradingAccountKey,
        selectedQuote,
    } = useSelector(state => state.wallet.trading.sell);
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);
    const [accountKey, setAccountKey] = useTradingAccountKey({
        type,
        tradingAccountKey,
        selectedAccount,
        shouldUseTradingAccountKey: isPreviousRouteFromTradeSection,
    });
    const accountByKey = useSelector(state => selectAccountByKey(state, accountKey));
    const account = accountByKey ?? selectedAccount.account;

    const { callInProgress, timer, device, setCallInProgress, checkQuotesTimer } =
        useTradingInitializer({ selectedAccount, pageType });
    const paymentMethods = useSelector(state => state.wallet.trading.info.paymentMethods);

    const {
        selectedFee: selectedFeeRecomposedAndSigned,
        composed,
        recomposeAndSign,
    } = useTradingRecomposeAndSign();
    const { navigateToSellForm, navigateToSellOffers, navigateToSellConfirm } =
        useTradingNavigation(account);

    const { symbol } = account;
    const localCurrency = useSelector(selectLocalCurrency);
    const network = networks[account.symbol];
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const trades = useSelector(state => state.wallet.trading.trades);
    const trade = trades.find(
        (trade): trade is TradingTransactionSell =>
            trade.tradeType === 'sell' && trade.key === transactionId,
    );

    const [amountLimits, setAmountLimits] = useState<AmountLimitProps | undefined>(undefined);
    const [sellStep, setSellStep] = useState<TradingSellStepType>('BANK_ACCOUNT');
    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(
        tradingGetSuccessQuotes<TradingSellType>(quotes),
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useTradingSellFormDefaultValues(account, sellInfo);
    const sellDraftKey = 'trading-sell';
    const { saveDraft, getDraft, removeDraft } = useFormDraft<TradingSellFormProps>(sellDraftKey);
    const draft = getDraft(sellDraftKey);
    const getDraftUpdated = (): TradingSellFormProps | null => {
        if (!draft) return null;
        if (isPreviousRouteFromTradeSection) {
            const outputs = draft.outputs?.map(output => ({
                ...output,
                fiat: output.fiat ?? '',
            }));

            return {
                ...draft,
                outputs,
            };
        }

        return {
            ...defaultValues,
            paymentMethod: draft.paymentMethod,
            countrySelect: draft.countrySelect,
            amountInCrypto: draft.amountInCrypto,
        };
    };
    const draftUpdated = getDraftUpdated();

    const isDraft = !!draft;
    const methods = useForm<TradingSellFormProps>({
        mode: 'onChange',
        defaultValues: draftUpdated ? draftUpdated : defaultValues,
    });
    const { register, setValue, reset, control, formState } = methods;
    const values = useWatch<TradingSellFormProps>({ control });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const output = values.outputs?.[0];
    const hasValues = !!output?.amount;
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = sellInfo?.sellList?.providers.length === 0;
    const isInitialDataLoading = !sellInfo?.sellList;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingSellType>(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );
    const decimals = getTradingNetworkDecimals({
        sendCryptoSelect: values.sendCryptoSelect as
            | TradingAccountOptionsGroupOptionProps
            | undefined,
        network,
    });

    const {
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
    } = useTradingComposeTransaction<TradingSellFormProps>({
        account,
        network,
        values: values as TradingSellFormProps,
        methods,
    });

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher<TradingSellFormProps>({
        account,
        methods,
        network,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.cryptoStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        inputNames: {
            cryptoInput: FORM_OUTPUT_AMOUNT,
            fiatInput: FORM_OUTPUT_FIAT,
        },
    });

    const getQuotesRequest = useCallback(async (request: SellFiatTradeQuoteRequest) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const allQuotes = await invityAPI.getSellQuotes(request, abortControllerRef.current.signal);

        return allQuotes;
    }, []);

    const getQuoteRequestData = useCallback((): SellFiatTradeQuoteRequest | null => {
        const { outputs, countrySelect, sendCryptoSelect, amountInCrypto } = methods.getValues();

        const fiatStringAmount = outputs[0].fiat ?? '';
        const unformattedOutputAmount = outputs[0].amount ?? '';
        const cryptoStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, decimals)
                : unformattedOutputAmount;
        const currencySelect = outputs[0].currency ?? '';
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto,
            cryptoCurrency: sendCryptoSelect?.value ?? (FORM_DEFAULT_CRYPTO_CURRENCY as CryptoId),
            fiatCurrency: currencySelect.value.toUpperCase(),
            country: countrySelect.value,
            cryptoStringAmount,
            fiatStringAmount,
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        };

        if (
            !request.fiatStringAmount &&
            (!request.cryptoStringAmount || Number(request.cryptoStringAmount) === 0)
        ) {
            return null;
        }

        return request;
    }, [methods, decimals, shouldSendInSats]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);
            timer.loading();

            const quoteRequest = getQuoteRequestData();

            if (!quoteRequest) {
                setInnerQuotes([]);
                setIsSubmittingHelper(false);
                timer.stop();

                return;
            }

            const allQuotes = await getQuotesRequest(quoteRequest);

            if (Array.isArray(allQuotes)) {
                const currency =
                    cryptoIdToCoinSymbol(quoteRequest.cryptoCurrency) ??
                    quoteRequest.cryptoCurrency;
                const limits = getAmountLimits({
                    request: quoteRequest,
                    quotes: allQuotes,
                    currency,
                });

                const quotesDefault = filterQuotesAccordingTags<TradingSellType>(
                    addIdsToQuotes<TradingSellType>(allQuotes, 'sell'),
                );
                // without errors
                const quotesSuccess = tradingGetSuccessQuotes<TradingSellType>(quotesDefault) ?? [];

                const bestQuote = quotesSuccess?.[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
                const bestQuotePaymentMethodName =
                    bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
                const paymentMethodSelected = values.paymentMethod?.value;
                const paymentMethodsFromQuotes =
                    getTradingPaymentMethods<TradingSellType>(quotesSuccess);
                const isSelectedPaymentMethodAvailable =
                    paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                    undefined;

                setInnerQuotes(quotesSuccess);
                dispatch(tradingSellActions.saveQuotes(quotesSuccess));
                dispatch(tradingSellActions.saveQuoteRequest(quoteRequest));
                dispatch(tradingInfoActions.savePaymentMethods(paymentMethodsFromQuotes));
                setAmountLimits(limits);

                if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                    setValue(FORM_PAYMENT_METHOD_SELECT, {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethodName ?? '',
                    });
                }

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
            values,
            timer,
            cryptoIdToCoinSymbol,
            getQuoteRequestData,
            getQuotesRequest,
            dispatch,
            setValue,
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
            dispatch(tradingSellActions.setTradingSellAccountKey(newAccount.key));
            setAccountKey(newAccount.key);
        },
    });

    const doSellTrade = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;
        setCallInProgress(true);
        // orderId is part of the quote link if redirect to payment gate with a concrete quote
        // without the orderId the return link will point to offers
        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;
        const returnUrl = await createQuoteLink(
            quotesRequest,
            account,
            { selectedFee: selectedFeeRecomposedAndSigned, composed },
            orderId,
        );

        const response = await invityAPI.doSellTrade({
            trade: { ...quote, refundAddress: getUnusedAddressFromAccount(account).address },
            returnUrl,
        });

        if (response.trade) {
            if (response.trade.error && response.trade.status !== 'LOGIN_REQUEST') {
                console.log(`[doSellTrade] ${response.trade.error}`);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: response.trade.error,
                    }),
                );
                setCallInProgress(false);

                return undefined;
            }
            if (
                response.trade.status === 'LOGIN_REQUEST' ||
                response.trade.status === 'SITE_ACTION_REQUEST' ||
                (response.trade.status === 'SUBMITTED' && provider.flow === 'PAYMENT_GATE')
            ) {
                if (provider.flow === 'PAYMENT_GATE') {
                    dispatch(
                        tradingSellActions.saveTrade(
                            response.trade,
                            selectedAccount.account,
                            new Date().toISOString(),
                        ),
                    );
                    dispatch(tradingSellActions.saveTransactionId(response.trade.orderId));
                    dispatch(tradingSellActions.saveSelectedQuote(response.trade));
                    setSellStep('SEND_TRANSACTION');
                }
                dispatch(tradingCommonActions.submitRequestForm(response.tradeForm?.form));
                setCallInProgress(false);

                return undefined;
            }
            setCallInProgress(false);

            return response.trade;
        }
        const errorMessage = 'No response from the server';
        console.log(`[doSellTrade] ${errorMessage}`);
        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: errorMessage,
            }),
        );
        setCallInProgress(false);
    };
    const needToRegisterOrVerifyBankAccount = (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : null;
        // for BANK_ACCOUNT flow a message is shown if bank account is not verified
        if (provider?.flow === 'BANK_ACCOUNT') {
            return (
                !!quote.quoteId && !(quote.bankAccounts && quote.bankAccounts.some(b => b.verified))
            );
        }

        return false;
    };

    const goToOffers = async () => {
        await handleChange(true);

        dispatch(tradingSellActions.setTradingSellAccountKey(account.key)); // save account for offers page
        navigateToSellOffers();
    };

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : null;

        if (quotesRequest) {
            const result = await dispatch(
                tradingSellActions.openTradingSellConfirmModal(
                    provider?.companyName,
                    quote.cryptoCurrency,
                ),
            );

            if (result) {
                dispatch(tradingSellActions.saveSelectedQuote(quote));
                timer.stop();

                navigateToSellConfirm();
            }
        }
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;

        analytics.report({
            type: EventType.TradingConfirmTrade,
            payload: {
                type,
            },
        });

        const quote = { ...selectedQuote, bankAccount };
        const response = await doSellTrade(quote);
        if (response) {
            dispatch(tradingSellActions.saveSelectedQuote(response));
            setSellStep('SEND_TRANSACTION');
        }
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;
        await doSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        dispatch(tradingCommonActions.setTradingModalAccountKey(account.key));

        const selectedTrade = trade?.data || selectedQuote;
        // destinationAddress may be set by useTradingWatchTrade hook to the trade object
        const destinationAddress =
            selectedTrade?.destinationAddress || trade?.data?.destinationAddress;
        if (
            selectedTrade &&
            selectedTrade.orderId &&
            destinationAddress &&
            selectedTrade.cryptoStringAmount
        ) {
            const cryptoStringAmount = shouldSendInSats
                ? amountToSmallestUnit(selectedTrade.cryptoStringAmount, decimals)
                : selectedTrade.cryptoStringAmount;
            const destinationPaymentExtraId =
                selectedTrade.destinationPaymentExtraId || trade?.data?.destinationPaymentExtraId;
            const result = await recomposeAndSign({
                account,
                address: destinationAddress,
                amount: cryptoStringAmount,
                destinationTag: destinationPaymentExtraId,
            });
            if (result?.success) {
                // send txid to the server as confirmation
                const { txid } = result.payload;
                const quote: SellFiatTrade = {
                    ...selectedTrade,
                    txid,
                    destinationAddress,
                    destinationPaymentExtraId,
                };
                const response = await invityAPI.doSellConfirm(quote);
                if (!response) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: 'No response from the server',
                        }),
                    );
                } else if (response.error || !response.status || !response.orderId) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: response.error || 'Invalid response from the server',
                        }),
                    );
                }

                dispatch(
                    tradingSellActions.saveTrade(
                        response,
                        selectedAccount.account,
                        new Date().toISOString(),
                    ),
                );
                dispatch(tradingSellActions.saveTransactionId(selectedTrade.orderId));
                dispatch(
                    routerActions.goto('wallet-trading-sell-detail', {
                        params: {
                            symbol: selectedAccount.account.symbol,
                            accountIndex: selectedAccount.account.index,
                            accountType: selectedAccount.account.accountType,
                        },
                    }),
                );
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

    useTradingLoadData();

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(sellDraftKey);

            return;
        }

        if (!values.outputs?.[0]?.currency?.value) {
            removeDraft(sellDraftKey);
        }
    }, [defaultValues, values, removeDraft]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got sellInfo from Invity API server
        if (!isDraft && sellInfo && !formState.isDirty) {
            reset(defaultValues);
        }
    }, [reset, sellInfo, defaultValues, isDraft, isNotFormPage, formState.isDirty]);

    useDebounce(
        () => {
            // saving draft after validation & transaction composing & when sellInfo is available
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing &&
                sellInfo
            ) {
                saveDraft(sellDraftKey, values as TradingSellFormProps);
            }
        },
        200,
        [
            saveDraft,
            sellDraftKey,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    useDebounce(() => {
        if (selectedQuote && pageType === 'confirm') {
            // empty quoteId means the partner requests login first, requestTrade to get login screen
            if (!selectedQuote.quoteId || needToRegisterOrVerifyBankAccount(selectedQuote)) {
                doSellTrade(selectedQuote);
            }
        }
    }, 50);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToSellForm();

            return;
        }

        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                setSellStep('SEND_TRANSACTION');
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }

        checkQuotesTimer(handleChange);
    }, [
        quotesRequest,
        isFromRedirect,
        timer,
        transactionId,
        trades,
        trade,
        isNotFormPage,
        dispatch,
        navigateToSellForm,
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
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        sellInfo,
        quotesRequest,
        quotes: quotesByPaymentMethod,
        callInProgress,
        composedLevels,
        localCurrencyOption,
        feeInfo,
        isComposing,
        amountLimits,
        network,
        device,
        timer,
        sellStep,
        selectedQuote,
        shouldSendInSats,
        trade,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,

        setSellStep,
        addBankAccount,
        confirmTrade,
        goToOffers,
        needToRegisterOrVerifyBankAccount,
        selectQuote,
        sendTransaction,
    };
};
