import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { useSelector } from '@suite-common/redux-utils';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingAmountLimitProps,
    type TradingSellFormProps,
    selectTradingComposedTransactionInfo,
    selectTradingSellActiveTrade,
    selectTradingSellAmountLimits,
    selectTradingSellInfo,
    selectTradingSellIsFromRedirect,
    selectTradingSellIsLoading,
    selectTradingSellQuotesRequest,
    selectTradingSellTransactionId,
    selectTradingSendAccount,
    tradingSellActions,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';

import { useSolanaSubscribeBlocks } from 'src/hooks/wallet/form/useSolanaSubscribeBlocks';
import { useTradingComposeTransaction } from 'src/hooks/wallet/trading/form/common/useTradingComposeTransaction';
import { useTradingCurrencySwitcher } from 'src/hooks/wallet/trading/form/common/useTradingCurrencySwitcher';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingSellFormContextProps } from 'src/types/trading/tradingForm';

import { useSellFlow } from './useSellFlow';
import { useSellFormInputs } from './useSellFormInputs';
import { useSellQuotes } from './useSellQuotes';
import { useTradingSellFormDefaultValues } from './useTradingSellFormDefaultValues';
import { useTradingSellFormRedirectValues } from './useTradingSellFormRedirectValues';
import { useTradingFormReset } from '../common/useTradingFormReset';
import { useTradingFormAccount } from '../useTradingFormAccount';

export const useTradingSellForm = (): TradingSellFormContextProps => {
    const type = 'sell';
    const dispatch = useDispatch();
    const isLoading = useSelector(selectTradingSellIsLoading);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);
    const sellInfo = useSelector(selectTradingSellInfo);
    const amountLimits = useSelector(selectTradingSellAmountLimits);

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    const { tradingAccountKey: accountKey, cryptoId } = useTradingFormAccount(type);

    const trade = useSelector(selectTradingSellActiveTrade);
    const account = useSelector(state => selectTradingSendAccount(state, type));

    useServerEnvironment();

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const network = account ? networks[account.symbol] : undefined;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);

    const { defaultValues } = useTradingSellFormDefaultValues(
        accountKey,
        cryptoId,
        sellInfo?.country,
        sellInfo?.countrySubdivision,
    );
    const redirectValues = useTradingSellFormRedirectValues(isFromRedirect, quotesRequest);
    const methods = useForm<TradingSellFormProps>({
        mode: 'onChange',
        defaultValues: redirectValues ?? defaultValues,
    });
    const { register, reset, control, formState } = methods;
    // Watch only those values that are relevant in the render function
    const [outputAmount] = useWatch({
        control,
        name: [TRADING_FORM_OUTPUT_AMOUNT],
    });

    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = !!outputAmount;
    const isAmountEmpty = outputAmount === '';
    const noProviders = Object.keys(sellInfo?.providerInfos ?? {}).length === 0;
    const isInitialDataLoading = !sellInfo?.providerInfos;

    const setAmountLimits = (limits: TradingAmountLimitProps | undefined) => {
        dispatch(tradingSellActions.setAmountLimits(limits));
    };

    const {
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        setComposedLevels,
        composeRequest,
    } = useTradingComposeTransaction<TradingSellFormProps>({
        type: 'sell',
        account,
        network,
        methods,
        setShowReserveBanner,
    });

    const isFormLoadingBase =
        isInitialDataLoading || formState.isSubmitting || isLoading || isComposing;
    const isFormInvalid = !(formIsValid && hasValues);

    const { toggleAmountInCrypto } = useTradingCurrencySwitcher<TradingSellFormProps>({
        account,
        methods,
        inputNames: {
            cryptoInput: TRADING_FORM_OUTPUT_AMOUNT,
            fiatInput: TRADING_FORM_OUTPUT_FIAT,
        },
    });

    const { isScheduledQuotesRefresh } = useSellQuotes({
        methods,
        network,
        shouldSendInSats,
        composeRequestCallback: () => {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        },
    });

    const isFormLoading = isFormLoadingBase || isScheduledQuotesRefresh;
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const helpers = useSellFormInputs({
        account,
        methods,
        setAmountLimits,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
        setAccountOnChange: newAccount => {
            dispatch(tradingSellActions.setTradingAccountKey(newAccount.key));
        },
        composedLevels,
        composedTransactionInfo,
        setShowReserveBanner,
    });

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('options');
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    useSellFlow({ isFromRedirect, trade, transactionId, isAmountEmpty });

    useTradingFormReset({
        isInfoReady: !!sellInfo,
        reset,
        defaultValues,
    });

    // Subscribe to blocks for Solana, since they are not fetched globally
    useSolanaSubscribeBlocks(account);

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
        methods,
        composedLevels,
        feeInfo,
        isComposing,
        amountLimits,
        network,
        shouldSendInSats,
        isAmountEmpty,
        changeFeeLevel,
        composeRequest,
        setAmountLimits,
        showReserveBanner,
        setShowReserveBanner,
    };
};
