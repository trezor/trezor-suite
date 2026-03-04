import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDebounce } from 'react-use';

import type { DexApprovalType, ExchangeTrade, FiatCurrencyCode } from 'invity-api';

import { events } from '@suite/analytics';
import { TranslationKey, useTranslation } from '@suite/intl';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { notificationsActions } from '@suite-common/toast-notifications';
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
    TradingExchangeType,
    type TradingSendRejectedProps,
    type TradingSignAndPushSendFormTransactionProps,
    type TradingTransactionExchange,
    cryptoIdToNetwork,
    exchangeThunks,
    invityAPI,
    isSendingEvmNativeToken,
    selectTradingComposedTransactionInfo,
    selectTradingExchange,
    selectTradingExchangeInfo,
    selectTradingIsSlip24Allowed,
    selectTradingTrades,
    selectTradingVerifiedAddress,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork, getNetworkType } from '@suite-common/wallet-config';
import {
    ETHEREUM_ADJUST_GAS_LIMIT,
    fetchAndUpdateAccountThunk,
    updateFeeInfoThunk,
    useFormDraft,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

import { goto } from 'src/actions/suite/routerActions';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
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
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { Dispatch } from 'src/types/suite';
import { UseTradingFormCommonProps } from 'src/types/trading/trading';
import {
    TradingExchangeConfirmTradeProps,
    TradingExchangeFormContextProps,
} from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/exchangeUtils';

import { useTradingAssetDecimals } from './common/useTradingAssetDecimals';
import { useTradingInitializer } from './common/useTradingInitializer';
import { useTradingPreviousRoute } from './common/useTradingPreviousRoute';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingExchangeForm = ({
    pageType = 'form',
}: UseTradingFormCommonProps): TradingExchangeFormContextProps => {
    const analytics = useAnalytics();
    const type = 'exchange';
    const isFormPage = pageType === 'form';
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const {
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        selectedQuote,
        preselectedQuote,
        amountLimits,
        isLoading,
    } = useSelector(selectTradingExchange);
    const verifiedAddress = useSelector(selectTradingVerifiedAddress);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { selectedFee, composed } = composedTransactionInfo;
    const { account, tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);

    // used for disabling approve/revoke controls when
    // quotes are scheduled to refresh after changing swap form inputs
    const [isScheduledQuotesRefresh, setIsScheduledQuotesRefresh] = useState(false);
    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { timer, device, checkQuotesTimer } = useTradingInitializer({
        pageType,
        isLoading,
    });

    const [isApproval, setIsApproval] = useState<boolean>(false);
    const [approvalInitiated, setApprovalInitiated] = useState<boolean>(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);

    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
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

    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = getNetwork(account.symbol);
    const trades = useSelector(selectTradingTrades);
    const trade = useMemo(
        () =>
            trades.find(
                (trade): trade is TradingTransactionExchange =>
                    trade.tradeType === 'exchange' &&
                    !!transactionId &&
                    trade.data.orderId === transactionId,
            ),
        [trades, transactionId],
    );

    const { defaultCurrency, defaultValues } = useTradingExchangeFormDefaultValues(
        accountKey,
        cryptoId,
    );

    const { draft, saveDraft, removeDraft } =
        useFormDraft<TradingExchangeFormProps>('trading-exchange');
    const isDraft = !!draft;

    const getDraftUpdated = (): TradingExchangeFormProps | null => {
        if (draft && isPreviousRouteFromTradeSection) return draft;

        return null;
    };
    const draftUpdated = getDraftUpdated();
    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues: draftUpdated ?? defaultValues,
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
        isPreviousRouteFromTradeSection,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
        pageType,
    });
    const { receiveAddress, extraField } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    useTradingFiatValues({
        cryptoId: receiveCryptoSelect?.id,
        amount: selectedQuote?.receiveStringAmount,
        fiatCurrency: output?.currency?.value as FiatCurrencyCode | undefined,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount && !!values.receiveCryptoSelect;
    const isAmountEmpty = output?.amount === '';
    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !exchangeInfo?.providerInfos;
    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: sendCryptoSelect?.accountKey,
                cryptoId: sendCryptoSelect?.id,
            }),
        [getAssetDecimals, sendCryptoSelect?.accountKey, sendCryptoSelect?.id],
    );

    const setAmountLimits = useCallback(
        (limits: TradingExchangeAmountLimitProps | undefined) => {
            dispatch(tradingExchangeActions.setAmountLimits(limits));
        },
        [dispatch],
    );

    const { cexQuotes, dexQuotes } = useTradingExchangeQuotesFilter({
        exchangeType,
        quotes,
        exchangeInfo,
        setValue,
    });

    const {
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
        isComposing,
    } = useTradingComposeTransaction<TradingExchangeFormProps>({
        type: 'exchange',
        account,
        network,
        values,
        methods,
        setShowReserveBanner,
    });

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
        timer,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
        setApprovalInitiated,
        setIsScheduledQuotesRefresh,
    });

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
            dispatch(tradingExchangeActions.setTradingAccountKey(newAccount.key));
        },
        composedLevels,
        composedTransactionInfo,
        setShowReserveBanner,
    });

    const selectQuote = async (quote: ExchangeTrade) => {
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;

        switch (pageType) {
            case 'form': {
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
                        receiveCryptoContractAddress:
                            receiveCryptoSelect?.contractAddress ?? undefined,
                        exchangeType,
                        exchangeName: provider?.companyName,
                        rateType,
                        fractionButton: helpers.fractionButton
                            ? `${(100 / helpers.fractionButton).toString()}%`
                            : undefined,
                    },
                });
                break;
            }
            case 'offers': {
                analytics.report({
                    type: events.tradeExchangeEvent.name,
                    payload: {
                        action: 'continue',
                        step: 'offers-form',
                        exchangeType,
                        exchangeName: provider?.companyName,
                    },
                });
                break;
            }
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote,
                timer,
                nextStep: () => {
                    dispatch(goto('wallet-trading-exchange-confirm'));
                },
            }),
        );
    };

    const getCommonFunctions = useCallback(
        async (trade?: ExchangeTrade) => {
            const quoteId = trade?.quoteId ?? selectedQuote?.quoteId;

            if (!quotesRequest || !quoteId) return;

            const returnUrl = await createQuoteLink(
                quotesRequest,
                account,
                { selectedFee, composed },
                quoteId,
            );

            const triggerAnalyticsTradeConfirmation = () => {
                analytics.report({
                    type: events.tradeConfirmTradeEvent.name,
                    payload: { action: type },
                });
            };

            const processResponseData = (response: ExchangeTrade) => {
                dispatch(submitRequestForm(response.tradeForm?.form));
            };

            const nextStep = () => {
                dispatch(goto('wallet-trading-exchange-detail'));
            };

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            };
        },
        [
            selectedQuote?.quoteId,
            quotesRequest,
            account,
            selectedFee,
            composed,
            analytics,
            dispatch,
        ],
    );

    const confirmTrade = async ({
        receiveAddress,
        trade,
        ...props
    }: TradingExchangeConfirmTradeProps): Promise<ExchangeTrade | undefined> => {
        const commonFunctions = await getCommonFunctions(trade);

        if (!commonFunctions) return undefined;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account,
                extraField: props.extraField ?? extraField,
                trade,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        ).unwrap();
    };

    const sendTransaction = async () => {
        const commonFunctions = await getCommonFunctions(trade?.data);

        if (!commonFunctions) {
            return false;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

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
                exchangeThunks.sendTransactionThunk({
                    account,
                    trade: trade?.data,
                    returnUrl,
                    setMaxOutputId: values.setMaxOutputId,
                    decimals,
                    shouldSendInSats,
                    // TODO: slip24 - exclude from debug mode
                    isSlip24Active,
                    nextStep,
                    processResponseData,
                    triggerAnalyticsTradeConfirmation,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps<TranslationKey>;

            if (errorTyped.type !== 'sign-transaction-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: errorTyped.type,
                        error: translationString(errorTyped.error.id, errorTyped.error.values),
                    }),
                );
            }

            return false;
        }
    };

    const signDataAndConfirm = async () => {
        const commonFunctions = await getCommonFunctions(trade?.data);

        if (!commonFunctions) return;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        await dispatch(
            exchangeThunks.signDataAndConfirmThunk({
                account,
                device,
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        );
    };

    const goToOffers = async () => {
        await handleChange();

        dispatch(goto('wallet-trading-exchange-offers'));

        analytics.report({
            type: events.tradeCompareOffersEvent.name,
            payload: {
                type: 'exchange',
            },
        });
    };

    const verifyAddress =
        (account: Account, address: string | undefined, path: string | undefined) =>
        async (dispatch: Dispatch) => {
            await dispatch(
                tradingThunks.verifyAddressThunk({
                    account,
                    address,
                    path,
                }),
            );
        };

    const confirmApproval = async ({
        trade,
        receiveAddress,
    }: {
        trade?: ExchangeTrade;
        receiveAddress: string;
    }) => {
        const commonFunctions = await getCommonFunctions(trade);
        if (!commonFunctions) return undefined;
        const { processResponseData } = commonFunctions;

        return await dispatch(
            exchangeThunks.confirmApprovalThunk({
                receiveAddress,
                account,
                extraField,
                trade,
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

    const approveTransaction = async (trade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        setApprovalInitiated(true);

        const newTrade = await confirmApproval({
            trade: { ...trade, status: 'CONFIRM' },
            receiveAddress,
        });

        return !!newTrade;
    };

    const revokeApproval = async (trade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        setApprovalInitiated(true);

        const approvalType: DexApprovalType = 'ZERO';
        const updatedTrade: ExchangeTrade = {
            ...trade,
            approvalType,
            status: trade.status === 'APPROVAL_REQ' ? 'APPROVAL_REQ' : 'CONFIRM',
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedTrade));

        const newTrade = await confirmApproval({
            trade: updatedTrade,
            receiveAddress,
        });

        return !!newTrade;
    };

    const resetSelectedOffer = useCallback(() => {
        dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        setIsScheduledQuotesRefresh(true);
    }, [dispatch]);

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
        const networkType = getNetworkType(account.symbol);

        switch (networkType) {
            case 'ethereum':
            case 'solana':
            case 'ripple':
            case 'stellar':
                return setValueRef.current('fromAddress', account.descriptor);
            default:
                return setValueRef.current('fromAddress', undefined);
        }
    }, [account.symbol, account.descriptor, setValueRef]);

    // set transactionData from DEX quote for correct fees fetching
    useEffect(() => {
        if (pageType !== 'form') return;
        if (!sendCryptoSelect?.id) return;
        if (isFormLoading || isLoadingQuote) return;

        if (exchangeType !== TRADING_EXCHANGE_FORM_DEX) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const network = cryptoIdToNetwork(sendCryptoSelect.id);
        const isEvmNativeToken = isSendingEvmNativeToken(sendCryptoSelect.id);
        const requiresApproval = network?.networkType === 'ethereum' && !isEvmNativeToken;

        const quote = preselectedQuote ?? (requiresApproval ? selectedQuote : dexQuotes[0]);

        if (!quote || !quote.dexTx) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const { dexTx } = quote;

        setValue('transactionData', dexTx.data);
        setValue(TRADING_FORM_OUTPUT_ADDRESS, dexTx.to);
        setValue('ethereumAdjustGasLimit', ETHEREUM_ADJUST_GAS_LIMIT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dexQuotes,
        selectedQuote,
        preselectedQuote,
        exchangeType,
        isApproval,
        sendCryptoSelect,
        isFormLoading,
        isLoadingQuote,
    ]);

    const fetchFeesAndComposeRef = useCurrentRef(fetchFeesAndCompose);
    // fetch fees when transactionData changes
    useEffect(() => {
        if (pageType !== 'form') return;

        fetchFeesAndComposeRef.current();
    }, [transactionData, outputAddress, ethereumAdjustGasLimit, pageType, fetchFeesAndComposeRef]);

    useEffect(() => {
        setValueRef.current('receiveAddress', receiveAddress);
    }, [receiveAddress, setValueRef]);

    useEffect(() => {
        setValueRef.current('extraField', extraField);
    }, [extraField, setValueRef]);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useEffect(() => {
        if (!preselectedQuote) {
            return;
        }

        const preselectedProvider = preselectedQuote.exchange;
        if (preselectedProvider && preselectedProvider !== provider) {
            setValue(TRADING_FORM_PROVIDER_SELECT, preselectedProvider);
        }

        const preselectedFormType = preselectedQuote.isDex
            ? TRADING_EXCHANGE_FORM_DEX
            : TRADING_EXCHANGE_FORM_CEX;
        if (preselectedFormType !== exchangeType) {
            setValue(TRADING_EXCHANGE_FORM, preselectedFormType);
        }

        dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
    }, [dispatch, preselectedQuote, provider, setValue, exchangeType]);

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(values);
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
        if (!isPreviousRouteFromTradeSection) {
            removeDraft();
        }
    }, [isPreviousRouteFromTradeSection, removeDraft]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('setMaxOutputId');
    }, [register]);

    // when draft doesn't exist, we need to bind actual default values - that happens when we've got exchangeInfo from Invity API server
    useEffect(() => {
        if (!isDraft && exchangeInfo && isInitialDataLoading) {
            reset(defaultValues);
        }
    }, [reset, isDraft, exchangeInfo, defaultValues, isInitialDataLoading]);

    useEffect(() => {
        if (!quotesRequest && !isFormPage) {
            dispatch(goto('wallet-trading-exchange'));

            return;
        }
    }, [isFormPage, quotesRequest, dispatch]);

    useEffect(() => {
        if (preselectedQuote || approvalInitiated) return;

        checkQuotesTimer(handleChange);
    }, [checkQuotesTimer, handleChange, preselectedQuote, approvalInitiated]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
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
        timer,
        exchangeInfo,
        quotes,
        dexQuotes,
        cexQuotes,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        feeInfo,
        amountLimits,
        network,
        receiveAccount,
        selectedQuote,
        preselectedQuote,
        verifiedAddress,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        setReceiveAccount,
        composeRequest,
        composedTransactionInfo,
        changeFeeLevel,
        setAmountLimits,
        goToOffers,
        sendTransaction,
        signDataAndConfirm,
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
