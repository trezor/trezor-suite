import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type TradingTransactionExchange,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import {
    TradeStatusProviderLink,
    type TradeStatusStep,
    TradeStatusSubItem,
} from '@suite-native/trading-atoms';
import { type TradingRootState } from '@suite-native/trading-state';

import {
    getExchangeTradeProgress,
    getStepState,
    getTradeStatusUrl,
} from '../utils/tradeStatusUtils';

type TransactionDetailNavigation = StackToStackCompositeNavigationProps<
    RootStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    TransactionDetailStackParamList
>;

export const useExchangeTradeStatusSteps = (trade: TradingTransactionExchange) => {
    const navigation = useNavigation<TransactionDetailNavigation>();
    const progressId = getExchangeTradeProgress(trade.data.status);
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.data.exchange ?? '', trade.tradeType),
    );
    const providerName = provider?.companyName ?? trade.data.exchange ?? '';
    const statusUrl = getTradeStatusUrl(trade) ?? '';
    const isDex = trade.data?.isDex ?? false;

    if (progressId === undefined) {
        return undefined;
    }

    const handleTxIdPress = () => {
        if (trade.data.receiveTxHash && trade.sendAccountKey) {
            navigation.navigate(RootStackRoutes.TransactionDetailStack, {
                screen: TransactionDetailStackRoutes.TransactionDetail,
                params: {
                    txid: trade.data.receiveTxHash,
                    accountKey: trade.sendAccountKey,
                },
            });
        }
    };

    const providerStatusLink = (
        <TradeStatusProviderLink
            providerName={providerName}
            statusUrl={statusUrl}
            key="provider"
            logo={provider?.logo}
        />
    );

    const transactionIdSubItem = (
        <TradeStatusSubItem
            label={
                <Translation id="moduleTrading.tradeHistory.detail.statusStepper.transactionId" />
            }
            value={trade.data.receiveTxHash}
            onPress={handleTxIdPress}
            key="transaction-id"
        />
    );

    const stepsDex: TradeStatusStep[] = [
        {
            id: 'customer-action',
            state: getStepState(progressId, 'customerAction'),
            title: {
                pending: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.customer.exchange.dex.processingTitle"
                        values={{ providerName }}
                    />
                ),
                processing: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.customer.exchange.dex.processingTitle"
                        values={{ providerName }}
                    />
                ),
                completed: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.customer.exchange.dex.completedTitle"
                        values={{ providerName }}
                    />
                ),
            },
            subItems: {
                pending: [],
                processing: [transactionIdSubItem, providerStatusLink],
            },
        },
    ];

    const stepsCex: TradeStatusStep[] = [
        {
            id: 'customer-action',
            state: getStepState(progressId, 'customerAction'),
            title: {
                pending: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.exchange.processingTitle" />
                ),
                processing: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.exchange.processingTitle" />
                ),
                completed: {
                    kind: 'layout',
                    content: (
                        <TradeStatusSubItem
                            label={
                                <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.sell.completedTitle" />
                            }
                            value={trade.data.receiveTxHash}
                            textVariant="body-md"
                            onPress={handleTxIdPress}
                        />
                    ),
                },
            },
            subItems: {
                pending: [],
                processing: [transactionIdSubItem],
            },
        },
        {
            id: 'provider-processing',
            state: getStepState(progressId, 'providerProcessing'),
            title: {
                pending: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.exchange.pendingTitle"
                        values={{ providerName }}
                    />
                ),
                processing: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.exchange.processingTitle"
                        values={{ providerName }}
                    />
                ),
                completed: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.exchange.completedTitle"
                        values={{ providerName }}
                    />
                ),
            },
            subItems: {
                pending: [providerStatusLink],
            },
        },
    ];

    return isDex ? stepsDex : stepsCex;
};
