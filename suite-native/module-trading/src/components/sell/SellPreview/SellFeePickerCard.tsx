import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import {
    selectSellSelectedSendAccount,
    selectTradingProviderConfirmationStatus,
} from '@suite-native/trading-state';

import { FeePickerCard } from '../../fees/FeePickerCard';

export type SellFeePickerCardProps = {
    quote?: SellFiatTrade;
    isTxnError: boolean;
};

export const SellFeePickerCard = ({ quote, isTxnError }: SellFeePickerCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const providerConfirmationStatus = useSelector(selectTradingProviderConfirmationStatus);

    const isTradeConfirmedOnProviderSide = providerConfirmationStatus === 'confirmation_success';

    if (!fromAccount || !quote?.cryptoCurrency || isTxnError || !isTradeConfirmedOnProviderSide) {
        return null;
    }

    return <FeePickerCard trade={quote} accountKey={fromAccount.key} tradingType="sell" />;
};
