import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { ExchangeTrade } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    hasEip712SignDataType,
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
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingExchangeFormDefaultValues } from 'src/hooks/wallet/trading/form/exchange/useTradingExchangeFormDefaultValues';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';

import { useExchangeApproval } from './useExchangeApproval';
import { useExchangeDexQuote } from './useExchangeDexQuote';
import { useExchangeFlow } from './useExchangeFlow';
import { useExchangeFormInputs } from './useExchangeFormInputs';
import { useExchangeQuotes } from './useExchangeQuotes';
import { useTradingFormReset } from '../common/useTradingFormReset';
import { useTradingFormAccount } from '../useTradingFormAccount';
import { useTradingReceiveAddress } from '../useTradingReceiveAddress';

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

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);
    const [isApproval, setIsApproval] = useState<boolean>(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    useServerEnvironment();

    const symbol = account?.symbol;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = symbol ? getNetwork(symbol) : undefined;

    const { defaultValues } = useTradingExchangeFormDefaultValues(accountKey, cryptoId);

    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues,
    });

    const { reset, register, getValues, setValue, clearErrors, formState, control } = methods;

    // Watch only the values the orchestrator itself renders with; each atomic hook
    // owns its own narrow named subscription. Replaces the former broad useWatch.
    const [outputAmount, outputCurrency, receiveCryptoSelect, sendCryptoSelect, exchangeType] =
        useWatch({
            control,
            name: [
                TRADING_FORM_OUTPUT_AMOUNT,
                TRADING_FORM_OUTPUT_CURRENCY,
                TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
                TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
                TRADING_EXCHANGE_FORM,
            ],
        });

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
        fiatCurrency: outputCurrency?.value || undefined,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!outputAmount && !!receiveCryptoSelect;
    const isAmountEmpty = outputAmount === '';
    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !exchangeInfo?.providerInfos;

    const setAmountLimits = useCallback(
        (limits: TradingExchangeAmountLimitProps | undefined) => {
            dispatch(tradingExchangeActions.setAmountLimits(limits));
        },
        [dispatch],
    );

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
        methods,
        setShowReserveBanner,
        shouldSuppressComposeErrors: hasEip712SignDataType(selectedQuote),
    });

    const isFormLoadingBase = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;

    const { toggleAmountInCrypto: baseToggleAmountInCrypto } = useTradingCurrencySwitcher({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_OUTPUT_AMOUNT,
            fiatInput: TRADING_FORM_OUTPUT_FIAT,
        },
    });

    const { cexQuotes, dexQuotes, isScheduledQuotesRefresh, refreshQuotes } = useExchangeQuotes({
        methods,
        network,
        shouldSendInSats,
        receiveAddress: tradingReceiveAddress.receiveAddress,
        receiveAccountKey: tradingReceiveAddress.selectedAccount?.key,
        receiveAccountSymbol: tradingReceiveAddress.selectedAccount?.symbol,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
    });

    const isFormLoading = isFormLoadingBase || isScheduledQuotesRefresh;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const toggleAmountInCrypto = () => {
        setValue(TRADING_FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
        setValue(TRADING_FORM_OUTPUT_FIAT, '', { shouldDirty: true });
        clearErrors([TRADING_FORM_OUTPUT_AMOUNT, TRADING_FORM_OUTPUT_FIAT]);
        baseToggleAmountInCrypto();
    };

    const helpers = useExchangeFormInputs({
        account,
        methods,
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
    });

    const { fetchFeesAndCompose } = useExchangeDexQuote({
        account,
        methods,
        isFormLoading,
        isLoadingQuote,
        exchangeType,
        sendCryptoSelect,
        selectedQuote,
        dexQuotes,
        composeRequest,
    });

    const { verifyAddress, confirmApproval, approveTransaction, revokeApproval } =
        useExchangeApproval({
            account,
            receiveAddress,
            extraField,
        });

    const { confirmTrade } = useTradingExchangeTradeActions();

    useExchangeFlow({ isFromRedirect, trade, transactionId, isAmountEmpty });

    useTradingFormReset({
        isInfoReady: !!exchangeInfo?.providerInfos,
        reset,
        defaultValues,
    });

    const onQuoteSelected = useCallback(
        (quote: ExchangeTrade) => {
            const quoteProvider = quote.exchange;
            const provider = getValues(TRADING_FORM_PROVIDER_SELECT);
            const currentExchangeType = getValues(TRADING_EXCHANGE_FORM);

            if (quoteProvider && quoteProvider !== provider) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quoteProvider);
            }

            const quoteFormType = quote.isDex
                ? TRADING_EXCHANGE_FORM_DEX
                : TRADING_EXCHANGE_FORM_CEX;
            if (quoteFormType !== currentExchangeType) {
                setValue(TRADING_EXCHANGE_FORM, quoteFormType);
            }
        },
        [getValues, setValue],
    );

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('setMaxOutputId');
    }, [register]);

    return {
        type,
        ...methods,

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
