import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    type TradingFormAccountRootState,
    getExchangeFromAddress,
    hasEip712SignDataType,
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeAmountLimits,
    selectTradingExchangeFormValues,
    selectTradingExchangeIsLoading,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
    selectTradingSelectedQuoteByFormValues,
    selectTradingSendAccount,
    selectTradingVerifiedAddress,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useExchangeApproval } from './useExchangeApproval';
import { useExchangeDexQuote } from './useExchangeDexQuote';
import { useExchangeFormInputs } from './useExchangeFormInputs';
import { useExchangeQuotes } from './useExchangeQuotes';
import { useTradingExchangeFormDefaultValues } from './useTradingExchangeFormDefaultValues';
import { type TradingExchangeFormContextProps } from '../../../../../types/trading/tradingForm';
import { useSolanaSubscribeBlocks } from '../../../form/useSolanaSubscribeBlocks';
import { useBitcoinAmountUnit } from '../../../useBitcoinAmountUnit';
import { useServerEnvironment } from '../../useServerEnviroment';
import { useTradingExchangeTradeActions } from '../../useTradingExchangeTradeActions';
import { useTradingAmountUnitSync } from '../common/useTradingAmountUnitSync';
import { useTradingClearStaleQuotes } from '../common/useTradingClearStaleQuotes';
import { useTradingComposeTransaction } from '../common/useTradingComposeTransaction';
import { useTradingFiatValues } from '../common/useTradingFiatValues';
import { useTradingFormReset } from '../common/useTradingFormReset';
import { useTradingFormAccount } from '../useTradingFormAccount';
import { useTradingReceiveAddress } from '../useTradingReceiveAddress';

export const useTradingExchangeForm = (): TradingExchangeFormContextProps => {
    // React Compiler: react-hook-form edits `formState.errors` in place, so the object keeps one
    // identity until the next `reset` and a compiled `Object.keys` of it -- this form's or the
    // receive-address form's -- is never recomputed. A swap amount above the balance would keep the
    // previous offer and leave Approve enabled. Naming `formState`, as the return value below does,
    // cannot help: the guard compares the errors object itself. Remove once form validity derives
    // from a value that changes identity when an error is added or cleared.
    'use no memo';

    const type = 'exchange';
    const { dispatch } = useServices(injectDispatch);
    const savedFormValues = useSelector(selectTradingExchangeFormValues);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const amountLimits = useSelector(selectTradingExchangeAmountLimits);
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const verifiedAddress = useSelector(selectTradingVerifiedAddress);
    const exchangeProviders = useSelector(selectTradingExchangeProviders);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, type),
    );

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();

    useServerEnvironment();

    const symbol = account?.symbol;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const network = symbol ? getNetwork(symbol) : undefined;

    const { defaultValues } = useTradingExchangeFormDefaultValues(accountKey, cryptoId);
    const initialValues = savedFormValues ?? defaultValues;

    const methods = useForm<TradingExchangeFormProps>({
        mode: 'onChange',
        defaultValues: initialValues,
    });

    const { reset, register, formState, control } = methods;

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

    const provider = useWatch({ control, name: TRADING_FORM_PROVIDER_SELECT });
    const formQuote = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSelectedQuoteByFormValues(state, 'exchange', { provider, exchangeType }),
    );

    const tradingReceiveAddress = useTradingReceiveAddress({
        type: 'exchange',
        cryptoId: receiveCryptoSelect?.id,
        nonSuiteAccount: false,
    });
    const isReceiveAddressFormValid =
        Object.keys(tradingReceiveAddress.form.formState.errors).length === 0;

    useTradingFiatValues({
        cryptoId: receiveCryptoSelect?.id,
        amount: selectedQuote?.receiveStringAmount,
        fiatCurrency: outputCurrency?.value || undefined,
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!outputAmount && !!receiveCryptoSelect && !!sendCryptoSelect;
    const isAmountEmpty = outputAmount === '';
    const noProviders = Object.keys(exchangeProviders ?? {}).length === 0;
    const isInitialDataLoading = !exchangeProviders;

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
        isComposeErrorPending:
            !!formQuote &&
            requiresTokenApproval(formQuote) &&
            !!tradingReceiveAddress.receiveAddress &&
            !selectedQuote,
    });

    const isFormLoadingBase = isInitialDataLoading || formState.isSubmitting || isLoading;
    const isFormInvalid = !(formIsValid && hasValues) || !isReceiveAddressFormValid;

    useTradingAmountUnitSync({
        networkSymbol: account?.symbol,
        methods,
        cryptoInputName: TRADING_FORM_OUTPUT_AMOUNT,
    });

    const { isScheduledQuotesRefresh, refreshQuotes } = useExchangeQuotes({
        methods,
        network,
        shouldSendInSats,
        fromAddress: getExchangeFromAddress(account),
        receiveAddress: tradingReceiveAddress.receiveAddress,
        receiveAccountKey: tradingReceiveAddress.selectedAccount?.key,
        receiveAccountSymbol: tradingReceiveAddress.selectedAccount?.symbol,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
    });

    const isFormLoading = isFormLoadingBase || isScheduledQuotesRefresh;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

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
        composeRequest,
    });

    const { verifyAddress } = useExchangeApproval({ account });

    const { confirmTrade } = useTradingExchangeTradeActions();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: type }));
    }, [dispatch]);

    useTradingClearStaleQuotes({ type, isAmountEmpty });

    useTradingFormReset({
        isInfoReady: !!exchangeProviders,
        reset,
        defaultValues: initialValues,
    });

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
        // The spread copies react-hook-form's ref object, whose `formState` is replaced by a
        // new proxy on every update. Naming it puts a moving dependency in the compiler's guard,
        // so this context value is rebuilt when validation state changes.
        formState,

        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,
            },
            helpers,
        },
        methods,
        isComposing,
        composedLevels,
        feeInfo,
        amountLimits,
        network,
        receiveAccount,
        verifiedAddress,
        shouldSendInSats,
        isAmountEmpty,
        setReceiveAccount,
        composeRequest,
        changeFeeLevel,
        setAmountLimits,
        verifyAddress,
        confirmTrade,
        refreshQuotes,
        isScheduledQuotesRefresh,
        fetchFeesAndCompose,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        showReserveBanner,
        setShowReserveBanner,
    };
};
