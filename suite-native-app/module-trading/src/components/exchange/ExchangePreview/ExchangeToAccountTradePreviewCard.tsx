import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

import { useExchangeReceiveAmount } from '../../../hooks/exchange/useExchangeReceiveAmount';
import { TradingAccountCard } from '../../general/TradingAccountCard';

export type ExchangeToAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeToAccountTradePreviewCard = ({
    quote,
}: ExchangeToAccountTradePreviewCardProps) => {
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const { isLoading: isSimulationLoading, receiveAmount } = useExchangeReceiveAmount(quote);

    return (
        <TradingAccountCard
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
            account={toAccount?.account}
            amount={receiveAmount}
            isAmountLoading={isSimulationLoading}
            direction="to"
            cryptoId={quote?.receive}
        />
    );
};
