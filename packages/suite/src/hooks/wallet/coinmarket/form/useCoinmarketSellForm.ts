import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { BankAccount, SellFiatTrade, SellFiatTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';
import { amountToSatoshi, formatAmount, getNetwork } from '@suite-common/wallet-utils';
import { isChanged } from '@suite-common/suite-utils';
import { useActions, useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getUnusedAddressFromAccount,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { createQuoteLink, getAmountLimits } from 'src/utils/wallet/coinmarket/sellUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { AmountLimits, TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { Account } from '@suite-common/wallet-types';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { CoinmarketTradeSellType, UseCoinmarketFormProps } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketSellFormContextProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketSellFormDefaultValues } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';
import useCoinmarketPaymentMethod from 'src/hooks/wallet/coinmarket/form/useCoinmarketPaymentMethod';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
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
import { useCoinmarketFormActions } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketFormActions';
import { Network } from '@suite-common/wallet-config';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { useCoinmarketComposeTransaction } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketComposeTransaction';
import { useCoinmarketCurrencySwitcher } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketCurrencySwitcher';

export const useCoinmarketSellForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketSellFormContextProps => {
    const type = 'sell';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const {
        sellInfo,
        quotesRequest,
        isFromRedirect,
        quotes,
        transactionId,
        coinmarketAccount,
        selectedQuote,
    } = useSelector(state => state.wallet.coinmarket.sell);
    // selectedAccount is used as initial state if this is form page
    // coinmarketAccount is used on offers page
    const [account, setAccount] = useState<Account>(() => {
        if (coinmarketAccount && isNotFormPage) {
            return coinmarketAccount;
        }

        return selectedAccount.account;
    });

    const { callInProgress, timer, device, setCallInProgress, checkQuotesTimer } =
        useCoinmarketCommonOffers<CoinmarketTradeSellType>({ selectedAccount, type });
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
        saveSelectedQuote,
        setIsFromRedirect,
        saveQuoteRequest,
        saveTransactionId,
        openCoinmarketSellConfirmModal,
        submitRequestForm,
        savePaymentMethods,
        setCoinmarketSellAccount,
    } = useActions({
        goto: routerActions.goto,
        saveTrade: coinmarketSellActions.saveTrade,
        saveQuotes: coinmarketSellActions.saveQuotes,
        saveSelectedQuote: coinmarketSellActions.saveSelectedQuote,
        setIsFromRedirect: coinmarketSellActions.setIsFromRedirect,
        saveQuoteRequest: coinmarketSellActions.saveQuoteRequest,
        saveTransactionId: coinmarketSellActions.saveTransactionId,
        openCoinmarketSellConfirmModal: coinmarketSellActions.openCoinmarketSellConfirmModal,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        loadInvityData: coinmarketCommonActions.loadInvityData,
        savePaymentMethods: coinmarketInfoActions.savePaymentMethods,
        setCoinmarketSellAccount: coinmarketSellActions.setCoinmarketSellAccount,
    });
    const { navigateToSellForm, navigateToSellOffers, navigateToSellConfirm } =
        useCoinmarketNavigation(account);

    const { symbol } = account;
    const localCurrency = useSelector(selectLocalCurrency);
    const network = getNetwork(account.symbol) as Network;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const trade = trades.find(
        trade => trade.tradeType === 'sell' && trade.key === transactionId,
    ) as TradeSell | undefined;

    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const [sellStep, setSellStep] = useState<CoinmarketSellStepType>('BANK_ACCOUNT');
    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotes),
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod } =
        useCoinmarketSellFormDefaultValues(account, sellInfo, paymentMethods);
    const sellDraftKey = 'coinmarket-sell';
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketSellFormProps>(sellDraftKey);
    const draft = getDraft(sellDraftKey);
    // eslint-disable-next-line no-nested-ternary
    const draftUpdated: CoinmarketSellFormProps | null = draft
        ? isNotFormPage
            ? {
                  ...draft,
                  outputs: {
                      ...draft.outputs,
                      [0]: {
                          ...draft.outputs?.[0],
                          fiat: draft.outputs?.[0]?.fiat || '',
                      },
                  },
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
    const { register, setValue, handleSubmit, reset, control, formState } = methods;
    const values = useWatch<CoinmarketSellFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isNotFormPage ? draftUpdated : null);

    const formIsValid = Object.keys(formState.errors).length === 0;
    const output = values.outputs?.[0];
    const hasValues =
        !!output?.amount &&
        output?.amount !== '' &&
        !!output?.currency?.value &&
        output?.currency?.value !== '';
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = sellInfo?.sellList?.providers.length === 0;
    const isInitialDataLoading = !sellInfo?.sellList || !output?.address;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;
    const quotesByPaymentMethod = getQuotesByPaymentMethod(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );

    const { isComposing, composedLevels, feeInfo, changeFeeLevel, composeRequest } =
        useCoinmarketComposeTransaction<CoinmarketSellFormProps>({
            account,
            network,
            values: values as CoinmarketSellFormProps,
            methods,
        });

    const helpers = useCoinmarketFormActions({
        account,
        methods,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setAccountOnChange: newAccount => {
            dispatch(setCoinmarketSellAccount(newAccount));
            setAccount(newAccount);
        },
    });

    const { toggleAmountInCrypto } = useCoinmarketCurrencySwitcher<CoinmarketSellFormProps>({
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

    const getQuotesRequest = useCallback(
        async (request: SellFiatTradeQuoteRequest, offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amounts is not set
            if (
                (!request.fiatStringAmount || request.fiatStringAmount === '') &&
                (!request.cryptoStringAmount ||
                    request.cryptoStringAmount === '' ||
                    Number(request.cryptoStringAmount) === 0)
            ) {
                timer.stop();
                setIsSubmittingHelper(false);

                return;
            }

            abortControllerRef.current = new AbortController();
            invityAPI.createInvityAPIKey(account.descriptor);

            const allQuotes = await invityAPI.getSellQuotes(
                request,
                abortControllerRef.current.signal,
            );

            return allQuotes;
        },
        [account.descriptor, timer],
    );

    const getQuoteRequestData = useCallback((): SellFiatTradeQuoteRequest => {
        const { outputs, countrySelect, sendCryptoSelect, amountInCrypto } = methods.getValues();

        const fiatStringAmount = outputs[0].fiat ?? '';
        const unformattedOutputAmount = outputs[0].amount ?? '';
        const cryptoStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, network.decimals)
                : unformattedOutputAmount;
        const currencySelect = outputs[0].currency ?? '';
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto,
            cryptoCurrency: sendCryptoSelect?.value ?? FORM_DEFAULT_CRYPTO_CURRENCY,
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
            timer.loading();

            const quoteRequest = getQuoteRequestData();
            const allQuotes = await getQuotesRequest(quoteRequest, offLoading);

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

                const { setMaxOutputId } = values;

                // compose transaction only when is not computed from max balance
                // max balance has to be computed before request
                if (setMaxOutputId === undefined && !limits) {
                    composeRequest(FORM_OUTPUT_AMOUNT);
                }

                setIsSubmittingHelper(false);
            } else {
                setInnerQuotes([]);
            }

            timer.reset();
        },
        [
            timer,
            getQuoteRequestData,
            getQuotesRequest,
            values,
            getPaymentMethods,
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
            const fiatValue = values?.outputs?.[0]?.fiat;
            const cryptoValue = values?.outputs?.[0]?.amount;
            const fiatChanged = isChanged(previousValues.current?.outputs?.[0].fiat, fiatValue);
            const cryptoChanged = isChanged(
                previousValues.current?.outputs?.[0].amount,
                cryptoValue,
            );

            // this will also update crypto amount
            if (fiatChanged) {
                helpers.calculateCryptoAmountFromFiat(fiatValue);
            }

            // calculateCryptoAmountFromFiat will update crypto amount - avoiding double request
            if (cryptoChanged) {
                handleSubmit(() => {
                    handleChange();
                })();

                previousValues.current = values;
            }
        },
        500,
        [previousValues, handleChange, handleSubmit],
    );

    // call change handler on every change of select inputs
    useEffect(() => {
        if (
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(
                previousValues.current?.outputs?.[0]?.currency?.value,
                values.outputs?.[0]?.currency?.value,
            )
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage]);

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
                    saveSelectedQuote(response.trade);
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
                saveSelectedQuote(quote);
                timer.stop();

                navigateToSellConfirm();
            }
        }
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;
        const quote = { ...selectedQuote, bankAccount };
        const response = await doSellTrade(quote);
        if (response) {
            saveSelectedQuote(response);
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
                saveSelectedQuote(trade.data);
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
        isNotFormPage,
        dispatch,
        navigateToSellForm,
        checkQuotesTimer,
        saveSelectedQuote,
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
