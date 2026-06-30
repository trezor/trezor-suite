import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { TradingAccountCard } from '../../general/TradingAccountCard';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
}: ExchangeFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const { fromValue } = useChangeStringsExtractor(quote);

    return (
        <TradingAccountCard
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />}
            account={fromAccount}
            amount={fromValue}
            direction="from"
            cryptoId={quote?.send}
        />
    );
};
