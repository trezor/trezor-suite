import { useEffect, useRef } from 'react';

import { type TradingTransaction } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { getTradeStatusStep } from '../../utils/general/utils';

export const useTransactionStateChangeAnalyticsReporting = (deviceTrades: TradingTransaction[]) => {
    // Track previous status for each trade to report analytics on status changes
    const previousStatuses = useRef<Map<string, ReturnType<typeof getTradeStatusStep> | undefined>>(
        new Map(),
    );
    const analytics = useAnalytics();
    // Report analytics for status changes
    useEffect(() => {
        deviceTrades.forEach(trade => {
            // Create a unique key for each trade
            const tradeKey =
                trade.key ||
                ('orderId' in trade.data ? trade.data.orderId : undefined) ||
                ('paymentId' in trade.data ? trade.data.paymentId : undefined) ||
                'unknown';

            // Skip trades with unknown keys entirely
            if (tradeKey === 'unknown' || !trade) {
                return;
            }

            const currentStatus = getTradeStatusStep(trade);
            const previousStatus = previousStatuses.current.get(tradeKey);

            if (currentStatus !== previousStatus) {
                // Only report if we have a previous status (not on first render - the refresh is triggered by the useWatchAllTrades hook) and current status is defined
                if (previousStatus !== undefined && currentStatus !== undefined) {
                    analytics.report({
                        type: events.tradingStatusEvent.name,
                        payload: { type: trade.tradeType, status: currentStatus },
                    });
                }
                // Set the previous status for future comparisons (even if undefined)
                previousStatuses.current.set(tradeKey, currentStatus);
            }
        });
    }, [deviceTrades, analytics]);
};
