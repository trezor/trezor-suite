import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    isFinalStatus,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { VStack } from '@suite-native/atoms';
import { IconWithSpinner } from '@suite-native/trading-atoms';

import { TradeDetailAlert } from './TradeDetailAlert';
import { type TradeStatusStep, getTradeStatusStep } from '../../../utils/general/utils';
import { TradeStatusBadge } from '../TradeStatusBadge';

type TradeDetailHeaderProps = {
    orderId: string;
    onOpenedBrowser: () => void;
};

export const TradeDetailHeader = ({ orderId, onOpenedBrowser }: TradeDetailHeaderProps) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    if (!trade) {
        return null;
    }

    const isInProgress = !isFinalStatus(trade.tradeType, trade.data.status);

    const statusStep = getTradeStatusStep(trade);

    if ((['success', 'pending'] as TradeStatusStep[]).includes(statusStep)) {
        return (
            <VStack spacing="sp16" alignItems="center" justifyContent="center">
                <IconWithSpinner iconName="arrowsLeftRight" isInProgress={isInProgress} />
                <TradeStatusBadge status={trade.data.status} />
            </VStack>
        );
    }

    return (
        <TradeDetailAlert
            alertType={statusStep}
            provider={trade.data.exchange}
            tradeType={trade.tradeType}
            orderId={orderId}
            onOpenedBrowser={onOpenedBrowser}
        />
    );
};
