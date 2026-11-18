import { useSelector } from 'react-redux';

import {
    type TradingTransactionSell,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import {
    TradeStatusProviderLink,
    type TradeStatusStep,
    TradeStatusSubItem,
} from '@suite-native/trading-atoms';
import { type TradingRootState } from '@suite-native/trading-state';

import { useOpenTradeTransaction } from './useOpenTradeTransaction';
import { getSellTradeProgress, getStepState, getTradeStatusUrl } from '../utils/tradeStatusUtils';

export const useSellTradeStatusSteps = (trade: TradingTransactionSell) => {
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.data.exchange ?? '', trade.tradeType),
    );
    const progressId = getSellTradeProgress(trade.data.status);
    const providerName = provider?.companyName ?? trade.data.exchange ?? '';
    const statusUrl = getTradeStatusUrl(trade) ?? '';

    const handleTxIdPress = useOpenTradeTransaction({
        txid: trade.data.txid,
        sendAccountKey: trade.sendAccountKey,
    });

    if (progressId === undefined) {
        return undefined;
    }

    const providerStatusLink = (
        <TradeStatusProviderLink
            providerName={providerName}
            statusUrl={statusUrl}
            key="provider"
            logo={provider?.logo}
            isActive={progressId === 'providerProcessing'}
        />
    );

    const steps: TradeStatusStep[] = [
        {
            id: 'customer-action',
            state: getStepState(progressId, 'customerAction'),
            title: {
                pending: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.sell.processingTitle" />
                ),
                processing: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.sell.processingTitle" />
                ),
                completed: {
                    kind: 'layout',
                    content: (
                        <TradeStatusSubItem
                            label={
                                <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.sell.completedTitle" />
                            }
                            value={trade.data.txid}
                            textVariant="body-md"
                            onPress={handleTxIdPress}
                            isActive={false}
                        />
                    ),
                },
            },
            subItems: {
                pending: [],
            },
        },
        {
            id: 'provider-processing',
            state: getStepState(progressId, 'providerProcessing'),
            title: {
                pending: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.sell.pendingTitle"
                        values={{ providerName }}
                    />
                ),
                processing: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.sell.processingTitle"
                        values={{ providerName }}
                    />
                ),
                completed: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.sell.completedTitle"
                        values={{ providerName }}
                    />
                ),
            },
            subItems: {
                pending: [providerStatusLink],
                processing: [
                    <TradeStatusSubItem
                        label={
                            <Translation
                                id="moduleTrading.tradeHistory.detail.statusStepper.provider.sell.description"
                                values={{ providerName }}
                            />
                        }
                        key="description"
                    />,
                    providerStatusLink,
                ],
                completed: [providerStatusLink],
            },
        },
    ];

    return steps;
};
