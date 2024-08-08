import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { BankAccount, SellFiatTrade, SellFiatTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';
import {
    getFeeLevels,
    amountToSatoshi,
    formatAmount,
    getNetwork,
} from '@suite-common/wallet-utils';
import { isChanged } from '@suite-common/suite-utils';
import { useActions, useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    getComposeAddressPlaceholder,
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getUnusedAddressFromAccount,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { createQuoteLink, getAmountLimits } from 'src/utils/wallet/coinmarket/sellUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { AmountLimits, TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { CoinmarketTradeSellType, UseCoinmarketFormProps } from 'src/types/coinmarket/coinmarket';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import {
    CoinmarketSellFormContextProps,
    CoinmarketSellFormProps,
    CoinmarketUseCommonFormStateReturnProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketSellFormDefaultValues } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';
import useCoinmarketPaymentMethod from 'src/hooks/wallet/coinmarket/form/useCoinmarketPaymentMethod';
import {
    FORM_CRYPTO_INPUT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_ADDRESS,
    FORM_PAYMENT_METHOD_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import {
    getFilteredSuccessQuotes,
    useCoinmarketCommonOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { useCoinmarketRecomposeAndSign } from 'src/hooks/wallet/useCoinmarketRecomposeAndSign';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as coinmarketSellActions from 'src/actions/wallet/coinmarketSellActions';
import * as routerActions from 'src/actions/suite/routerActions';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketInfoActions from 'src/actions/wallet/coinmarketInfoActions';
import { CoinmarketSellStepType } from 'src/types/coinmarket/coinmarketOffers';
import { useCoinmarketCommonFormState } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonFormState';
import { useCoinmarketSellFormHelpers } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormHelpers';
import { selectAccounts } from '@suite-common/wallet-core';
import { Network } from '@suite-common/wallet-config';
import { useCoinmarketSatsSwitcher } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSatsSwitcher';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';

export const useCoinmarketSellForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketSellFormContextProps => {
    const type = 'sell';
    const isPageOffers = pageType === 'offers';
    const dispatch = useDispatch();
    const { sellInfo, quotesRequest, isFromRedirect, quotes, transactionId, coinmarketAccount } =
        useSelector(state => state.wallet.coinmarket.sell);
    // selectedAccount is used as initial state if this is form page
    // coinmarketAccount is used on offers page
    const [account, setAccount] = useState<Account>(() => {
        if (coinmarketAccount && isPageOffers) {
            return coinmarketAccount;
        }

        return selectedAccount.account;
    });

    const { translationString } = useTranslation();
    const {
        callInProgress,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeSellType>({ selectedAccount, type });
    const { paymentMethods, getPaymentMethods, getQuotesByPaymentMethod } =
        useCoinmarketPaymentMethod<CoinmarketTradeSellType>();
    const {
        selectedFee: selectedFeeRecomposedAndSigned,
        composed,
        recomposeAndSign,
    } = useCoinmarketRecomposeAndSign();
    const {
        goto,
        saveTrade,
        saveQuotes,
        setIsFromRedirect,
        saveQuoteRequest,
        saveTransactionId,
        openCoinmarketSellConfirmModal,
        submitRequestForm,
        saveComposedTransactionInfo,
        savePaymentMethods,
    } = useActions({
        goto: routerActions.goto,
        saveTrade: coinmarketSellActions.saveTrade,
        saveQuotes: coinmarketSellActions.saveQuotes,
        setIsFromRedirect: coinmarketSellActions.setIsFromRedirect,
        saveQuoteRequest: coinmarketSellActions.saveQuoteRequest,
        saveTransactionId: coinmarketSellActions.saveTransactionId,
        openCoinmarketSellConfirmModal: coinmarketSellActions.openCoinmarketSellConfirmModal,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        saveComposedTransactionInfo: coinmarketCommonActions.saveComposedTransactionInfo,
        loadInvityData: coinmarketCommonActions.loadInvityData,
        savePaymentMethods: coinmarketInfoActions.savePaymentMethods,
    });
    const accounts = useSelector(selectAccounts);
    const { navigateToSellForm, navigateToSellOffers } = useCoinmarketNavigation(account);

    const { symbol, networkType } = account;
    const localCurrency = useSelector(selectLocalCurrency);
    const fees = useSelector(state => state.wallet.fees);
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const network = getNetwork(account.symbol) as Network;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const trade = trades.find(
        trade => trade.tradeType === 'sell' && trade.key === transactionId,
    ) as TradeSell | undefined;

    const [state, setState] = useState<
        CoinmarketUseCommonFormStateReturnProps<CoinmarketSellFormProps> | undefined
    >(undefined);
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const [sellStep, setSellStep] = useState<CoinmarketSellStepType>('BANK_ACCOUNT');
    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotes),
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useCoinmarketSellFormDefaultValues(
            account,
            sellInfo,
            paymentMethods,
            state?.formValues?.outputs[0].address,
        );
    const sellDraftKey = 'coinmarket-sell';
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketSellFormProps>(sellDraftKey);
    const draft = getDraft(sellDraftKey);
    // eslint-disable-next-line no-nested-ternary
    const draftUpdated: CoinmarketSellFormProps | null = draft
        ? isPageOffers
            ? {
                  ...draft,
                  fiatInput: draft.fiatInput && draft.fiatInput !== '' ? draft.fiatInput : '',
              }
            : {
                  ...defaultValues,
                  paymentMethod: draft.paymentMethod,
                  countrySelect: draft.countrySelect,
                  amountInCrypto: draft.amountInCrypto,
              }
        : null;
    const isDraft = !!draft;
    const methods = useForm<CoinmarketSellFormProps>({
        mode: 'onChange',
        defaultValues: draftUpdated ? draftUpdated : defaultValues,
    });
    const {
        register,
        setValue,
        getValues,
        setError,
        clearErrors,
        handleSubmit,
        reset,
        control,
        formState,
    } = methods;
    const values = useWatch<CoinmarketSellFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isPageOffers ? draftUpdated : null);

    const initState = useCoinmarketCommonFormState({
        account,
        network,
        fees,
        defaultValues,
    });
    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useCompose({
        ...methods,
        state,
    });

    // sub-hook, FeeLevels handler
    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    const helpers = useCoinmarketSellFormHelpers({
        account,
        network,
        methods,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setAccount,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = sellInfo?.sellList?.providers.length === 0;
    const isLoading = !sellInfo?.sellList;
    const isFormLoading =
        isLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getQuotesByPaymentMethod(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );
    const { toggleAmountInCrypto } = useCoinmarketSatsSwitcher({
        account,
        methods,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.cryptoStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        network,
    });

    const getQuotesRequest = useCallback(
        async (request: SellFiatTradeQuoteRequest) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amounts is not set
            if (!request.fiatStringAmount && !request.cryptoStringAmount) {
                timer.stop();

                return;
            }

            abortControllerRef.current = new AbortController();
            invityAPI.createInvityAPIKey(account.descriptor);

            try {
                const allQuotes = await invityAPI.getSellQuotes(
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

    const getQuoteRequestData = useCallback((): SellFiatTradeQuoteRequest => {
        const {
            fiatInput,
            cryptoInput,
            currencySelect,
            countrySelect,
            cryptoSelect,
            amountInCrypto,
        } = methods.getValues();

        const fiatStringAmount = fiatInput;
        const cryptoStringAmount =
            cryptoInput && shouldSendInSats
                ? formatAmount(cryptoInput, network.decimals)
                : cryptoInput;
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto,
            cryptoCurrency: cryptoSelect?.value ?? 'BTC',
            fiatCurrency: currencySelect.value.toUpperCase(),
            country: countrySelect.value,
            cryptoStringAmount,
            fiatStringAmount,
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        };

        return request;
    }, [methods, network.decimals, shouldSendInSats]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);
            timer.loading();

            const quoteRequest = getQuoteRequestData();
            const allQuotes = await getQuotesRequest(quoteRequest);

            if (Array.isArray(allQuotes)) {
                const limits = getAmountLimits(quoteRequest, allQuotes);

                const quotesDefault = filterQuotesAccordingTags<CoinmarketTradeSellType>(
                    addIdsToQuotes<CoinmarketTradeSellType>(allQuotes, 'sell'),
                );
                // without errors
                const quotesSuccess =
                    getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotesDefault) ?? [];

                const bestQuote = quotesSuccess?.[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
                const bestQuotePaymentMethodName =
                    bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
                const paymentMethodSelected = values.paymentMethod?.value;
                const paymentMethodsFromQuotes = getPaymentMethods(quotesSuccess);
                const isSelectedPaymentMethodAvailable =
                    paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                    undefined;

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
                if (!values.amountInCrypto) {
                    // the best quote crypto amount is known after provided quotes
                    if (bestQuote?.cryptoStringAmount) {
                        helpers.onFiatAmountChange(bestQuote.cryptoStringAmount);
                    }

                    composeRequest(FORM_FIAT_INPUT);
                }
            } else {
                setInnerQuotes([]);
            }

            timer.reset();
            setIsSubmittingHelper(false);
        },
        [
            timer,
            helpers,
            values.paymentMethod?.value,
            values.amountInCrypto,
            getPaymentMethods,
            getQuoteRequestData,
            getQuotesRequest,
            dispatch,
            saveQuotes,
            saveQuoteRequest,
            savePaymentMethods,
            setValue,
            composeRequest,
        ],
    );

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            const fiatChanged = isChanged(previousValues.current?.fiatInput, values.fiatInput);
            const cryptoChanged = isChanged(
                previousValues.current?.cryptoInput,
                values.cryptoInput,
            );

            if (fiatChanged || cryptoChanged) {
                if (cryptoChanged && values.cryptoInput) {
                    helpers.onCryptoAmountChange(values.cryptoInput);
                }

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
            isChanged(previousValues.current?.currencySelect, values.currencySelect)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isPageOffers]);

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
        setCallInProgress(false);
        if (response) {
            if (response.trade.error && response.trade.status !== 'LOGIN_REQUEST') {
                console.log(`[doSellTrade] ${response.trade.error}`);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: response.trade.error,
                    }),
                );

                return undefined;
            }
            if (
                response.trade.status === 'LOGIN_REQUEST' ||
                response.trade.status === 'SITE_ACTION_REQUEST' ||
                (response.trade.status === 'SUBMITTED' && provider.flow === 'PAYMENT_GATE')
            ) {
                if (provider.flow === 'PAYMENT_GATE') {
                    dispatch(saveTrade(response.trade, account, new Date().toISOString()));
                    dispatch(saveTransactionId(response.trade.orderId));
                    setSelectedQuote(response.trade);
                    setSellStep('SEND_TRANSACTION');
                }
                // dispatch(submitRequestForm(response.tradeForm?.form));
                submitRequestForm(response.tradeForm?.form);

                return undefined;
            }

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

        dispatch(coinmarketSellActions.setCoinmarketSellAccount(account)); // save account for offers page
        navigateToSellOffers();
    };

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : null;

        if (quotesRequest) {
            const result = await openCoinmarketSellConfirmModal(
                provider?.companyName,
                quote.cryptoCurrency,
            );

            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId || needToRegisterOrVerifyBankAccount(quote)) {
                    doSellTrade(quote);
                } else {
                    setSelectedQuote(quote);
                    timer.stop();
                }
            }
        }
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;
        const quote = { ...selectedQuote, bankAccount };
        const response = await doSellTrade(quote);
        if (response) {
            setSelectedQuote(response);
            setSellStep('SEND_TRANSACTION');
        }
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;
        await doSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        // destinationAddress may be set by useCoinmarketWatchTrade hook to the trade object
        const destinationAddress =
            selectedQuote?.destinationAddress || trade?.data?.destinationAddress;
        if (
            selectedQuote &&
            selectedQuote.orderId &&
            destinationAddress &&
            selectedQuote.cryptoStringAmount
        ) {
            const cryptoStringAmount = shouldSendInSats
                ? amountToSatoshi(selectedQuote.cryptoStringAmount, network.decimals)
                : selectedQuote.cryptoStringAmount;
            const destinationPaymentExtraId =
                selectedQuote.destinationPaymentExtraId || trade?.data?.destinationPaymentExtraId;
            const result = await recomposeAndSign(
                account,
                destinationAddress,
                cryptoStringAmount,
                destinationPaymentExtraId,
            );
            if (result?.success) {
                // send txid to the server as confirmation
                const { txid } = result.payload;
                const quote: SellFiatTrade = {
                    ...selectedQuote,
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

                dispatch(saveTrade(response, account, new Date().toISOString()));
                dispatch(saveTransactionId(selectedQuote.orderId));

                goto('wallet-coinmarket-sell-detail', {
                    params: {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    },
                });
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

    useCoinmarketLoadData();

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(sellDraftKey);

            return;
        }

        if (values.currencySelect && !values.currencySelect?.value) {
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
        const setStateAsync = async (
            initState: CoinmarketUseCommonFormStateReturnProps<CoinmarketSellFormProps>,
        ) => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );
            if (initState.formValues && address) {
                initState.formValues.outputs[0].address = address;
                setValue(FORM_OUTPUT_ADDRESS, address);
            }

            // this is also starting initial composing of the transaction
            setState(initState);
        };

        if (initState && initState?.account.descriptor !== state?.account.descriptor) {
            setStateAsync(initState);
        }
    }, [state, initState, account, network, device, accounts, chunkify, setValue]);

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];

        if (!composed) return;

        if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(FORM_CRYPTO_INPUT, composed.max, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                clearErrors(FORM_CRYPTO_INPUT);
            }
            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [
        composedLevels,
        selectedFee,
        clearErrors,
        dispatch,
        getValues,
        setError,
        setValue,
        translationString,
        saveComposedTransactionInfo,
    ]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got sellInfo from Invity API server
        if (!isDraft && sellInfo && !formState.isDirty) {
            reset(defaultValues);
        }
    }, [reset, sellInfo, defaultValues, isDraft, isPageOffers, formState.isDirty]);

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
                saveDraft(sellDraftKey, values as CoinmarketSellFormProps);
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

    useEffect(() => {
        if (!quotesRequest) {
            navigateToSellForm();

            return;
        }

        if (isFromRedirect) {
            if (transactionId && trade) {
                setSelectedQuote(trade.data);
                setSellStep('SEND_TRANSACTION');
            }

            dispatch(setIsFromRedirect(false));
        }

        checkQuotesTimer(handleChange);
    }, [
        quotesRequest,
        isFromRedirect,
        timer,
        transactionId,
        trades,
        trade,
        dispatch,
        navigateToSellForm,
        checkQuotesTimer,
        setSelectedQuote,
        setIsFromRedirect,
        handleChange,
    ]);

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
