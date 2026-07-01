import { useSelector } from 'react-redux';

import type { BuyTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';
import { selectBuySelectedReceiveAccount } from '@suite-native/trading-state';

import { TradingAccountCard } from '../../general/TradingAccountCard';

export type BuyPreviewReceiveCardProps = {
    quote: BuyTrade;
};

export const BuyPreviewReceiveCard = ({ quote }: BuyPreviewReceiveCardProps) => {
    const toAccount = useSelector(selectBuySelectedReceiveAccount);
    const { toValue } = useChangeStringsExtractor(quote);

    return (
        <TradingAccountCard
            title={<Translation id="moduleTrading.tradingBuyPreviewScreen.youGet" />}
            account={toAccount?.account}
            amount={toValue}
            direction="to"
            cryptoId={quote?.receiveCurrency}
        />
    );
};
