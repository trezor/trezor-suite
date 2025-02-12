import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { BuyTrade, BuyTradeQuoteRequest, CryptoId } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';

import { isChanged } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingBuyType,
    addIdsToQuotes,
    buyUtils,
    cryptoIdToNetwork,
    filterQuotesAccordingTags,
    getTradingPaymentMethods,
    getTradingQuotesByPaymentMethod,
    invityAPI,
    tradingGetSuccessQuotes,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { isDesktop } from '@trezor/env-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as routerActions from 'src/actions/suite/routerActions';
import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import * as tradingBuyActions from 'src/actions/wallet/tradingBuyActions';
import * as tradingInfoActions from 'src/actions/wallet/tradingInfoActions';
import {
    FORM_CRYPTO_INPUT,
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_FIAT_INPUT,
    FORM_PAYMENT_METHOD_SELECT,
} from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingModalCrypto } from 'src/hooks/wallet/trading/form/common/useTradingModalCrypto';
import { useTradingPreviousRoute } from 'src/hooks/wallet/trading/form/common/useTradingPreviousRoute';
import { useTradingBuyFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingBuyFormDefaultValues';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { UseTradingFormProps } from 'src/types/trading/trading';
import { TradingBuyFormContextProps, TradingBuyFormProps } from 'src/types/trading/tradingForm';
import type { AmountLimitProps } from 'src/utils/suite/validation';
import { createQuoteLink, createTxLink } from 'src/utils/wallet/trading/buyUtils';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingInitializer } from './common/useTradingInitializer';

export const useTradingBuyForm = ({
    selectedAccount,
    pageType = 'form',
}: UseTradingFormProps): TradingBuyFormContextProps => {
    const type = 'buy';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const { addressVerified, buyInfo, isFromRedirect, quotes, quotesRequest, selectedQuote } =
        useSelector(state => state.wallet.trading.buy);
    const paymentMethods = useSelector(state => state.wallet.trading.info.paymentMethods);
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const { callInProgress, account, timer, device, setCallInProgress, checkQuotesTimer } =
        useTradingInitializer({ selectedAccount, pageType });
    const { navigateToBuyForm, navigateToBuyOffers, navigateToBuyConfirm } =
        useTradingNavigation(account);

    // states
    const [amountLimits, setAmountLimits] = useState<AmountLimitProps | undefined>(undefined);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        isNotFormPage ? quotes : undefined,
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isPreviousRouteFromTradeSection = useTradingPreviousRoute(type);

    const {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    } = useTradingBuyFormDefaultValues(account.symbol, buyInfo);
    const buyDraftKey = account.key;
    const { saveDraft, getDraft, removeDraft } = useFormDraft<TradingBuyFormProps>('trading-buy');
    const draft = getDraft(buyDraftKey);
    const draftUpdated: TradingBuyFormProps | null = draft
        ? {
              ...draft,
              fiatInput:
                  draft.fiatInput && draft.fiatInput !== ''
                      ? draft.fiatInput
                      : buyInfo?.buyInfo?.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
              // remember only for offers page
              cryptoSelect: isPreviousRouteFromTradeSection
                  ? draft.cryptoSelect
                  : defaultValues.cryptoSelect,
          }
        : null;

    const isDraft = !!draftUpdated || !!isNotFormPage;
    const methods = useForm<TradingBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft && draftUpdated ? draftUpdated : defaultValues,
    });
    const { register, control, formState, reset, setValue, handleSubmit } = methods;
    const values = useWatch<TradingBuyFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isNotFormPage ? draftUpdated : null);

    const isInitialDataLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders = !isInitialDataLoading && buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFirstRequest = innerQuotes === undefined;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<TradingBuyType>(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network =
        cryptoIdToNetwork(
            (values.cryptoSelect?.value as CryptoId) ?? FORM_DEFAULT_CRYPTO_CURRENCY,
        ) ?? networks.btc;

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.receiveStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        network,
        inputNames: {
            cryptoInput: FORM_CRYPTO_INPUT,
            fiatInput: FORM_FIAT_INPUT,
        },
    });

    const getQuotesRequest = useCallback(
        async (request: BuyTradeQuoteRequest, offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amount is not set
            if (
                (!request.fiatStringAmount && !request.cryptoStringAmount) ||
                !request.receiveCurrency
            ) {
                timer.stop();
                setIsSubmittingHelper(false);

                return;
            }

            abortControllerRef.current = new AbortController();

            const allQuotes = await invityAPI.getBuyQuotes(
                request,
                abortControllerRef.current.signal,
            );

            return allQuotes;
        },
        [timer],
    );

    const getQuoteRequestData = useCallback((): BuyTradeQuoteRequest => {
        const {
            fiatInput,
            cryptoInput,
            currencySelect,
            cryptoSelect,
            countrySelect,
            amountInCrypto,
        } = methods.getValues();
        const decimals = getTradingNetworkDecimals({ network });
        const cryptoStringAmount =
            cryptoInput && shouldSendInSats ? formatAmount(cryptoInput, decimals) : cryptoInput;

        const request = {
            wantCrypto: amountInCrypto,
            fiatCurrency: currencySelect
                ? currencySelect?.value.toUpperCase()
                : quotesRequest?.fiatCurrency ?? '',
            receiveCurrency: cryptoSelect?.value ?? quotesRequest?.receiveCurrency,
            country: countrySelect?.value ?? quotesRequest?.country,
            fiatStringAmount: fiatInput ?? quotesRequest?.fiatStringAmount,
            cryptoStringAmount: cryptoStringAmount ?? quotesRequest?.cryptoStringAmount,
        };

        return request;
    }, [methods, network, shouldSendInSats, quotesRequest]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            timer.loading();

            const quoteRequest = getQuoteRequestData();
            const allQuotes = await getQuotesRequest(quoteRequest, offLoading);

            if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
                timer.stop();
                setInnerQuotes([]);
                setIsSubmittingHelper(false);

                return;
            }

            // processed quotes and without alternative quotes
            const quotesDefault = filterQuotesAccordingTags<TradingBuyType>(
                addIdsToQuotes<TradingBuyType>(allQuotes, 'buy'),
            );
            // without errors
            const quotesSuccess = tradingGetSuccessQuotes<TradingBuyType>(quotesDefault) ?? [];

            const bestQuote = quotesSuccess?.[0];
            const bestQuotePaymentMethod = bestQuote?.paymentMethod;
            const bestQuotePaymentMethodName =
                bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
            const paymentMethodSelected = values.paymentMethod?.value;
            const paymentMethodsFromQuotes =
                getTradingPaymentMethods<TradingBuyType>(quotesSuccess);
            const isSelectedPaymentMethodAvailable =
                paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                undefined;
            const symbol =
                cryptoIdToCoinSymbol(quoteRequest.receiveCurrency) ?? quoteRequest.receiveCurrency;
            const limits = buyUtils.getAmountLimits({
                request: quoteRequest,
                quotes: quotesDefault,
                currency: symbol,
            }); // from all quotes except alternative

            setInnerQuotes(quotesSuccess);
            dispatch(tradingBuyActions.saveQuotes(quotesSuccess));
            dispatch(tradingBuyActions.saveQuoteRequest(quoteRequest));
            dispatch(tradingInfoActions.savePaymentMethods(paymentMethodsFromQuotes));
            setAmountLimits(limits);

            if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                setValue(FORM_PAYMENT_METHOD_SELECT, {
                    value: bestQuotePaymentMethod ?? '',
                    label: bestQuotePaymentMethodName ?? '',
                });
            }

            setIsSubmittingHelper(false);
            timer.reset();
        },
        [
            timer,
            values.paymentMethod?.value,
            cryptoIdToCoinSymbol,
            getQuoteRequestData,
            getQuotesRequest,
            dispatch,
            setValue,
        ],
    );

    const goToOffers = async () => {
        await handleChange();

        navigateToBuyOffers();
    };

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;
        if (quotesRequest) {
            const result = await dispatch(
                tradingBuyActions.openTradingBuyConfirmModal(
                    provider?.companyName,
                    cryptoIdToCoinSymbol(quote.receiveCurrency!),
                ),
            );

            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const returnUrl = await createQuoteLink(quotesRequest, account);
                    const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            dispatch(
                                tradingCommonActions.submitRequestForm(response.tradeForm.form),
                            );
                        } else {
                            const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                            console.log(errorMessage);
                        }
                    } else {
                        const errorMessage = 'No response from the server';
                        console.log(`[doBuyTrade] ${errorMessage}`);
                        dispatch(
                            notificationsActions.addToast({
                                type: 'error',
                                error: errorMessage,
                            }),
                        );
                    }
                } else {
                    dispatch(tradingBuyActions.saveSelectedQuote(quote));

                    timer.stop();

                    navigateToBuyConfirm();
                }
            }
        }
    };

    const confirmTrade = async (address: string) => {
        setCallInProgress(true);
        if (!selectedQuote) return;

        analytics.report({
            type: EventType.TradingConfirmTrade,
            payload: {
                type,
            },
        });

        const returnUrl = await createTxLink(selectedQuote, account);
        const quote = { ...selectedQuote, receiveAddress: address };
        const response = await invityAPI.doBuyTrade({
            trade: quote,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'No response from the server',
                }),
            );
        } else if (response.trade.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: response.trade.error,
                }),
            );
        } else {
            dispatch(
                tradingBuyActions.saveTrade(response.trade, account, new Date().toISOString()),
            );
            if (response.tradeForm) {
                dispatch(tradingCommonActions.submitRequestForm(response.tradeForm.form));
            }
            if (isDesktop()) {
                dispatch(tradingBuyActions.saveTransactionDetailId(response.trade.paymentId));
                dispatch(
                    routerActions.goto('wallet-trading-buy-detail', {
                        params: selectedAccount.params,
                    }),
                );
            }
        }
        setCallInProgress(false);
    };

    useTradingLoadData();
    useTradingModalCrypto({
        receiveCurrency: values.cryptoSelect?.value as CryptoId | undefined,
    });

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            if (pageType === 'confirm') {
                return;
            }

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
        [
            previousValues,
            values.fiatInput,
            values.cryptoInput,
            pageType,
            handleChange,
            handleSubmit,
        ],
    );

    // call change handler on every change of select inputs
    useEffect(() => {
        if (pageType === 'confirm') {
            return;
        }

        if (
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(previousValues.current?.currencySelect, values.currencySelect) ||
            isChanged(previousValues.current?.cryptoSelect, values.cryptoSelect)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, isNotFormPage, pageType, handleChange, handleSubmit]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && buyInfo) {
            reset(defaultValues);
        }
    }, [reset, buyInfo, defaultValues, isDraft]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(buyDraftKey);

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.value) {
            removeDraft(buyDraftKey);
        }
    }, [defaultValues, values, removeDraft, buyDraftKey]);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToBuyForm();

            return;
        }

        if (isFromRedirect && quotesRequest) {
            dispatch(tradingBuyActions.setIsFromRedirect(false));
        }

        checkQuotesTimer(handleChange);
    });

    useDebounce(
        () => {
            // saving draft after validation & buyInfo is available
            if (!formState.isValidating && Object.keys(formState.errors).length === 0 && buyInfo) {
                saveDraft(buyDraftKey, {
                    ...values,
                    fiatInput:
                        values.fiatInput !== ''
                            ? values.fiatInput
                            : buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(
                                  suggestedFiatCurrency,
                              ),
                } as TradingBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isValidating,
            saveDraft,
            buyDraftKey,
            values,
            shouldSendInSats,
            buyInfo,
        ],
    );

    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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
        register,
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        formState,
        device,
        callInProgress,
        addressVerified,
        timer,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        selectedQuote,
        selectQuote,
        confirmTrade,
        goToOffers,
        verifyAddress: tradingBuyActions.verifyAddress,
        removeDraft,
        setAmountLimits,
    };
};
