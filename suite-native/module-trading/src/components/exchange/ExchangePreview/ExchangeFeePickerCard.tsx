import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { selectExchangeSelectedSendAccount } from '../../../selectors/exchangeSelectors';
import { FeePickerCard } from '../../fees/FeePickerCard';

export type ExchangeFeePickerCardProps = {
    quote?: ExchangeTrade;
    isTxnError: boolean;
};

export const ExchangeFeePickerCard = ({ quote, isTxnError }: ExchangeFeePickerCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!fromAccount || !quote?.send || isTxnError) {
        return null;
    }

    return (
        <FeePickerCard
            trade={quote}
            symbol={fromAccount.symbol}
            accountKey={fromAccount.key}
            tradingType="exchange"
        />
    );
};
