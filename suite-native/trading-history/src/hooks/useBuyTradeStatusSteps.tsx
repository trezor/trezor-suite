import { useSelector } from 'react-redux';

import {
    type TradingTransactionBuy,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import {
    TradeStatusProviderLink,
    type TradeStatusStep,
    TradeStatusSubItem,
} from '@suite-native/trading-atoms';
import { type TradingRootState } from '@suite-native/trading-state';

import { getBuyTradeProgress, getStepState, getTradeStatusUrl } from '../utils/tradeStatusUtils';

export const useBuyTradeStatusSteps = (trade: TradingTransactionBuy) => {
    const progressId = getBuyTradeProgress(trade.data.status);

    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.data.exchange ?? '', trade.tradeType),
    );

    if (progressId === undefined) {
        return undefined;
    }

    const providerName = provider?.companyName ?? trade.data.exchange ?? '';
    const statusUrl = getTradeStatusUrl(trade) ?? '';

    const providerStatusLink = (
        <TradeStatusProviderLink
            providerName={providerName}
            statusUrl={statusUrl}
            key="provider"
            logo={provider?.logo}
        />
    );

    const steps: TradeStatusStep[] = [
        {
            id: 'customer-action',
            state: getStepState(progressId, 'customerAction'),
            title: {
                pending: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.buy.processingTitle" />
                ),
                processing: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.buy.processingTitle" />
                ),
                completed: (
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.buy.completedTitle" />
                ),
            },
            subItems: {
                pending: [],
                processing: [
                    <TradeStatusSubItem
                        label={
                            <Translation id="moduleTrading.tradeHistory.detail.statusStepper.customer.buy.processingDescription" />
                        }
                        key="payment-description"
                    />,
                ],
                completed: [],
            },
        },
        {
            id: 'provider-processing',
            state: getStepState(progressId, 'providerProcessing'),
            title: {
                pending: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.buy.pendingTitle"
                        values={{ providerName }}
                    />
                ),
                processing: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.buy.processingTitle"
                        values={{ providerName }}
                    />
                ),
                completed: (
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.buy.completedTitle"
                        values={{ providerName }}
                    />
                ),
            },
            subItems: {
                pending: [providerStatusLink],
                processing: [providerStatusLink],
                completed: [providerStatusLink],
            },
        },
    ];

    return steps;
};
