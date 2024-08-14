import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { CryptoSymbol, ExchangeTrade, ExchangeTradeQuoteRequest } from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';
import {
    amountToSatoshi,
    formatAmount,
    getFeeLevels,
    getFiatRateKey,
    getNetwork,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { isChanged } from '@suite-common/suite-utils';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { useActions, useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { saveQuoteRequest, saveQuotes } from 'src/actions/wallet/coinmarketExchangeActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    addIdsToQuotes,
    getComposeAddressPlaceholder,
    getUnusedAddressFromAccount,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    getAmountLimits,
    getSuccessQuotesOrdered,
} from 'src/utils/wallet/coinmarket/exchangeUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CryptoAmountLimits, Option } from 'src/types/wallet/coinmarketCommonTypes';
import { Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { selectAddressDisplayType, selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenAddress } from '@suite-common/wallet-types';
import {
    CoinmarketTradeExchangeType,
    UseCoinmarketFormProps,
} from 'src/types/coinmarket/coinmarket';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import {
    CoinmarketExchangeFormContextProps,
    CoinmarketExchangeFormProps,
    CoinmarketUseCommonFormStateReturnProps,
} from 'src/types/coinmarket/coinmarketForm';
import { FORM_OUTPUT_AMOUNT, FORM_OUTPUT_CURRENCY } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketExchangeFormDefaultValues } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeFormDefaultValues';
import { useCoinmarketCommonFormState } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonFormState';
import {
    getFilteredSuccessQuotes,
    useCoinmarketCommonOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketExchangeStepType,
    CoinmarketOffersContextValues,
} from 'src/types/coinmarket/coinmarketOffers';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useCoinmarketRecomposeAndSign } from 'src/hooks/wallet/useCoinmarketRecomposeAndSign';
import { Network, networksCompatibility } from '@suite-common/wallet-config';
import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/coinmarketCommonConstants';
import useCoinmarketExchangeFormHelpers from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeFormHelpers';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';

export const useCoinmarketExchangeForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketExchangeFormContextProps => {
    const type = 'exchange';
    const isPageOffers = pageType === 'offers';
    const { exchangeInfo, quotesRequest, quotes, coinmarketAccount } = useSelector(
        state => state.wallet.coinmarket.exchange,
    );
    const account = coinmarketAccount ?? selectedAccount.account;
    const {
        callInProgress,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeExchangeType>({ selectedAccount, type });

    const accounts = useSelector(state => state.wallet.accounts);
    const { symbolsInfo } = useSelector(state => state.wallet.coinmarket.info);
    const fees = useSelector(state => state.wallet.fees);
    const dispatch = useDispatch();
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const { translationString } = useTranslation();
    const { recomposeAndSign } = useCoinmarketRecomposeAndSign();

    const [amountLimits, setAmountLimits] = useState<CryptoAmountLimits | undefined>(undefined);
    const [state, setState] = useState<
        CoinmarketUseCommonFormStateReturnProps<CoinmarketExchangeFormProps> | undefined
    >(undefined);
    const [innerQuotes, setInnerQuotes] = useState<ExchangeTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeExchangeType>(quotes),
    );
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
    const [suiteReceiveAccounts, setSuiteReceiveAccounts] =
        useState<
            CoinmarketOffersContextValues<CoinmarketTradeExchangeType>['suiteReceiveAccounts']
        >();
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [exchangeStep, setExchangeStep] =
        useState<CoinmarketExchangeStepType>('RECEIVING_ADDRESS');
    const { navigateToExchangeForm, navigateToExchangeDetail, navigateToExchangeOffers } =
        useCoinmarketNavigation(account);
    const isDebug = useSelector(selectIsDebugModeActive);
    const receiveNetwork = selectedQuote?.receive && cryptoToNetworkSymbol(selectedQuote?.receive);

    const {
        saveTrade,
        openCoinmarketExchangeConfirmModal,
        saveTransactionId,
        addNotification,
        verifyAddress,
    } = useActions({
        saveTrade: coinmarketExchangeActions.saveTrade,
        openCoinmarketExchangeConfirmModal:
            coinmarketExchangeActions.openCoinmarketExchangeConfirmModal,
        saveTransactionId: coinmarketExchangeActions.saveTransactionId,
        addNotification: notificationsActions.addToast,
        verifyAddress: coinmarketExchangeActions.verifyAddress,
    });

    const { symbol, networkType } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const network = getNetwork(account.symbol) as Network;

    const { getDraft, saveDraft, removeDraft } =
        useFormDraft<CoinmarketExchangeFormProps>('coinmarket-exchange');
    const draft = getDraft(account.key);
    const isDraft = !!draft;
    const draftUpdated: CoinmarketExchangeFormProps | null = draft ? draft : null;
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const { defaultCurrency, defaultValues } = useCoinmarketExchangeFormDefaultValues(
        account,
        state?.formValues?.outputs[0].address,
    );
    const methods = useForm({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });
    const {
        reset,
        register,
        setValue,
        getValues,
        setError,
        clearErrors,
        handleSubmit,
        formState,
        control,
    } = methods;
    const values = useWatch<CoinmarketExchangeFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isPageOffers ? draftUpdated : null);
    const { outputs } = getValues();
    const token = outputs?.[0]?.token;
    const currency: Option | undefined = getValues(FORM_OUTPUT_CURRENCY);
    const fiatRateKey = getFiatRateKey(
        symbol,
        currency?.value as FiatCurrencyCode,
        token as TokenAddress,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues =
        (values.outputs?.[0]?.fiat || values.outputs?.[0]?.amount) &&
        !!values.receiveCryptoSelect?.value;
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = exchangeInfo?.exchangeList?.length === 0;
    const isLoading = !exchangeInfo?.exchangeList || !state?.formValues?.outputs[0].address;
    const isFormLoading =
        isLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const initState = useCoinmarketCommonFormState<CoinmarketExchangeFormProps>({
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

    const helpers = useCoinmarketExchangeFormHelpers({
        account,
        network,
        methods,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
    });

    const getQuotesRequest = useCallback(
        async (request: ExchangeTradeQuoteRequest) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            if (!request.send || !request.receive || !request.sendStringAmount) {
                timer.stop();

                return;
            }

            abortControllerRef.current = new AbortController();
            invityAPI.createInvityAPIKey(account.descriptor);

            try {
                const allQuotes = await invityAPI.getExchangeQuotes(
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

    const getQuoteRequestData = useCallback((): ExchangeTradeQuoteRequest | null => {
        const { outputs, receiveCryptoSelect, sendCryptoSelect } = getValues();
        const unformattedOutputAmount = outputs[0].amount || '';
        const sendStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, network.decimals)
                : unformattedOutputAmount;

        if (!receiveCryptoSelect?.value || !sendCryptoSelect?.value) return null;

        const request: ExchangeTradeQuoteRequest = {
            receive: receiveCryptoSelect.value as CryptoSymbol,
            send: sendCryptoSelect.value as CryptoSymbol,
            sendStringAmount,
            dex: 'enable',
        };

        return request;
    }, [getValues, network.decimals, shouldSendInSats]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);
            timer.loading();

            const quotesRequest = getQuoteRequestData();

            if (quotesRequest) {
                const allQuotes = await getQuotesRequest(quotesRequest);

                if (Array.isArray(allQuotes)) {
                    const limits = getAmountLimits(allQuotes);
                    const successQuotes = addIdsToQuotes<CoinmarketTradeExchangeType>(
                        getSuccessQuotesOrdered(allQuotes, exchangeInfo),
                        'exchange',
                    );

                    setAmountLimits(limits);
                    setInnerQuotes(successQuotes);
                    dispatch(saveQuotes(successQuotes));
                    dispatch(saveQuoteRequest(quotesRequest));
                } else {
                    setInnerQuotes([]);
                }
            }

            timer.reset();
            setIsSubmittingHelper(false);
        },
        [timer, getQuoteRequestData, getQuotesRequest, exchangeInfo, dispatch],
    );

    const getQuotes = useCallback(async () => {
        if (!selectedQuote && quotesRequest) {
            timer.loading();
            invityAPI.createInvityAPIKey(account.descriptor);
            const allQuotes = await invityAPI.getExchangeQuotes(quotesRequest);
            if (Array.isArray(allQuotes)) {
                if (allQuotes.length === 0) {
                    timer.stop();

                    return;
                }
                const successQuotes = addIdsToQuotes<CoinmarketTradeExchangeType>(
                    getSuccessQuotesOrdered(allQuotes, exchangeInfo),
                    'exchange',
                );
                setInnerQuotes(successQuotes);
            } else {
                setInnerQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, exchangeInfo, quotesRequest, selectedQuote, timer]);

    const selectQuote = async (quote: ExchangeTrade) => {
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;
        if (quotesRequest) {
            const result = await openCoinmarketExchangeConfirmModal(
                provider?.companyName,
                quote.isDex,
                quote.send,
                quote.receive,
            );
            if (result) {
                setSelectedQuote(quote);
                dispatch({
                    type: SET_MODAL_CRYPTO_CURRENCY,
                    modalCryptoSymbol: quote.receive,
                });
                timer.stop();
            }
        }
    };

    const confirmTrade = async (address: string, extraField?: string, trade?: ExchangeTrade) => {
        let ok = false;
        const { address: refundAddress } = getUnusedAddressFromAccount(account);
        if (!trade) {
            trade = selectedQuote;
        }
        if (!trade || !refundAddress) return false;

        if (trade.isDex && !trade.fromAddress) {
            trade = { ...trade, fromAddress: refundAddress };
        }

        setCallInProgress(true);
        const response = await invityAPI.doExchangeTrade({
            trade,
            receiveAddress: address,
            refundAddress,
            extraField,
        });
        if (!response) {
            addNotification({
                type: 'error',
                error: 'No response from the server',
            });
        } else if (
            response.error ||
            !response.status ||
            !response.orderId ||
            response.status === 'ERROR'
        ) {
            addNotification({
                type: 'error',
                error: response.error || 'Error response from the server',
            });
            setSelectedQuote(response);
        } else if (response.status === 'APPROVAL_REQ' || response.status === 'APPROVAL_PENDING') {
            setSelectedQuote(response);
            setExchangeStep('SEND_APPROVAL_TRANSACTION');
            ok = true;
        } else if (response.status === 'CONFIRM') {
            setSelectedQuote(response);
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
            saveTrade(response, account, new Date().toISOString());
            saveTransactionId(response.orderId);
            ok = true;
            navigateToExchangeDetail();
        }
        setCallInProgress(false);

        return ok;
    };

    const sendDexTransaction = async () => {
        if (
            selectedQuote &&
            selectedQuote.dexTx &&
            (selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM')
        ) {
            // after discussion with 1inch, adjust the gas limit by the factor of 1.25
            // swap can use different swap paths when mining tx than when estimating tx
            // the geth gas estimate may be too low
            const result = await recomposeAndSign(
                selectedAccount.account,
                selectedQuote.dexTx.to,
                selectedQuote.dexTx.value,
                selectedQuote.partnerPaymentExtraId,
                selectedQuote.dexTx.data,
                true,
                selectedQuote.status === 'CONFIRM' ? '1.25' : undefined,
            );

            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                const { txid } = result.payload;
                const quote = { ...selectedQuote };
                if (selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO') {
                    quote.receiveTxHash = txid;
                    quote.status = 'CONFIRMING';
                    saveTrade(quote, account, new Date().toISOString());
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                } else {
                    quote.approvalSendTxHash = txid;
                    quote.status = 'APPROVAL_PENDING';
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                }
            }
        } else {
            addNotification({
                type: 'error',
                error: 'Cannot send transaction, missing data',
            });
        }
    };

    const sendTransaction = async () => {
        if (selectedQuote?.isDex) {
            sendDexTransaction();

            return;
        }
        if (
            selectedQuote &&
            selectedQuote.orderId &&
            selectedQuote.sendAddress &&
            selectedQuote.sendStringAmount
        ) {
            const sendStringAmount = shouldSendInSats
                ? amountToSatoshi(selectedQuote.sendStringAmount, network.decimals)
                : selectedQuote.sendStringAmount;
            const result = await recomposeAndSign(
                selectedAccount.account,
                selectedQuote.sendAddress,
                sendStringAmount,
                selectedQuote.partnerPaymentExtraId,
                undefined,
                undefined,
                undefined,
                ['broadcast'],
            );
            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                saveTrade(selectedQuote, account, new Date().toISOString());
                saveTransactionId(selectedQuote.orderId);
                navigateToExchangeDetail();
            }
        } else {
            addNotification({
                type: 'error',
                error: 'Cannot send transaction, missing data',
            });
        }
    };

    const goToOffers = async () => {
        await handleChange(true);

        navigateToExchangeOffers();
    };

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            const fiatValue = values?.outputs?.[0]?.fiat;
            const cryptoInput = values?.outputs?.[0]?.amount;
            const fiatChanged = isChanged(previousValues.current?.outputs?.[0]?.fiat, fiatValue);
            const cryptoChanged = isChanged(
                previousValues.current?.outputs?.[0]?.amount,
                cryptoInput,
            );

            if (fiatChanged || cryptoChanged) {
                if (cryptoChanged && cryptoInput) {
                    helpers.onCryptoAmountChange(cryptoInput);
                }

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
            isChanged(
                previousValues.current?.receiveCryptoSelect?.value,
                values?.receiveCryptoSelect?.value,
            )
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isPageOffers]);

    useCoinmarketLoadData();

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];
        if (!composed) return;

        if (composed.type === 'error' && composed.errorMessage) {
            setError(FORM_OUTPUT_AMOUNT, {
                type: COMPOSE_ERROR_TYPES.COMPOSE,
                message: translationString(composed.errorMessage.id, composed.errorMessage.values),
            });
        }
        // set calculated and formatted "max" value to `Amount` input
        else if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(FORM_OUTPUT_AMOUNT, composed.max, { shouldValidate: true });
                // TODO: updateFiatValue(composed.max);
                clearErrors(FORM_OUTPUT_AMOUNT);
            }
            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit);
        }
    }, [
        selectedFee,
        composedLevels,
        clearErrors,
        dispatch,
        getValues,
        setError,
        setValue,
        translationString,
    ]);

    useDidUpdate(() => {
        const cryptoInputValue = getValues(FORM_OUTPUT_AMOUNT) as string;
        if (!cryptoInputValue) {
            return;
        }
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
        const cryptoAmount = conversion(cryptoInputValue, network.decimals);
        setValue(FORM_OUTPUT_AMOUNT, cryptoAmount, {
            shouldValidate: true,
            shouldDirty: true,
        });
        // TODO: updateFiatValue(cryptoAmount);
    }, [shouldSendInSats]);

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(account.key, values as CoinmarketExchangeFormProps);
            }
        },
        200,
        [
            saveDraft,
            account.key,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);

            return;
        }

        if (values.sendCryptoSelect && !values.sendCryptoSelect?.value) {
            removeDraft(account.key);

            return;
        }

        if (values.receiveCryptoSelect && !values.receiveCryptoSelect?.value) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

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
        const setStateAsync = async (
            initState: CoinmarketUseCommonFormStateReturnProps<CoinmarketExchangeFormProps>,
        ) => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );
            if (initState?.formValues && address) {
                initState.formValues.outputs[0].address = address;

                setState(initState);
            }
        };

        if (!state && initState) {
            setStateAsync(initState);
        }
    }, [state, initState, account, network, device, accounts, chunkify, exchangeInfo?.sellSymbols]);

    useEffect(() => {
        if (selectedQuote && exchangeStep === 'RECEIVING_ADDRESS') {
            const unavailableCapabilities = device?.unavailableCapabilities ?? {};
            // is the symbol supported by the suite and the device natively
            const receiveNetworks = networksCompatibility.filter(
                n =>
                    n.symbol === receiveNetwork &&
                    !unavailableCapabilities[n.symbol] &&
                    ((n.isDebugOnlyNetwork && isDebug) || !n.isDebugOnlyNetwork),
            );
            if (receiveNetworks.length > 0) {
                // get accounts of the current symbol belonging to the current device
                setSuiteReceiveAccounts(
                    accounts.filter(
                        a =>
                            a.deviceState === device?.state &&
                            a.symbol === receiveNetwork &&
                            (!a.empty ||
                                a.visible ||
                                (a.accountType === 'normal' && a.index === 0)),
                    ),
                );

                return;
            }
        }
        setSuiteReceiveAccounts(undefined);
    }, [accounts, device, exchangeStep, isDebug, receiveNetwork, selectedQuote]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToExchangeForm();

            return;
        }

        checkQuotesTimer(getQuotes);
    });

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        type,
        ...methods,
        account,

        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto: () => {},
            },
            helpers,
        },

        device,
        timer,
        callInProgress,
        exchangeInfo,
        symbolsInfo,
        quotes,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        feeInfo,
        fiatRate,
        amountLimits,
        network,
        exchangeStep,
        suiteReceiveAccounts,
        receiveAccount,
        selectedQuote,
        setReceiveAccount,
        composeRequest,
        changeFeeLevel,
        removeDraft,
        setAmountLimits,
        goToOffers,
        setExchangeStep,
        sendTransaction,
        verifyAddress,
        selectQuote,
        getQuotes,
        confirmTrade,
    };
};
