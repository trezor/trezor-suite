import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useDebounce from 'react-use/lib/useDebounce';
import type { BuyTrade, BuyTradeQuoteRequest, CryptoId } from 'invity-api';
import { isChanged } from '@suite-common/suite-utils';
import { formatAmount, getNetwork } from '@suite-common/wallet-utils';
import { useActions, useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    createQuoteLink,
    createTxLink,
    getAmountLimits,
} from 'src/utils/wallet/coinmarket/buyUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { useCoinmarketBuyFormDefaultValues } from './useCoinmarketBuyFormDefaultValues';
import { CoinmarketTradeBuyType, UseCoinmarketFormProps } from 'src/types/coinmarket/coinmarket';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketBuyFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import {
    getFilteredSuccessQuotes,
    useCoinmarketCommonOffers,
} from '../offers/useCoinmarketCommonOffers';
import * as coinmarketInfoActions from 'src/actions/wallet/coinmarketInfoActions';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isDesktop } from '@trezor/env-utils';
import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/coinmarketCommonConstants';
import useCoinmarketPaymentMethod from 'src/hooks/wallet/coinmarket/form/useCoinmarketPaymentMethod';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { FORM_PAYMENT_METHOD_SELECT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketSatsSwitcher } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSatsSwitcher';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';

const useCoinmarketBuyForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketBuyFormContextProps => {
    const type = 'buy';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const { addressVerified, buyInfo, isFromRedirect, quotes, quotesRequest, selectedQuote } =
        useSelector(state => state.wallet.coinmarket.buy);
    const { getNetworkSymbol } = useCoinmarketInfo();
    const { callInProgress, account, timer, device, setCallInProgress, checkQuotesTimer } =
        useCoinmarketCommonOffers<CoinmarketTradeBuyType>({ selectedAccount, type });
    const { paymentMethods, getPaymentMethods, getQuotesByPaymentMethod } =
        useCoinmarketPaymentMethod<CoinmarketTradeBuyType>();
    const {
        saveTrade,
        saveQuotes,
        saveSelectedQuote,
        setIsFromRedirect,
        openCoinmarketBuyConfirmModal,
        addNotification,
        saveTransactionDetailId,
        verifyAddress,
        submitRequestForm,
        goto,
        savePaymentMethods,
        saveQuoteRequest,
        saveCachedAccountInfo,
    } = useActions({
        saveTrade: coinmarketBuyActions.saveTrade,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        saveSelectedQuote: coinmarketBuyActions.saveSelectedQuote,
        setIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
        openCoinmarketBuyConfirmModal: coinmarketBuyActions.openCoinmarketBuyConfirmModal,
        addNotification: notificationsActions.addToast,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        verifyAddress: coinmarketBuyActions.verifyAddress,
        goto: routerActions.goto,
        savePaymentMethods: coinmarketInfoActions.savePaymentMethods,
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
    });
    const { navigateToBuyForm, navigateToBuyOffers, navigateToBuyOffer } =
        useCoinmarketNavigation(account);

    // states
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        isNotFormPage ? quotes : undefined,
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // parameters
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders = !isLoading && buyInfo?.buyInfo?.providers.length === 0;

    // form initialization
    const {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    } = useCoinmarketBuyFormDefaultValues(account.symbol, buyInfo, paymentMethods);
    const buyDraftKey = account.key;
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketBuyFormProps>('coinmarket-buy');
    const draft = getDraft(buyDraftKey);
    const draftUpdated: CoinmarketBuyFormProps | null = draft
        ? {
              ...draft,
              fiatInput:
                  draft.fiatInput && draft.fiatInput !== ''
                      ? draft.fiatInput
                      : buyInfo?.buyInfo?.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
              // remember only for offers page
              cryptoSelect: pageType === 'form' ? defaultValues.cryptoSelect : draft.cryptoSelect,
          }
        : null;

    const isDraft = !!draftUpdated || !!isNotFormPage;
    const methods = useForm<CoinmarketBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft && draftUpdated ? draftUpdated : defaultValues,
    });
    const { register, control, formState, reset, setValue, handleSubmit } = methods;
    const values = useWatch<CoinmarketBuyFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isNotFormPage ? draftUpdated : null);

    // form states
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFirstRequest = innerQuotes === undefined;
    const isFormLoading =
        isLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getQuotesByPaymentMethod(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    // TODO: This is most likely not right. Almost any shitcoin will use the BTC network.
    const network =
        getNetworkByCoingeckoId(values.cryptoSelect?.value as CryptoId) ?? getNetwork('btc')!;
    const { toggleAmountInCrypto } = useCoinmarketSatsSwitcher({
        account,
        methods,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.receiveStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        network,
    });

    const getQuotesRequest = useCallback(
        async (request: BuyTradeQuoteRequest) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amount is not set
            if (
                (!request.fiatStringAmount && !request.cryptoStringAmount) ||
                !request.receiveCurrency
            ) {
                timer.stop();

                return;
            }

            abortControllerRef.current = new AbortController();
            invityAPI.createInvityAPIKey(account.descriptor);

            try {
                const allQuotes = await invityAPI.getBuyQuotes(
                    request,
                    abortControllerRef.current.signal,
                );

                return allQuotes;
            } catch (error) {
                console.log('Abort', error);
            }
        },
        [account.descriptor, timer],
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
        const cryptoStringAmount =
            cryptoInput && shouldSendInSats
                ? formatAmount(cryptoInput, network.decimals)
                : cryptoInput;

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
    }, [methods, network.decimals, shouldSendInSats, quotesRequest]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);
            timer.loading();

            const quoteRequest = getQuoteRequestData();
            const allQuotes = await getQuotesRequest(quoteRequest);

            if (Array.isArray(allQuotes)) {
                if (allQuotes.length === 0) {
                    timer.stop();

                    return;
                }

                // processed quotes and without alternative quotes
                const quotesDefault = filterQuotesAccordingTags<CoinmarketTradeBuyType>(
                    addIdsToQuotes<CoinmarketTradeBuyType>(allQuotes, 'buy'),
                );
                // without errors
                const quotesSuccess =
                    getFilteredSuccessQuotes<CoinmarketTradeBuyType>(quotesDefault) ?? [];

                const bestQuote = quotesSuccess?.[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
                const bestQuotePaymentMethodName =
                    bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
                const paymentMethodSelected = values.paymentMethod?.value;
                const paymentMethodsFromQuotes = getPaymentMethods(quotesSuccess);
                const isSelectedPaymentMethodAvailable =
                    paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                    undefined;
                const limits = getAmountLimits(quoteRequest, quotesDefault); // from all quotes except alternative

                setInnerQuotes(quotesSuccess);
                dispatch(saveQuotes(quotesSuccess));
                dispatch(saveQuoteRequest(quoteRequest));
                dispatch(savePaymentMethods(paymentMethodsFromQuotes));
                setAmountLimits(limits);

                if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                    setValue(FORM_PAYMENT_METHOD_SELECT, {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethodName ?? '',
                    });
                }
            } else {
                setInnerQuotes([]);
            }

            timer.reset();
            setIsSubmittingHelper(false);
        },
        [
            timer,
            values.paymentMethod?.value,
            getQuoteRequestData,
            getQuotesRequest,
            getPaymentMethods,
            dispatch,
            saveQuotes,
            saveQuoteRequest,
            savePaymentMethods,
            setValue,
        ],
    );

    const goToOffers = async () => {
        await handleChange(true);

        dispatch(saveCachedAccountInfo(account.symbol, account.index, account.accountType));
        navigateToBuyOffers();
    };

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;
        if (quotesRequest) {
            const result = await openCoinmarketBuyConfirmModal(
                provider?.companyName,
                getNetworkSymbol(quote.receiveCurrency!),
            );
            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const returnUrl = await createQuoteLink(quotesRequest, account);
                    const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            submitRequestForm(response.tradeForm.form);
                        } else {
                            const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                            console.log(errorMessage);
                        }
                    } else {
                        const errorMessage = 'No response from the server';
                        console.log(`[doBuyTrade] ${errorMessage}`);
                        addNotification({
                            type: 'error',
                            error: errorMessage,
                        });
                    }
                } else {
                    saveSelectedQuote(quote);
                    dispatch({
                        type: SET_MODAL_CRYPTO_CURRENCY,
                        modalCryptoId: quote.receiveCurrency,
                    });
                    timer.stop();

                    navigateToBuyOffer();
                }
            }
        }
    };

    const goToPayment = async (address: string) => {
        setCallInProgress(true);
        if (!selectedQuote) return;

        const returnUrl = await createTxLink(selectedQuote, account);
        const quote = { ...selectedQuote, receiveAddress: address };
        const response = await invityAPI.doBuyTrade({
            trade: quote,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            addNotification({
                type: 'error',
                error: 'No response from the server',
            });
        } else if (response.trade.error) {
            addNotification({
                type: 'error',
                error: response.trade.error,
            });
        } else {
            saveTrade(response.trade, account, new Date().toISOString());
            if (response.tradeForm) {
                submitRequestForm(response.tradeForm.form);
            }
            if (isDesktop()) {
                saveTransactionDetailId(response.trade.paymentId);
                goto('wallet-coinmarket-buy-detail', { params: selectedAccount.params });
            }
        }
        setCallInProgress(false);
    };

    useCoinmarketLoadData();

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

    // call change handler on every change of select inputs
    useEffect(() => {
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
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage]);

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
            setIsFromRedirect(false);
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
                } as CoinmarketBuyFormProps);
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
        goToPayment,
        goToOffers,
        verifyAddress,
        removeDraft,
        setAmountLimits,
    };
};

export default useCoinmarketBuyForm;
