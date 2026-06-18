import { type PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { FeePickerCard } from '../../fees/FeePickerCard';

export type ExchangeInfoProps = {
    quote?: ExchangeTrade;
    isTxnError: boolean;
} & PropsWithChildren;

export const ExchangeInfo = ({ quote, isTxnError, children }: ExchangeInfoProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!fromAccount || !quote?.send || isTxnError) {
        return null;
    }

    return (
        <FeePickerCard trade={quote} accountKey={fromAccount.key} tradingType="exchange">
            {children}
        </FeePickerCard>
    );
};
