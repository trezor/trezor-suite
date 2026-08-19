import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { TradingAccountCard } from '../general/TradingAccountCard';

export type SellFromAccountCardProps = {
    quote?: SellFiatTrade;
};

export const SellFromAccountCard = ({ quote }: SellFromAccountCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const { fromValue } = useChangeStringsExtractor(quote);
    const cryptoId = quote?.cryptoCurrency;

    return (
        <TradingAccountCard
            account={fromAccount}
            cryptoId={cryptoId}
            amount={fromValue}
            direction="from"
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.youPay" />}
        />
    );
};
