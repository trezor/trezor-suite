import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

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
    cryptoIdToNetwork,
    exchangeThunks,
    getDexEstimationData,
    hasEip712SignDataType,
    isSendingEvmNativeToken,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeAmountLimits,
    selectTradingExchangeInfo,
    selectTradingExchangeIsFromRedirect,
    selectTradingExchangeIsLoading,
    selectTradingExchangeQuotes,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeTransactionId,
    selectTradingSendAccount,
    selectTradingVerifiedAddress,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork, isAccountBasedNetwork } from '@suite-common/wallet-config';
import { ETHEREUM_ADJUST_GAS_LIMIT, updateFeeInfoThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingExchangeHandleChange } from 'src/hooks/wallet/trading/form/common/useTradingExchangeHandleChange';
import { useTradingExchangeQuotesFilter } from 'src/hooks/wallet/trading/form/common/useTradingExchangeQuotesFilter';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFormActions } from 'src/hooks/wallet/trading/form/common/useTradingFormActions';
import { useTradingExchangeFormDefaultValues } from 'src/hooks/wallet/trading/form/useTradingExchangeFormDefaultValues';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type Dispatch } from 'src/types/suite';
import {
    type TradingExchangeConfirmTradeProps,
    type TradingExchangeFormContextProps,
} from 'src/types/trading/tradingForm';

import { useTradingClearStaleQuotes } from './common/useTradingClearStaleQuotes';
import { useTradingExchangeTradeRequest } from './common/useTradingExchangeTradeRequest';
import { useTradingFormAccount } from './useTradingFormAccount';
import { useTradingReceiveAddress } from './useTradingReceiveAddress';

export const useTradingExchangeForm = (): TradingExchangeFormContextProps => {
    const type = 'exchange';
    const dispatch = useDispatch();
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
    const isFromRedirect = useSelector(selectTradingExchangeIsFromRedirect);
    const quotes = useSelector(selectTradingExchangeQuotes);
    const transactionId = useSelector(selectTradingExchangeTransactionId);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const amountLimits = useSelector(selectTradingExchangeAmountLimits);
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const verifiedAddress = useSelector(selectTradingVerifiedAddress);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const trade = useSelector(selectTradingExchangeActiveTrade);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    // used for disabling approve/revoke controls when
    // quotes are scheduled to refresh after changing swap form inputs
    const [isScheduledQuotesRefresh, setIsScheduledQuotesRefresh] = useState(false);
    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    useServerEnvironment();

    const [isApproval, setIsApproval] = useState<boolean>(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);

    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    const { symbol } = account;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = getNetwork(account.symbol);

    const { defaultValues } = useTradingExchangeFormDefaultValues(accountKey, cryptoId);

    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues,
    });

    const { reset, register, getValues, setValue, formState, control } = methods;
    const values = useWatch({ control }) as TradingExchangeFormProps;
    const { provider } = values;
    const {
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
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
    });
    const { receiveAddress, extraField } = tradingReceiveAddress;
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    useTradingFiatValues({
        cryptoId: receiveCryptoSelect?.id,
        amount: selectedQuote?.receiveStringAmount,
        fiatCurrency: output?.currency?.value || undefined,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!output?.amount && !!values.receiveCryptoSelect;
    const isAmountEmpty = output?.amount === '';
    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !exchangeInfo?.providerInfos;
    const shouldResetOnInitialExchangeInfoLoad = useRef(isInitialDataLoading);

    const setAmountLimits = useCallback(
        (limits: TradingExchangeAmountLimitProps | undefined) => {
            dispatch(tradingExchangeActions.setAmountLimits(limits));
        },
        [dispatch],
    );

    const { cexQuotes, dexQuotes } = useTradingExchangeQuotesFilter({
        exchangeType,
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
        type: 'exchange',
        account,
        network,
        values,
        methods,
        setShowReserveBanner,
        shouldSuppressComposeErrors: hasEip712SignDataType(selectedQuote),
    });

    const isFormLoading = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

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
        shouldSendInSats,
        receiveAddress: tradingReceiveAddress.receiveAddress,
        receiveAccountKey: tradingReceiveAddress.selectedAccount?.key,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
        setIsScheduledQuotesRefresh,
    });

    useTradingClearStaleQuotes({ type, isAmountEmpty });

    const helpers = useTradingFormActions({
        account,
        methods,
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
        receiveAddress: tradingReceiveAddress.receiveAddress,
    });

    const confirmTrade = async ({
        receiveAddress: confirmReceiveAddress,
        trade: confirmedTrade,
        approvalFlow,
        ...props
    }: TradingExchangeConfirmTradeProps): Promise<ExchangeTrade | undefined> => {
        const commonFunctions = await getTradeRequestParams(confirmedTrade);

        if (!commonFunctions) return undefined;

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress: confirmReceiveAddress,
                account,
                extraField: props.extraField ?? extraField,
                trade: confirmedTrade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        ).unwrap();
    };

    const verifyAddress =
        (verifiedAccount: Account, address: string | undefined, path: string | undefined) =>
        async (innerDispatch: Dispatch) => {
            await innerDispatch(
                tradingThunks.verifyAddressThunk({
                    account: verifiedAccount,
                    address,
                    path,
                }),
            );
        };

    const confirmApproval = async ({
        trade: approvalTrade,
        receiveAddress: approvalReceiveAddress,
    }: {
        trade?: ExchangeTrade;
        receiveAddress: string;
    }) => {
        const commonFunctions = await getTradeRequestParams(approvalTrade);
        if (!commonFunctions) return undefined;
        const { processResponseData } = commonFunctions;

        return await dispatch(
            exchangeThunks.confirmApprovalThunk({
                receiveAddress: approvalReceiveAddress,
                account,
                extraField,
                trade: approvalTrade,
                processResponseData,
            }),
        ).unwrap();
    };

    const approveTransaction = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const newTrade = await confirmApproval({
            trade: { ...exchangeTrade, status: 'CONFIRM' },
            receiveAddress,
        });

        return !!newTrade;
    };

    const revokeApproval = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const approvalType: DexApprovalType = 'ZERO';
        const updatedTrade: ExchangeTrade = {
            ...exchangeTrade,
            approvalType,
            status: exchangeTrade.status === 'APPROVAL_REQ' ? 'APPROVAL_REQ' : 'CONFIRM',
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedTrade));

        const newTrade = await confirmApproval({
            trade: updatedTrade,
            receiveAddress,
        });

        return !!newTrade;
    };

    const resetSelectedOffer = useCallback(() => {
        setIsScheduledQuotesRefresh(true);
    }, []);

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
        const fromAddress = isAccountBasedNetwork(account.symbol) ? account.descriptor : undefined;

        setValueRef.current('fromAddress', fromAddress);
    }, [account.symbol, account.descriptor, setValueRef]);

    // set transactionData from DEX quote for correct fees fetching
    useEffect(() => {
        if (!sendCryptoSelect?.id) return;
        if (isFormLoading || isLoadingQuote) return;

        if (exchangeType !== TRADING_EXCHANGE_FORM_DEX) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const sendNetwork = cryptoIdToNetwork(sendCryptoSelect.id);
        const isEvmNativeToken = isSendingEvmNativeToken(sendCryptoSelect.id);
        const requiresApproval = sendNetwork?.networkType === 'ethereum' && !isEvmNativeToken;

        const quote = requiresApproval ? selectedQuote : dexQuotes[0];

        if (!quote?.dexTx) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const { dexTx } = quote;

        setValue('transactionData', getDexEstimationData(quote) ?? '');
        setValue(TRADING_FORM_OUTPUT_ADDRESS, dexTx.to);
        setValue('ethereumAdjustGasLimit', ETHEREUM_ADJUST_GAS_LIMIT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dexQuotes,
        selectedQuote,
        exchangeType,
        isApproval,
        sendCryptoSelect,
        isFormLoading,
        isLoadingQuote,
    ]);

    const fetchFeesAndComposeRef = useCurrentRef(fetchFeesAndCompose);
    // fetch fees when transactionData changes
    useEffect(() => {
        fetchFeesAndComposeRef.current();
    }, [transactionData, outputAddress, ethereumAdjustGasLimit, fetchFeesAndComposeRef]);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    const onQuoteSelected = useCallback(
        (quote: ExchangeTrade) => {
            const quoteProvider = quote.exchange;
            if (quoteProvider && quoteProvider !== provider) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quoteProvider);
            }

            const quoteFormType = quote.isDex
                ? TRADING_EXCHANGE_FORM_DEX
                : TRADING_EXCHANGE_FORM_CEX;
            if (quoteFormType !== exchangeType) {
                setValue(TRADING_EXCHANGE_FORM, quoteFormType);
            }
        },
        [provider, exchangeType, setValue],
    );

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('setMaxOutputId');
    }, [register]);

    // bind actual default values when we've got exchangeInfo from Invity API server
    useEffect(() => {
        if (exchangeInfo && !isInitialDataLoading && shouldResetOnInitialExchangeInfoLoad.current) {
            shouldResetOnInitialExchangeInfoLoad.current = false;
            reset(defaultValues);
        }
    }, [reset, exchangeInfo, defaultValues, isInitialDataLoading]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingExchangeActions.setTradingAccountKey(trade.sendAccountKey));
                }
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
        exchangeInfo,
        quotes,
        dexQuotes,
        cexQuotes,
        quotesRequest,
        isComposing,
        composedLevels,
        feeInfo,
        amountLimits,
        network,
        receiveAccount,
        selectedQuote,
        verifiedAddress,
        shouldSendInSats,
        trade,
        isAmountEmpty,
        setReceiveAccount,
        composeRequest,
        composedTransactionInfo,
        changeFeeLevel,
        setAmountLimits,
        onQuoteSelected,
        verifyAddress,
        confirmTrade,
        approveTransaction,
        revokeApproval,
        confirmApproval,
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
