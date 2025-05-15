import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { CryptoId, ExchangeTrade, FiatCurrencyCode } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    type TradingExchangeUserConsentProps,
    type TradingSendRejectedProps,
    type TradingSignAndPushSendFormTransactionProps,
    type TradingTransactionExchange,
    exchangeThunks,
    exchangeUtils,
    selectTradingComposedTransactionInfo,
    selectTradingExchange,
    selectTradingExchangeInfo,
    selectTradingTrades,
    tradingThunks,
    useTradingInfo,
} from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { isChanged } from '@trezor/utils';

import { openDeferredModal } from 'src/actions/suite/modalActions';
import { signAndPushSendFormTransactionThunk } from 'src/actions/wallet/send/sendFormThunks';
import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_FIAT } from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingAccountKey } from 'src/hooks/wallet/trading/form/common/useTradingAccountKey';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingExchangeHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingExchangeHandleChange';
import { useTradingExchangeQuotesFilter } from 'src/hooks/wallet/trading/form/common/useTradingExchangeQuotesFilter';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingModalCrypto } from 'src/hooks/wallet/trading/form/common/useTradingModalCrypto';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingExchangeFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingExchangeFormDefaultValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { selectIsTradingTermsDismissed } from 'src/reducers/suite/suiteReducer';
import { Dispatch } from 'src/types/suite';
import { UseTradingFormProps } from 'src/types/trading/trading';
import {
    TradingExchangeConfirmTradeProps,
    TradingExchangeFormContextProps,
} from 'src/types/trading/tradingForm';
import { createQuoteLink } from 'src/utils/wallet/trading/exchangeUtils';
import {
    getTradingCryptoInfo,
    getTradingNetworkDecimals,
} from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingExchangeForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingExchangeFormContextProps => {
    const type = 'exchange';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const {
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        tradingAccountKey,
        selectedQuote,
        addressVerified,
        amountLimits,
        isLoading,
        formStep,
    } = useSelector(selectTradingExchange);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const { selectedFee, composed } = useSelector(selectTradingComposedTransactionInfo);

    const { buildDefaultCryptoOption } = useTradingInfo();
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);
    const [accountKey, setAccountKey] = useTradingAccountKey({
        type,
        tradingAccountKey,
        selectedAccount,
        shouldUseTradingAccountKey: isPreviousRouteFromTradeSection,
    });
    const accountByKey = useSelector(state => selectAccountByKey(state, accountKey));
    const account = accountByKey ?? selectedAccount.account;

    const isTradingTermsDismissed = useSelector(state =>
        selectIsTradingTermsDismissed(state, type),
    );

    const { timer, device, checkQuotesTimer } = useTradingInitializer({
        selectedAccount,
        pageType,
        isLoading,
    });
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
    const {
        navigateToExchangeForm,
        navigateToExchangeDetail,
        navigateToExchangeOffers,
        navigateToExchangeConfirm,
    } = useTradingNavigation(account);

    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = getNetwork(account.symbol);
    const trades = useSelector(selectTradingTrades);
    const trade = trades.find(
        (trade): trade is TradingTransactionExchange =>
            trade.tradeType === 'exchange' &&
            !!transactionId &&
            trade.data.orderId === transactionId,
    );

    const { defaultCurrency, defaultValues } = useTradingExchangeFormDefaultValues(account);
    const exchangeDraftKey = 'trading-exchange';
    const { getDraft, saveDraft, removeDraft } =
        useFormDraft<TradingExchangeFormProps>(exchangeDraftKey);
    const draft = getDraft(exchangeDraftKey);
    const isDraft = !!draft;
    const getDraftUpdated = (): TradingExchangeFormProps | null => {
        if (!draft) return null;
        if (isPreviousRouteFromTradeSection) return draft;

        const defaultReceiveCryptoSelect = exchangeUtils.tradingGetExchangeReceiveCryptoId(
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
    const { rateType, exchangeType, sendCryptoSelect, receiveCryptoSelect } = getValues();
    const output = values.outputs?.[0];
    const fiatValues = useTradingFiatValues({
        sendCryptoSelect,
        fiatCurrency: output?.currency?.value as FiatCurrencyCode,
    });
    const fiatOfBestScoredQuote = quotes?.[0]?.sendStringAmount
        ? toFiatCurrency(quotes?.[0]?.sendStringAmount, fiatValues?.fiatRate?.rate, 2)
        : null;

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount;
    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !exchangeInfo?.providerInfos;
    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const decimals = getTradingNetworkDecimals({ sendCryptoSelect, network });

    const setAmountLimits = (limits: TradingExchangeAmountLimitProps | undefined) => {
        dispatch(tradingExchangeActions.setAmountLimits(limits));
    };

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
        quoteCryptoAmount: quotes?.[0]?.sendStringAmount,
        quoteFiatAmount: fiatOfBestScoredQuote ?? '',
        inputNames: {
            cryptoInput: FORM_OUTPUT_AMOUNT,
            fiatInput: FORM_OUTPUT_FIAT,
        },
    });

    const { handleChange } = useTradingExchangeHandleChange({
        formValues: values as TradingExchangeFormProps,
        network,
        timer,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(FORM_OUTPUT_AMOUNT);
        },
    });

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
            dispatch(tradingExchangeActions.setTradingAccountKey(newAccount.key));
            setAccountKey(newAccount.key);
        },
    });

    const selectQuote = async (quote: ExchangeTrade) => {
        const userConsent = async ({
            provider,
            isDex,
            send,
            receive,
        }: TradingExchangeUserConsentProps) => {
            const {
                label: sendCryptoLabel,
                networkSymbol: sendCryptoNetworkSymbol,
                contractAddress: sendCryptoContractAddress,
            } = getTradingCryptoInfo(sendCryptoSelect);

            const {
                label: receiveCryptoLabel,
                networkSymbol: receiveCryptoNetworkSymbol,
                contractAddress: receiveCryptoContractAddress,
            } = getTradingCryptoInfo(receiveCryptoSelect);

            switch (pageType) {
                case 'form': {
                    analytics.report({
                        type: EventType.TradingExchange,
                        payload: {
                            action: 'continue',
                            step: 'exchange-form',
                            sendCryptoLabel,
                            sendCryptoNetworkSymbol,
                            sendCryptoContractAddress,
                            receiveCryptoLabel,
                            receiveCryptoNetworkSymbol,
                            receiveCryptoContractAddress,
                            exchangeType,
                            exchangeName: provider,
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
                        type: EventType.TradingExchange,
                        payload: {
                            action: 'continue',
                            step: 'offers-form',
                            exchangeType,
                            exchangeName: provider,
                        },
                    });
                    break;
                }
            }

            return (
                isTradingTermsDismissed ||
                Boolean(
                    await dispatch(
                        openDeferredModal({
                            type: isDex ? 'trading-exchange-dex-terms' : 'trading-exchange-terms',
                            provider,
                            fromCryptoCurrency: send,
                            toCryptoCurrency: receive,
                        }),
                    ),
                )
            );
        };

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote,
                timer,

                userConsent,
                nextStep: () => {
                    navigateToExchangeConfirm();

                    analytics.report({
                        type: EventType.TradingExchange,
                        payload: {
                            action: 'continue',
                            step: 'exchange-terms-modal',
                        },
                    });
                },
                onCancel: () => {
                    analytics.report({
                        type: EventType.TradingExchange,
                        payload: {
                            action: 'cancel',
                            step: 'exchange-terms-modal',
                        },
                    });
                },
            }),
        );
    };

    const getCommonFunctions = async (trade?: ExchangeTrade) => {
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
                type: EventType.TradingConfirmTrade,
                payload: { action: type },
            });
        };

        const processResponseData = (response: ExchangeTrade) => {
            dispatch(submitRequestForm(response.tradeForm?.form));
        };

        const nextStep = () => {
            navigateToExchangeDetail();
        };

        return {
            returnUrl,
            triggerAnalyticsTradeConfirmation,
            processResponseData,
            nextStep,
        };
    };

    const confirmTrade = async ({
        receiveAddress,
        extraField,
        trade,
    }: TradingExchangeConfirmTradeProps): Promise<boolean> => {
        const commonFunctions = await getCommonFunctions(trade);

        if (!commonFunctions) return false;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account,
                extraField,
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
        }: TradingSignAndPushSendFormTransactionProps) =>
            await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
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
                    nextStep,
                    processResponseData,
                    triggerAnalyticsTradeConfirmation,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps;

            dispatch(
                notificationsActions.addToast({
                    type: errorTyped.type,
                    error: translationString(errorTyped.error.id, errorTyped.error.values),
                }),
            );

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

        navigateToExchangeOffers();

        const {
            label: sendCryptoLabel,
            networkSymbol: sendCryptoNetworkSymbol,
            contractAddress: sendCryptoContractAddress,
        } = getTradingCryptoInfo(sendCryptoSelect);

        const {
            label: receiveCryptoLabel,
            networkSymbol: receiveCryptoNetworkSymbol,
            contractAddress: receiveCryptoContractAddress,
        } = getTradingCryptoInfo(receiveCryptoSelect);

        analytics.report({
            type: EventType.TradingExchange,
            payload: {
                action: 'continue',
                step: 'exchange-form',
                sendCryptoLabel,
                sendCryptoNetworkSymbol,
                sendCryptoContractAddress,
                receiveCryptoLabel,
                receiveCryptoNetworkSymbol,
                receiveCryptoContractAddress,
                rateType,
                fractionButton: helpers.fractionButton
                    ? `${(100 / helpers.fractionButton).toString()}%`
                    : undefined,
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
                    tradingAction: tradingExchangeActions.verifyAddress.type,
                }),
            );
        };

    // TODO: trading - is it possible to have info data before render?
    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useTradingModalCrypto({
        receiveCurrency: values.receiveCryptoSelect?.value as CryptoId | undefined,
    });
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
        if (!quotesRequest && isNotFormPage) {
            navigateToExchangeForm();

            return;
        }
    }, [isNotFormPage, quotesRequest, navigateToExchangeForm]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
            }

            dispatch(tradingExchangeActions.setIsFromRedirect(false));
        } else {
            if (pageType === 'form') {
                dispatch(tradingExchangeActions.setFormStep('RECEIVING_ADDRESS'));
            }
        }
    }, [dispatch, formStep, isFromRedirect, pageType, trade, transactionId]);

    useEffect(() => {
        checkQuotesTimer(handleChange);
    }, [checkQuotesTimer, handleChange]);

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
        addressVerified,
        shouldSendInSats,
        trade,
        setReceiveAccount,
        composeRequest,
        changeFeeLevel,
        removeDraft,
        setAmountLimits,
        goToOffers,
        sendTransaction,
        signDataAndConfirm,
        verifyAddress,
        selectQuote,
        confirmTrade,
    };
};
