import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useDebounce from 'react-use/lib/useDebounce';
import type { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';
import { isChanged } from '@suite-common/suite-utils';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { saveCachedAccountInfo, saveQuoteRequest } from 'src/actions/wallet/coinmarketBuyActions';
import { useActions, useDispatch, useSelector } from 'src/hooks/suite';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import invityAPI from 'src/services/suite/invityAPI';
import {
    createQuoteLink,
    createTxLink,
    getAmountLimits,
} from 'src/utils/wallet/coinmarket/buyUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { CRYPTO_INPUT } from 'src/types/wallet/coinmarketSellForm';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { useCoinmarketBuyFormDefaultValues } from './useCoinmarketBuyFormDefaultValues';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketTradeBuyType, UseCoinmarketFormProps } from 'src/types/coinmarket/coinmarket';
import { processSellAndBuyQuotes } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useBitcoinAmountUnit } from '../../useBitcoinAmountUnit';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketBuyFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketNavigation } from '../../useCoinmarketNavigation';
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
import useCoinmarketPaymentMethod from './useCoinmarketPaymentMethod';

const useCoinmarketBuyForm = ({
    selectedAccount,
    offFirstRequest, // if true, use draft as initial values
}: UseCoinmarketFormProps): CoinmarketBuyFormContextProps => {
    const dispatch = useDispatch();
    const { addressVerified, buyInfo, isFromRedirect, quotes, quotesRequest } = useSelector(
        state => state.wallet.coinmarket.buy,
    );
    const {
        callInProgress,
        account,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeBuyType>({ selectedAccount });
    const { paymentMethods, getPaymentMethods, getQuotesByPaymentMethod } =
        useCoinmarketPaymentMethod<CoinmarketTradeBuyType>();
    const {
        saveTrade,
        saveQuotes,
        setIsFromRedirect,
        openCoinmarketBuyConfirmModal,
        addNotification,
        saveTransactionDetailId,
        verifyAddress,
        submitRequestForm,
        goto,
        savePaymentMethods,
    } = useActions({
        saveTrade: coinmarketBuyActions.saveTrade,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        setIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
        openCoinmarketBuyConfirmModal: coinmarketBuyActions.openCoinmarketBuyConfirmModal,
        addNotification: notificationsActions.addToast,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        verifyAddress: coinmarketBuyActions.verifyAddress,
        goto: routerActions.goto,
        savePaymentMethods: coinmarketInfoActions.savePaymentMethods,
    });
    const { navigateToBuyForm, navigateToBuyOffers } = useCoinmarketNavigation(account);

    // states
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        offFirstRequest ? quotes : undefined,
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // parameters
    const { network } = selectedAccount;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders =
        !isLoading &&
        (buyInfo?.buyInfo?.providers.length === 0 ||
            !(
                networkToCryptoSymbol(account.symbol) &&
                buyInfo?.supportedCryptoCurrencies.has(networkToCryptoSymbol(account.symbol)!)
            ));

    // form initialization
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketBuyFormProps>('coinmarket-buy');
    const draft = getDraft(account.key);
    const isDraft = !!draft || !!offFirstRequest;
    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useCoinmarketBuyFormDefaultValues(account.symbol, buyInfo, paymentMethods);
    const methods = useForm<CoinmarketBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });
    const { register, control, formState, reset, setValue, getValues, handleSubmit } = methods;
    const values = useWatch<CoinmarketBuyFormProps>({ control }) as CoinmarketBuyFormProps;
    const previousValues = useRef<CoinmarketBuyFormProps | null>(
        offFirstRequest ? (draft as CoinmarketBuyFormProps) : null,
    );

    // form states
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect.value;
    const isFirstRequest = innerQuotes === undefined;
    const isFormLoading =
        isLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const getQuotesRequest = useCallback(
        async (request: BuyTradeQuoteRequest) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amount is not set
            if (!request.fiatStringAmount && !request.cryptoStringAmount) {
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
        const { fiatInput, cryptoInput, currencySelect, cryptoSelect, countrySelect } =
            methods.getValues();
        const cryptoStringAmount =
            cryptoInput && shouldSendInSats
                ? formatAmount(cryptoInput, network.decimals)
                : cryptoInput;
        const wantCrypto = !fiatInput;

        const request = {
            wantCrypto: fiatInput ? wantCrypto : !!quotesRequest?.wantCrypto,
            fiatCurrency: currencySelect
                ? currencySelect?.value.toUpperCase()
                : quotesRequest?.fiatCurrency ?? '',
            receiveCurrency: cryptoSelect?.cryptoSymbol ?? quotesRequest?.receiveCurrency ?? 'BTC',
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
                const quotesDefault = processSellAndBuyQuotes<CoinmarketTradeBuyType>(allQuotes);
                // without errors
                const quotesSuccess =
                    getFilteredSuccessQuotes<CoinmarketTradeBuyType>(quotesDefault) ?? [];

                const bestQuote = quotesSuccess?.[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
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
                    setValue('paymentMethod', {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethod ?? '',
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
                quote.receiveCurrency,
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
                    setSelectedQuote(quote);
                    timer.stop();
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

    // hooks
    useEffect(() => {
        dispatch(loadInvityData());
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
    }, [previousValues, values, handleChange, handleSubmit, offFirstRequest]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, defaultValues, isDraft]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.cryptoSymbol) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToBuyForm();

            return;
        }

        if (isFromRedirect && quotesRequest) {
            setIsFromRedirect(false);
        }

        checkQuotesTimer(handleChange);
    });

    useDidUpdate(() => {
        const cryptoInputValue = getValues(CRYPTO_INPUT);
        if (!cryptoInputValue) {
            return;
        }
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
        setValue(CRYPTO_INPUT, conversion(cryptoInputValue, network.decimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    useDebounce(
        () => {
            if (!formState.isValidating && Object.keys(formState.errors).length === 0) {
                saveDraft(account.key, values as CoinmarketBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isValidating,
            saveDraft,
            account.key,
            values,
            shouldSendInSats,
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
        type: 'buy',
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,
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
        isDraft,
        device,
        callInProgress,
        addressVerified,
        timer,
        quotes: getQuotesByPaymentMethod(innerQuotes, values.paymentMethod?.value ?? ''),
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
