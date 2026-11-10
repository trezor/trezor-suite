import { type PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { TradeInfo } from '../../general/TradeInfo/TradeInfo';

export type ExchangeInfoProps = {
    quote?: ExchangeTrade;
} & PropsWithChildren;

export const ExchangeInfo = ({ quote, children }: ExchangeInfoProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!fromAccount || !quote?.send) {
        return null;
    }

    return (
        <TradeInfo trade={quote} accountKey={fromAccount.key} tradingType="exchange">
            {children}
        </TradeInfo>
    );
};
