import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { type TradingTransactionStatus, type TradingType } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';

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
    const { analytics } = useServices(injectDesktopAnalytics);
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
