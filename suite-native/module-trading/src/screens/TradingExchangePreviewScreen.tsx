import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { parseCryptoId, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { TokenAddress } from '@suite-common/wallet-types';
import { Button, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useSubscribeForSolanaBlockUpdates } from '@suite-native/transaction-management';

import { ExchangeTradePreviewCard } from '../components/exchange/ExchangeTradePreviewCard';
import { FeePickerCard } from '../components/fees/FeePickerCard';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { useChangeStringsExtractor } from '../hooks/history/useChangeStringsExtractor';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '../selectors/exchangeSelectors';
import { clearTradingStateThunk } from '../thunks';
import { getReceiveAccountAddressText } from '../utils/general/receiveAccountUtils';

export type TradingExchangePreviewScreenProps = StackProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangePreview
>;

type FlowStep = 'confirm' | 'signTxn';

// TODO: this is very WIP just to be able to test the flow
// it wont be implemented in this component this way in the end
const flowStepToButtonText: Record<FlowStep, string> = {
    confirm: 'Continue',
    signTxn: 'Sign and Send Transaction',
};

export const TradingExchangePreviewScreen = ({ navigation }: TradingExchangePreviewScreenProps) => {
    const dispatch = useDispatch();
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const hasRequestedTradeConfirmation = useRef(false);

    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);

    useSubscribeForSolanaBlockUpdates(fromAccount ?? null);

    const { txnErrorString, confirmTrade, fetchFeesAndCompose } = useExchangeFlow();

    const [flowStep, setFlowStep] = useState<FlowStep>('confirm');

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    const handleConfirmTrade = useCallback(async () => {
        const addressText = getReceiveAccountAddressText(toAccount);

        if (!addressText) {
            console.warn('receiveAddress is not defined', quote);

            return;
        }
        try {
            const success = await confirmTrade({
                sendAccount: fromAccount,
                receiveAddress: addressText,
                trade: quote,
                approvalFlow: false,
            });

            if (success) {
                await fetchFeesAndCompose();
                setFlowStep('signTxn');
            }
        } catch (e) {
            // TODO: show warning https://github.com/trezor/trezor-suite/issues/21882
            console.error('Failed to confirm trade', e);
        }
    }, [confirmTrade, fetchFeesAndCompose, fromAccount, quote, toAccount]);

    useEffect(() => {
        if (!hasRequestedTradeConfirmation.current) {
            hasRequestedTradeConfirmation.current = true;

            handleConfirmTrade();
        }
        // only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignTransaction = () => {
        if (!quote || !fromAccount) {
            console.warn('quote or fromAccount is not defined', quote, fromAccount);

            return;
        }

        const tokenContract = quote.send
            ? (parseCryptoId(quote.send)?.contractAddress as TokenAddress)
            : undefined;

        navigation.navigate({
            name: TradingStackRoutes.TradingOutputsReview,
            params: {
                tradingType: 'exchange',
                accountKey: fromAccount.key,
                tokenContract,
            },
        });
    };

    const handleTapContinue = () => {
        if (flowStep === 'signTxn') {
            handleSignTransaction();
        } else {
            console.warn('Unknown flow step', flowStep);
        }
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradingExchangePreviewScreen.title" />}
                    closeActionType="close"
                />
            }
        >
            <ScrollView>
                <VStack spacing="sp20" paddingVertical="sp20">
                    {txnErrorString && (
                        <Animated.View>
                            <InlineAlertBox variant="critical" title={txnErrorString} />
                        </Animated.View>
                    )}
                    {fromAccount && quote?.send && (
                        <ExchangeTradePreviewCard
                            account={fromAccount}
                            cryptoId={quote.send}
                            amount={
                                <Text variant="hint" color="textAlertRed">
                                    -{fromStringValue}
                                </Text>
                            }
                            title={
                                <Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />
                            }
                        />
                    )}
                    {toAccount?.account && quote?.receive && (
                        <ExchangeTradePreviewCard
                            account={toAccount.account}
                            cryptoId={quote.receive}
                            amount={
                                <Text variant="hint" color="textSecondaryHighlight">
                                    +{toStringValue}
                                </Text>
                            }
                            title={
                                <Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />
                            }
                        />
                    )}
                    {fromAccount && quote?.send && !txnErrorString && (
                        <FeePickerCard
                            trade={quote}
                            symbol={fromAccount.symbol}
                            accountKey={fromAccount.key}
                            tradingType="exchange"
                        />
                    )}
                </VStack>
            </ScrollView>

            <Button
                onPress={handleTapContinue}
                isDisabled={flowStep === 'confirm' || !!txnErrorString}
            >
                {flowStepToButtonText[flowStep]}
            </Button>
        </Screen>
    );
};
