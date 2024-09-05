import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type {
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    FiatCurrencyCode,
} from 'invity-api';
import useDebounce from 'react-use/lib/useDebounce';
import {
    amountToSatoshi,
    formatAmount,
    getNetwork,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { isChanged } from '@suite-common/suite-utils';
import { useActions, useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { saveQuoteRequest, saveQuotes } from 'src/actions/wallet/coinmarketExchangeActions';
import {
    addIdsToQuotes,
    getUnusedAddressFromAccount,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    coinmarketGetExchangeReceiveCryptoId,
    getAmountLimits,
    getCexQuotesByRateType,
    getSuccessQuotesOrdered,
} from 'src/utils/wallet/coinmarket/exchangeUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CryptoAmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { Account } from '@suite-common/wallet-types';
import {
    CoinmarketTradeExchangeType,
    UseCoinmarketFormProps,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketExchangeFormContextProps,
    CoinmarketExchangeFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_DEX,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_FIAT,
    FORM_EXCHANGE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketExchangeFormDefaultValues } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeFormDefaultValues';
import {
    getFilteredSuccessQuotes,
    useCoinmarketCommonOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useCoinmarketRecomposeAndSign } from 'src/hooks/wallet/useCoinmarketRecomposeAndSign';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { useCoinmarketComposeTransaction } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketComposeTransaction';
import { useCoinmarketFormActions } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketFormActions';
import { useCoinmarketCurrencySwitcher } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketCurrencySwitcher';
import { useCoinmarketFiatValues } from './common/useCoinmarketFiatValues';
import { CoinmarketExchangeStepType } from 'src/types/coinmarket/coinmarketOffers';
import { useCoinmarketModalCrypto } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketModalCrypto';
import { NetworkCompatible } from '@suite-common/wallet-config';
import { useCoinmarketAccount } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketAccount';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

export const useCoinmarketExchangeForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketExchangeFormContextProps => {
    const type = 'exchange';
    const isNotFormPage = pageType !== 'form';
    const {
        exchangeInfo,
        quotesRequest,
        quotes,
        coinmarketAccount,
        selectedQuote,
        addressVerified,
    } = useSelector(state => state.wallet.coinmarket.exchange);
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    // selectedAccount is used as initial state if this is form page
    // coinmarketAccount is used on offers page
    const [account, setAccount] = useCoinmarketAccount({
        coinmarketAccount,
        selectedAccount,
        isNotFormPage,
    });
    const { callInProgress, timer, device, setCallInProgress, checkQuotesTimer } =
        useCoinmarketCommonOffers({ selectedAccount, type });
    const { buildDefaultCryptoOption } = useCoinmarketInfo();

    const dispatch = useDispatch();
    const { recomposeAndSign } = useCoinmarketRecomposeAndSign();

    const [amountLimits, setAmountLimits] = useState<CryptoAmountLimits | undefined>(undefined);

    const [innerQuotes, setInnerQuotes] = useState<ExchangeTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeExchangeType>(quotes),
    );
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [exchangeStep, setExchangeStep] =
        useState<CoinmarketExchangeStepType>('RECEIVING_ADDRESS');
    const {
        navigateToExchangeForm,
        navigateToExchangeDetail,
        navigateToExchangeOffers,
        navigateToExchangeConfirm,
    } = useCoinmarketNavigation(account);

    const {
        saveTrade,
        openCoinmarketExchangeConfirmModal,
        saveTransactionId,
        addNotification,
        verifyAddress,
        saveSelectedQuote,
        setCoinmarketExchangeAccount,
    } = useActions({
        saveTrade: coinmarketExchangeActions.saveTrade,
        openCoinmarketExchangeConfirmModal:
            coinmarketExchangeActions.openCoinmarketExchangeConfirmModal,
        saveTransactionId: coinmarketExchangeActions.saveTransactionId,
        addNotification: notificationsActions.addToast,
        verifyAddress: coinmarketExchangeActions.verifyAddress,
        saveSelectedQuote: coinmarketExchangeActions.saveSelectedQuote,
        setCoinmarketExchangeAccount: coinmarketExchangeActions.setCoinmarketExchangeAccount,
    });

    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = getNetwork(account.symbol) as NetworkCompatible;

    const { defaultCurrency, defaultValues } = useCoinmarketExchangeFormDefaultValues(account);
    const exchangeDraftKey = 'coinmarket-exchange';
    const { getDraft, saveDraft, removeDraft } =
        useFormDraft<CoinmarketExchangeFormProps>(exchangeDraftKey);
    const draft = getDraft(exchangeDraftKey);
    const isDraft = !!draft;
    const getDraftUpdated = (): CoinmarketExchangeFormProps | null => {
        if (!draft) return null;
        if (isNotFormPage) return draft;

        const defaultReceiveCryptoSelect = coinmarketGetExchangeReceiveCryptoId(
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
    const values = useWatch<CoinmarketExchangeFormProps>({ control });
    const { rateType, exchangeType } = getValues();
    const output = values.outputs?.[0];
    const fiatValues = useCoinmarketFiatValues({
        accountBalance: account.formattedBalance,
        cryptoSymbol: values?.sendCryptoSelect?.value as CryptoId,
        tokenAddress: output?.token,
        fiatCurrency: output?.currency?.value as FiatCurrencyCode,
    });
    const fiatOfBestScoredQuote = innerQuotes?.[0]?.sendStringAmount
        ? toFiatCurrency(innerQuotes?.[0]?.sendStringAmount, fiatValues?.fiatRate?.rate, 2)
        : null;

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount;
    const isFirstRequest = innerQuotes === undefined;
    const noProviders = exchangeInfo?.exchangeList?.length === 0;
    const isInitialDataLoading = !exchangeInfo?.exchangeList;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;

    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const filteredCexQuotes = useMemo(
        () => getCexQuotesByRateType(rateType, innerQuotes, exchangeInfo),
        [rateType, innerQuotes, exchangeInfo],
    );
    const dexQuotes = useMemo(() => innerQuotes?.filter(q => q.isDex), [innerQuotes]);

    const { isComposing, composedLevels, feeInfo, changeFeeLevel, composeRequest } =
        useCoinmarketComposeTransaction<CoinmarketExchangeFormProps>({
            account,
            network,
            values: values as CoinmarketExchangeFormProps,
            methods,
        });

    const { toggleAmountInCrypto } = useCoinmarketCurrencySwitcher({
        account,
        methods,
        network,
        quoteCryptoAmount: innerQuotes?.[0]?.sendStringAmount,
        quoteFiatAmount: fiatOfBestScoredQuote ?? '',
        inputNames: {
            cryptoInput: FORM_OUTPUT_AMOUNT,
            fiatInput: FORM_OUTPUT_FIAT,
        },
    });

    const getQuotesRequest = useCallback(
        async (request: ExchangeTradeQuoteRequest) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            invityAPI.createInvityAPIKey(account.descriptor);

            const allQuotes = await invityAPI.getExchangeQuotes(
                request,
                abortControllerRef.current.signal,
            );

            return allQuotes;
        },
        [account.descriptor],
    );

    const getQuoteRequestData = useCallback((): ExchangeTradeQuoteRequest | null => {
        const { outputs, receiveCryptoSelect, sendCryptoSelect } = getValues();
        const unformattedOutputAmount = outputs[0].amount ?? '';
        const sendStringAmount =
            unformattedOutputAmount && shouldSendInSats
                ? formatAmount(unformattedOutputAmount, network.decimals)
                : unformattedOutputAmount;

        if (
            !receiveCryptoSelect?.value ||
            !sendCryptoSelect?.value ||
            !sendStringAmount ||
            Number(sendStringAmount) === 0
        ) {
            return null;
        }

        const request: ExchangeTradeQuoteRequest = {
            receive: receiveCryptoSelect.value,
            send: sendCryptoSelect.value,
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

            if (!quotesRequest) {
                setInnerQuotes([]);
                setIsSubmittingHelper(false);
                timer.stop();

                return;
            }

            const allQuotes = await getQuotesRequest(quotesRequest);

            if (Array.isArray(allQuotes)) {
                const limits = getAmountLimits(allQuotes);
                if (limits) {
                    limits.currency =
                        cryptoIdToCoinSymbol(limits.currency as CryptoId) ?? limits.currency;
                }

                const successQuotes = addIdsToQuotes<CoinmarketTradeExchangeType>(
                    getSuccessQuotesOrdered(allQuotes),
                    'exchange',
                );

                setAmountLimits(limits);
                setInnerQuotes(successQuotes);
                dispatch(saveQuotes(successQuotes));
                dispatch(saveQuoteRequest(quotesRequest));

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
            timer,
            values,
            cryptoIdToCoinSymbol,
            getQuoteRequestData,
            getQuotesRequest,
            dispatch,
            composeRequest,
        ],
    );

    const helpers = useCoinmarketFormActions({
        account,
        methods,
        isNotFormPage,
        draftUpdated,
        type,
        handleChange,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setAccountOnChange: newAccount => {
            dispatch(setCoinmarketExchangeAccount(newAccount));
            setAccount(newAccount);
        },
    });

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
                    getSuccessQuotesOrdered(allQuotes),
                    'exchange',
                );
                setInnerQuotes(successQuotes);
            } else {
                setInnerQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, quotesRequest, selectedQuote, timer]);

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
                saveSelectedQuote(quote);

                navigateToExchangeConfirm();
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
            saveSelectedQuote(response);
        } else if (response.status === 'APPROVAL_REQ' || response.status === 'APPROVAL_PENDING') {
            saveSelectedQuote(response);
            setExchangeStep('SEND_APPROVAL_TRANSACTION');
            ok = true;
        } else if (response.status === 'CONFIRM') {
            saveSelectedQuote(response);
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

    useCoinmarketLoadData();
    useCoinmarketModalCrypto({
        receiveCurrency: values.receiveCryptoSelect?.value as CryptoId | undefined,
    });

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(exchangeDraftKey, values as CoinmarketExchangeFormProps);
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

    // react-hook-form reset, set default values
    useEffect(() => {
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, isDraft, defaultValues]);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
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

    // handle edge case when there are no longer quotes of selected exchange type
    useEffect(() => {
        if (exchangeType === FORM_EXCHANGE_DEX && !dexQuotes?.length && filteredCexQuotes?.length) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX);
        } else if (
            exchangeType === FORM_EXCHANGE_CEX &&
            !filteredCexQuotes?.length &&
            dexQuotes?.length
        ) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_DEX);
        } else if (
            exchangeType === FORM_EXCHANGE_DEX &&
            !dexQuotes?.length &&
            !filteredCexQuotes?.length
        ) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX);
        }
    }, [dexQuotes, exchangeType, filteredCexQuotes, setValue]);

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
        callInProgress,
        exchangeInfo,
        quotes: filteredCexQuotes,
        dexQuotes,
        quotesRequest,
        composedLevels,
        defaultCurrency,
        feeInfo,
        amountLimits,
        network,
        exchangeStep,
        receiveAccount,
        selectedQuote,
        addressVerified,
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
        confirmTrade,
    };
};
