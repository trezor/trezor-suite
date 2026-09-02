import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    isFinalStatus,
    parseCryptoId,
    selectTradingExchangeFormStep,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingExchangePreview
>;

type UseExchangeSignTransactionParams = {
    onSignTransactionNavigation: () => void;
};

/**
 * Continuation of the exchange preview towards signing — shared by the footer
 * continue button and the swap-issues banner's "Continue anyway".
 */
export const useExchangeSignTransaction = ({
    onSignTransactionNavigation,
}: UseExchangeSignTransactionParams) => {
    const navigation = useNavigation<NavigationProp>();

    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const formStep = useSelector(selectTradingExchangeFormStep);

    const isSignDataFlow = formStep === 'SIGN_DATA';
    const isTXFinalType = precomposedTransaction?.type === 'final';
    const isTradeFinalized = isFinalStatus('exchange', quote?.status);

    const { isLoading: isSimulationLoading } = useDexExchangeTxSimulation();

    const isSigningPreparationLoading = (!isSignDataFlow && !isTXFinalType) || isSimulationLoading;

    const handleSignTransaction = useCallback(() => {
        if (!quote || !fromAccount) {
            console.warn('quote or fromAccount is not defined', {
                hasQuote: !!quote,
                hasFromAccount: !!fromAccount,
            });

            return;
        }

        const tokenContract = quote.send
            ? (parseCryptoId(quote.send)?.contractAddress as TokenAddress)
            : undefined;

        navigation.navigate(RootStackRoutes.TradingExchangeOutputsReview, {
            accountKey: fromAccount.key,
            tokenContract,
            orderId: quote.orderId ?? '',
            flowType: isSignDataFlow ? 'sign-data' : 'swap',
        });
        onSignTransactionNavigation();
    }, [navigation, quote, fromAccount, isSignDataFlow, onSignTransactionNavigation]);

    return {
        handleSignTransaction,
        isSignDataFlow,
        isTXFinalType,
        isTradeFinalized,
        isSigningPreparationLoading,
    };
};
