import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { FeePickerCard } from '../../fees/FeePickerCard';

export type SellFeePickerCardProps = {
    quote?: SellFiatTrade;
    isTxnError: boolean;
};

export const SellFeePickerCard = ({ quote, isTxnError }: SellFeePickerCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);

    if (!fromAccount || !quote?.cryptoCurrency || isTxnError) {
        return null;
    }

    return (
        <FeePickerCard
            trade={quote}
            symbol={fromAccount.symbol}
            accountKey={fromAccount.key}
            tradingType="sell"
        />
    );
};
