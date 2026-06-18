import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import {
    selectSellSelectedSendAccount,
    selectTradingProviderConfirmationStatus,
} from '@suite-native/trading-state';

import { TradeInfo } from '../../general/TradeInfo/TradeInfo';

export type SellInfoProps = {
    quote?: SellFiatTrade;
    isTxnError: boolean;
};

export const SellInfo = ({ quote, isTxnError }: SellInfoProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const providerConfirmationStatus = useSelector(selectTradingProviderConfirmationStatus);

    const isTradeConfirmedOnProviderSide = providerConfirmationStatus === 'confirmation_success';

    if (!fromAccount || !quote?.cryptoCurrency || isTxnError || !isTradeConfirmedOnProviderSide) {
        return null;
    }

    return <TradeInfo trade={quote} accountKey={fromAccount.key} tradingType="sell" />;
};
