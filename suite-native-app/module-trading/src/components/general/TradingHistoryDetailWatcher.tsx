import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import {
    type TradingRootState,
    selectTradingAccountKeyByOrderId,
} from '@suite-native/trading-state';

import { useWatchTrade } from '../../hooks/general/useWatchTrade';

type TradingHistoryDetailWatcherProps = {
    orderId: string;
};

export const TradingHistoryDetailWatcher = ({ orderId }: TradingHistoryDetailWatcherProps) => {
    const isFocused = useIsFocused();
    const accountKey = useSelector((state: TradingRootState) =>
        selectTradingAccountKeyByOrderId(state, orderId),
    );

    useWatchTrade({
        accountKey,
        orderId,
        isInProgress: true,
        isEnabled: isFocused,
        shouldReportAnalytics: false,
    });

    return null;
};
