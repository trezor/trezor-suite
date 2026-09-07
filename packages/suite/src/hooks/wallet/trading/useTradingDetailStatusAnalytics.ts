import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type TradingTransactionStatus, type TradingType } from '@suite-common/trading';

import { type TradingDetailStatusStep } from 'src/types/trading/tradingDetail';

type UseTradingDetailStatusAnalyticsProps = {
    tradeType: TradingType;
    tradeStatus: TradingTransactionStatus;
    statusStep: TradingDetailStatusStep | undefined;
};

export const useTradingDetailStatusAnalytics = ({
    tradeType,
    tradeStatus,
    statusStep,
}: UseTradingDetailStatusAnalyticsProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const previousTradeStatus = usePrevious(tradeStatus);

    useEffect(() => {
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !statusStep) {
            return;
        }

        analytics.report({
            type: events.tradeStatusEvent.name,
            payload: {
                type: tradeType,
                status: statusStep,
            },
        });
    }, [analytics, previousTradeStatus, statusStep, tradeStatus, tradeType]);
};
