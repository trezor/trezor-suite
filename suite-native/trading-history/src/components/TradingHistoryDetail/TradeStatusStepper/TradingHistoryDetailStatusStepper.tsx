import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
} from '@suite-common/trading';
import { type TradeStatusStep, TradeStatusStepper } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

import { TradeStatusCard } from './TradeStatusCard';
import { TradeStatusTerminalContent } from './TradeStatusTerminalContent';
import { useBuyTradeStatusSteps } from '../../../hooks/useBuyTradeStatusSteps';
import { useExchangeTradeStatusSteps } from '../../../hooks/useExchangeTradeStatusSteps';
import { useSellTradeStatusSteps } from '../../../hooks/useSellTradeStatusSteps';

type TradeStatusContentProps = {
    trade: TradingTransaction;
    steps: readonly TradeStatusStep[] | undefined;
};

const TradeStatusContent = ({ trade, steps }: TradeStatusContentProps) => {
    if (!steps) {
        return <TradeStatusTerminalContent trade={trade} />;
    }

    return (
        <TradeStatusCard>
            <TradeStatusStepper steps={steps} />
        </TradeStatusCard>
    );
};

const BuyTradeStatusStepper = ({ trade }: { trade: TradingTransactionBuy }) => {
    const steps = useBuyTradeStatusSteps(trade);

    return <TradeStatusContent trade={trade} steps={steps} />;
};

const SellTradeStatusStepper = ({ trade }: { trade: TradingTransactionSell }) => {
    const steps = useSellTradeStatusSteps(trade);

    return <TradeStatusContent trade={trade} steps={steps} />;
};

const ExchangeTradeStatusStepper = ({ trade }: { trade: TradingTransactionExchange }) => {
    const steps = useExchangeTradeStatusSteps(trade);

    return <TradeStatusContent trade={trade} steps={steps} />;
};

type TradingHistoryDetailStatusStepperProps = {
    trade: TradingTransaction;
};

export const TradingHistoryDetailStatusStepper = ({
    trade,
}: TradingHistoryDetailStatusStepperProps) => {
    switch (trade.tradeType) {
        case 'buy':
            return <BuyTradeStatusStepper trade={trade} />;
        case 'sell':
            return <SellTradeStatusStepper trade={trade} />;
        case 'exchange':
            return <ExchangeTradeStatusStepper trade={trade} />;
        default:
            return exhaustive(trade);
    }
};
