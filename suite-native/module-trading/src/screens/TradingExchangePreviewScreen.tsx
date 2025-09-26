import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { parseCryptoId, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
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
import { useDebounce } from '@trezor/react-utils';

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

export const TradingExchangePreviewScreen = ({ navigation }: TradingExchangePreviewScreenProps) => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { isInternetReachable } = useNetInfo();
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);
    const hasRequestedTradeConfirmation = useRef(false);
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);

    useSubscribeForSolanaBlockUpdates(fromAccount ?? null);

    const { txnErrorString, confirmTrade, fetchFeesAndCompose } = useExchangeFlow();

    const [isConfirmationErrorRequested, setIsConfirmationErrorRequested] =
        useState<boolean>(false);

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
            }
        } catch (e) {
            debounce(() => {
                setIsConfirmationErrorRequested(true);
            });

            console.error('Failed to confirm trade', e);
        }
    }, [confirmTrade, debounce, fetchFeesAndCompose, fromAccount, quote, toAccount]);

    useEffect(() => {
        if (isConfirmationErrorRequested) {
            const description =
                isInternetReachable === false ? (
                    <Translation id="moduleTrading.error.deviceOfflineDescription" />
                ) : undefined;

            showAlert({
                title: (
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.confirmationAlertTitle" />
                ),
                description,
                primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleConfirmTrade,
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonVariant: 'redElevation0',
                onPressSecondaryButton: () => {
                    navigation.popToTop();
                },
            });
            setIsConfirmationErrorRequested(false);
        }
    }, [
        handleConfirmTrade,
        isConfirmationErrorRequested,
        isInternetReachable,
        navigation,
        showAlert,
    ]);

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

            {precomposedTransaction?.type === 'final' && (
                <Button onPress={handleSignTransaction} isDisabled={!!txnErrorString}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            )}
        </Screen>
    );
};
