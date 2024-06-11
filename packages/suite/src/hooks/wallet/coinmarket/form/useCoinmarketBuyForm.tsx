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
import { createQuoteLink, createTxLink } from 'src/utils/wallet/coinmarket/buyUtils';
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
    CoinmarketFormBuyFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketNavigation } from '../../useCoinmarketNavigation';
import {
    getFilteredSuccessQuotes,
    useCoinmarketCommonOffers,
} from '../offers/useCoinmarketCommonOffers';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useCoinmarketFilterReducer } from 'src/reducers/wallet/useCoinmarketFilterReducer';
import { isDesktop } from '@trezor/env-utils';

const useCoinmarketBuyForm = ({
    selectedAccount,
    offFirstRequest, // if true, use draft as initial values
}: UseCoinmarketFormProps): CoinmarketBuyFormContextProps<CoinmarketTradeBuyType> => {
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
    });
    const { navigateToBuyForm, navigateToBuyOffers } = useCoinmarketNavigation(account);

    // states
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const innerQuotesFilterReducer = useCoinmarketFilterReducer<CoinmarketTradeBuyType>(quotes);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        offFirstRequest ? quotes : undefined,
    );

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
        useFormDraft<CoinmarketFormBuyFormProps>('coinmarket-buy');
    const draft = getDraft(account.key);
    const isDraft = !!draft || !!offFirstRequest;
    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useCoinmarketBuyFormDefaultValues(account.symbol, buyInfo);
    const methods = useForm<CoinmarketFormBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });
    const { register, control, formState, reset, setValue, getValues, handleSubmit } = methods;
    const values = useWatch<CoinmarketFormBuyFormProps>({ control }) as CoinmarketFormBuyFormProps;
    const resetForm = useCallback(() => {
        reset({});
        removeDraft(account.key);
    }, [account.key, removeDraft, reset]);
    const previousValues = useRef<CoinmarketFormBuyFormProps | null>(
        offFirstRequest ? (draft as CoinmarketFormBuyFormProps) : null,
    );

    // functions
    const getQuotesRequest = useCallback(
        async (request: BuyTradeQuoteRequest) => {
            // no need to fetch quotes if amount is not set
            if (
                (!request.fiatStringAmount && !request.cryptoStringAmount) ||
                request.country === 'unknown'
            ) {
                timer.stop();

                return;
            }

            invityAPI.createInvityAPIKey(account.descriptor);
            const allQuotes = await invityAPI.getBuyQuotes(request);

            return allQuotes;
        },
        [account.descriptor, timer],
    );

    const getQuoteRequest = useCallback((): BuyTradeQuoteRequest => {
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
            receiveCurrency: cryptoSelect?.cryptoSymbol ?? quotesRequest?.receiveCurrency,
            country: countrySelect?.value ?? quotesRequest?.country,
            fiatStringAmount: fiatInput ?? quotesRequest?.fiatStringAmount,
            cryptoStringAmount: cryptoStringAmount ?? quotesRequest?.cryptoStringAmount,
        };

        return request;
    }, [methods, network.decimals, shouldSendInSats, quotesRequest]);

    const handleChange = useCallback(async () => {
        timer.loading();

        const quoteRequest = getQuoteRequest();
        const allQuotes = await getQuotesRequest(quoteRequest);

        if (Array.isArray(allQuotes)) {
            if (allQuotes.length === 0) {
                timer.stop();

                return;
            }

            const quotes = getFilteredSuccessQuotes<CoinmarketTradeBuyType>(
                processSellAndBuyQuotes<CoinmarketTradeBuyType>(allQuotes),
            );

            setInnerQuotes(quotes);
            dispatch(saveQuotes(quotes ?? []));
            dispatch(saveQuoteRequest(quoteRequest));

            innerQuotesFilterReducer.dispatch({
                type: 'FILTER_SET_PAYMENT_METHODS',
                payload: quotes ?? [],
            });
        } else {
            setInnerQuotes(undefined);
        }

        timer.reset();
    }, [timer, getQuoteRequest, getQuotesRequest, dispatch, saveQuotes, innerQuotesFilterReducer]);

    const goToOffers = async () => {
        await handleChange();

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
                handleSubmit(handleChange)();

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
            handleSubmit(handleChange)();

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
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0
            ) {
                saveDraft(account.key, values as CoinmarketFormBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            saveDraft,
            account.key,
            values,
            shouldSendInSats,
        ],
    );

    return {
        type: 'buy',
        ...methods,
        register,
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        buyInfo,
        amountLimits,
        isLoading,
        noProviders,
        network,
        cryptoInputValue: values.cryptoInput,
        formState,
        isDraft,
        device,
        callInProgress,
        addressVerified,
        timer,
        quotes: innerQuotesFilterReducer.actions.handleFilterQuotes(innerQuotes),
        quotesRequest,
        innerQuotesFilterReducer,
        providersInfo: buyInfo?.providerInfos,
        selectedQuote,
        selectQuote,
        goToPayment,
        goToOffers,
        verifyAddress,
        removeDraft,
        setAmountLimits,
        handleClearFormButtonClick: resetForm,
    };
};

export default useCoinmarketBuyForm;
