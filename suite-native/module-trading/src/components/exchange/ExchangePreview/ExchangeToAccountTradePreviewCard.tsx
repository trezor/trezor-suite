import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { getSimulatedReceiveAmount } from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';
import { TradingAccountCard } from '../../general/TradingAccountCard';

export type ExchangeToAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeToAccountTradePreviewCard = ({
    quote,
}: ExchangeToAccountTradePreviewCardProps) => {
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const { toValue } = useChangeStringsExtractor(quote);
    const { isLoading: isSimulationLoading, data: simulationResult } = useDexExchangeTxSimulation();

    const simulatedReceiveAmount = getSimulatedReceiveAmount(simulationResult, quote?.receive);

    return (
        <TradingAccountCard
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
            account={toAccount?.account}
            amount={simulatedReceiveAmount ?? toValue}
            isAmountLoading={isSimulationLoading}
            direction="to"
            cryptoId={quote?.receive}
        />
    );
};
